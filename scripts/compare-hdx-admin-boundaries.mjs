import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
import {
  districtRecordSchema,
  governorateRecordSchema,
  parseJsonArray,
  readJson,
  subdistrictRecordSchema,
} from './lib/data-schemas.mjs';

const root = process.cwd();
const dataDirectory = path.resolve(root, getCliOption('--data-dir') ?? 'data');
const sourceXlsx = path.resolve(
  root,
  getCliOption('--source-xlsx') ??
    'imports/raw/2026-06-28-ocha-admin-boundaries/syr_admin_boundaries.xlsx',
);
const outputDirectory = path.resolve(root, getCliOption('--out-dir') ?? 'dist/coverage');
const maxItems = Number.parseInt(getCliOption('--max-items') ?? '25', 10);
const areaThresholdKm2 = Number.parseFloat(getCliOption('--area-threshold-km2') ?? '1');
const centroidThresholdDegrees = Number.parseFloat(
  getCliOption('--centroid-threshold-degrees') ?? '0.05',
);

if (!Number.isInteger(maxItems) || maxItems < 1) {
  throw new Error('--max-items must be a positive integer');
}

if (!Number.isFinite(areaThresholdKm2) || areaThresholdKm2 < 0) {
  throw new Error('--area-threshold-km2 must be a non-negative number');
}

if (!Number.isFinite(centroidThresholdDegrees) || centroidThresholdDegrees < 0) {
  throw new Error('--centroid-threshold-degrees must be a non-negative number');
}

const [governorates, districts, subdistricts] = await Promise.all([
  loadRecords('governorates', governorateRecordSchema),
  loadRecords('districts', districtRecordSchema),
  loadRecords('subdistricts', subdistrictRecordSchema),
]);

const sheets = await parseWorkbook(sourceXlsx);
const governoratesById = new Map(governorates.map((record) => [record.id, record]));
const districtsById = new Map(districts.map((record) => [record.id, record]));

const report = {
  generatedAt: new Date().toISOString(),
  sourceXlsx: path.relative(root, sourceXlsx).replaceAll('\\', '/'),
  dataDirectory: path.relative(root, dataDirectory).replaceAll('\\', '/') || '.',
  thresholds: {
    areaKm2: areaThresholdKm2,
    centroidDegrees: centroidThresholdDegrees,
  },
  levels: {
    governorates: compareLevel({
      label: 'governorates',
      records: governorates,
      sourceRows: rowsToObjects(sheets.syr_admin1),
      pcodeField: 'adm1_pcode',
      nameField: 'adm1_name',
      arabicNameField: 'adm1_name1',
    }),
    districts: compareLevel({
      label: 'districts',
      records: districts,
      sourceRows: rowsToObjects(sheets.syr_admin2),
      pcodeField: 'adm2_pcode',
      nameField: 'adm2_name',
      arabicNameField: 'adm2_name1',
      parentPcodeField: 'adm1_pcode',
      getDataParentPcode: (record) =>
        governoratesById.get(record.governorateId)?.externalIds.ochaPcode ?? null,
    }),
    subdistricts: compareLevel({
      label: 'subdistricts',
      records: subdistricts,
      sourceRows: rowsToObjects(sheets.syr_admin3),
      pcodeField: 'adm3_pcode',
      nameField: 'adm3_name',
      arabicNameField: 'adm3_name1',
      parentPcodeField: 'adm2_pcode',
      getDataParentPcode: (record) =>
        districtsById.get(record.districtId)?.externalIds.ochaPcode ?? null,
    }),
  },
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, 'hdx-admin-boundary-comparison.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);
await writeFile(
  path.join(outputDirectory, 'HDX_ADMIN_BOUNDARY_COMPARISON.md'),
  renderMarkdown(report),
);

console.log(
  JSON.stringify(
    {
      ok: hasNoStrictMismatches(report),
      sourceXlsx: report.sourceXlsx,
      outputDirectory: path.relative(root, outputDirectory).replaceAll('\\', '/'),
      levels: Object.fromEntries(
        Object.entries(report.levels).map(([level, result]) => [
          level,
          {
            sourceRecords: result.sourceRecords,
            dataRecords: result.dataRecords,
            missingInData: result.missingInData.length,
            extraInData: result.extraInData.length,
            parentMismatches: result.parentMismatches.length,
            nameVariants: result.nameVariants.length,
            arabicNameVariants: result.arabicNameVariants.length,
            areaDifferences: result.areaDifferences.length,
            centroidDifferences: result.centroidDifferences.length,
          },
        ]),
      ),
    },
    null,
    2,
  ),
);

function getCliOption(name) {
  const equalArg = process.argv.find((arg) => arg.startsWith(`${name}=`));
  const optionIndex = process.argv.indexOf(name);

  if (!equalArg && optionIndex !== -1 && process.argv[optionIndex + 1] === undefined) {
    throw new Error(`${name} requires a value`);
  }

  const value =
    equalArg?.slice(`${name}=`.length) ??
    (optionIndex === -1 ? undefined : process.argv[optionIndex + 1]);

  if (value === '' || value?.startsWith('--')) {
    throw new Error(`${name} requires a value`);
  }

  return value;
}

async function loadRecords(name, schema) {
  return parseJsonArray(schema, await readJson(path.join(dataDirectory, `${name}.json`)), name);
}

async function parseWorkbook(filePath) {
  const entries = readZipEntries(await readFile(filePath));
  const sharedStrings = parseSharedStrings(entries.get('xl/sharedStrings.xml') ?? '');
  const relationships = parseRelationships(entries.get('xl/_rels/workbook.xml.rels') ?? '');
  const workbook = entries.get('xl/workbook.xml');

  if (!workbook) {
    throw new Error(`${filePath} is missing xl/workbook.xml`);
  }

  const sheets = {};

  for (const sheet of parseSheets(workbook)) {
    const target = relationships.get(sheet.relationshipId);

    if (!target) {
      continue;
    }

    const sheetPath = normalizeWorkbookTarget(target);
    const sheetXml = entries.get(sheetPath);

    if (!sheetXml) {
      continue;
    }

    sheets[sheet.name] = parseSheetRows(sheetXml, sharedStrings);
  }

  for (const requiredSheet of ['syr_admin1', 'syr_admin2', 'syr_admin3']) {
    if (!sheets[requiredSheet]) {
      throw new Error(`${filePath} is missing required sheet: ${requiredSheet}`);
    }
  }

  return sheets;
}

function readZipEntries(buffer) {
  const entries = new Map();
  const endOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(endOffset + 10);
  let centralDirectoryOffset = buffer.readUInt32LE(endOffset + 16);

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(centralDirectoryOffset) !== 0x02014b50) {
      throw new Error('Invalid ZIP central directory header');
    }

    const compressionMethod = buffer.readUInt16LE(centralDirectoryOffset + 10);
    const compressedSize = buffer.readUInt32LE(centralDirectoryOffset + 20);
    const fileNameLength = buffer.readUInt16LE(centralDirectoryOffset + 28);
    const extraFieldLength = buffer.readUInt16LE(centralDirectoryOffset + 30);
    const commentLength = buffer.readUInt16LE(centralDirectoryOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(centralDirectoryOffset + 42);
    const fileNameStart = centralDirectoryOffset + 46;
    const fileName = buffer
      .subarray(fileNameStart, fileNameStart + fileNameLength)
      .toString('utf8');

    if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      throw new Error(`Invalid ZIP local header for ${fileName}`);
    }

    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraFieldLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
    const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);
    const data =
      compressionMethod === 0
        ? compressedData
        : compressionMethod === 8
          ? inflateRawSync(compressedData)
          : null;

    if (!data) {
      throw new Error(`Unsupported ZIP compression method ${compressionMethod} for ${fileName}`);
    }

    entries.set(fileName, data.toString('utf8'));
    centralDirectoryOffset += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return entries;
}

function findEndOfCentralDirectory(buffer) {
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      return index;
    }
  }

  throw new Error('Invalid ZIP file: end of central directory was not found');
}

function parseSharedStrings(xml) {
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
    [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((textMatch) => decodeXml(stripTags(textMatch[1])))
      .join(''),
  );
}

function parseRelationships(xml) {
  const relationships = new Map();

  for (const match of xml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const attributes = parseAttributes(match[1]);
    relationships.set(attributes.Id, attributes.Target);
  }

  return relationships;
}

function parseSheets(xml) {
  return [...xml.matchAll(/<sheet\b([^>]*)\/?>/g)].map((match) => {
    const attributes = parseAttributes(match[1]);

    return {
      name: attributes.name,
      relationshipId: attributes['r:id'],
    };
  });
}

function normalizeWorkbookTarget(target) {
  if (target.startsWith('/')) {
    return target.slice(1);
  }

  if (target.startsWith('xl/')) {
    return target;
  }

  return `xl/${target}`;
}

function parseSheetRows(xml, sharedStrings) {
  const rows = [];

  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const values = [];

    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = parseAttributes(cellMatch[1]);
      const columnIndex = cellColumnIndex(attributes.r ?? 'A1');

      while (values.length <= columnIndex) {
        values.push('');
      }

      values[columnIndex] = readCellValue(cellMatch[2], attributes, sharedStrings);
    }

    rows.push(values);
  }

  return rows;
}

function readCellValue(xml, attributes, sharedStrings) {
  if (attributes.t === 'inlineStr') {
    return decodeXml(stripTags(xml));
  }

  const valueMatch = xml.match(/<v\b[^>]*>([\s\S]*?)<\/v>/);
  const value = valueMatch ? decodeXml(valueMatch[1]) : '';

  if (attributes.t === 's' && value !== '') {
    return sharedStrings[Number.parseInt(value, 10)] ?? '';
  }

  return value;
}

function parseAttributes(value) {
  const attributes = {};

  for (const match of value.matchAll(/([A-Za-z_:][A-Za-z0-9_:.-]*)="([^"]*)"/g)) {
    attributes[match[1]] = decodeXml(match[2]);
  }

  return attributes;
}

function decodeXml(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function stripTags(value) {
  let sanitized = value;
  let previous;

  do {
    previous = sanitized;
    sanitized = sanitized.replace(/<[^>]+>/g, '');
  } while (sanitized !== previous);

  return sanitized;
}

function cellColumnIndex(cellReference) {
  const letters = cellReference.replace(/[^A-Z]/gi, '').toUpperCase();
  let index = 0;

  for (const letter of letters) {
    index = index * 26 + letter.charCodeAt(0) - 64;
  }

  return index - 1;
}

function rowsToObjects(rows) {
  const [headers, ...dataRows] = rows;

  return dataRows.map((row) => {
    const record = {};

    for (const [index, header] of headers.entries()) {
      record[header] = row[index] ?? '';
    }

    return record;
  });
}

function compareLevel({
  records,
  sourceRows,
  pcodeField,
  nameField,
  arabicNameField,
  parentPcodeField,
  getDataParentPcode,
}) {
  const recordsByPcode = new Map(
    records
      .filter((record) => Boolean(record.externalIds.ochaPcode))
      .map((record) => [record.externalIds.ochaPcode, record]),
  );
  const sourceRowsByPcode = new Map(sourceRows.map((row) => [row[pcodeField], row]));

  const missingInData = difference([...sourceRowsByPcode.keys()], recordsByPcode);
  const extraInData = difference([...recordsByPcode.keys()], sourceRowsByPcode);
  const parentMismatches = [];
  const nameVariants = [];
  const arabicNameVariants = [];
  const areaDifferences = [];
  const centroidDifferences = [];

  for (const [pcode, sourceRow] of sourceRowsByPcode) {
    const record = recordsByPcode.get(pcode);

    if (!record) {
      continue;
    }

    if (parentPcodeField && getDataParentPcode) {
      const dataParentPcode = getDataParentPcode(record);
      const sourceParentPcode = sourceRow[parentPcodeField] || null;

      if (dataParentPcode !== sourceParentPcode) {
        parentMismatches.push({
          id: record.id,
          pcode,
          dataParentPcode,
          sourceParentPcode,
        });
      }
    }

    if (normalizeText(record.name.en) !== normalizeText(sourceRow[nameField])) {
      nameVariants.push({
        id: record.id,
        pcode,
        data: record.name.en,
        source: sourceRow[nameField],
      });
    }

    if (
      sourceRow[arabicNameField] &&
      normalizeText(record.name.ar) !== normalizeText(sourceRow[arabicNameField])
    ) {
      arabicNameVariants.push({
        id: record.id,
        pcode,
        data: record.name.ar ?? null,
        source: sourceRow[arabicNameField],
      });
    }

    const sourceArea = parseNumber(sourceRow.area_sqkm);
    const dataArea = record.area?.value ?? null;

    if (
      sourceArea !== null &&
      dataArea !== null &&
      Math.abs(dataArea - sourceArea) > areaThresholdKm2
    ) {
      areaDifferences.push({
        id: record.id,
        pcode,
        data: dataArea,
        source: sourceArea,
        delta: round(dataArea - sourceArea, 3),
      });
    }

    const sourceLatitude = parseNumber(sourceRow.center_lat);
    const sourceLongitude = parseNumber(sourceRow.center_lon);

    if (record.centroid && sourceLatitude !== null && sourceLongitude !== null) {
      const latitudeDelta = record.centroid.latitude - sourceLatitude;
      const longitudeDelta = record.centroid.longitude - sourceLongitude;

      if (
        Math.abs(latitudeDelta) > centroidThresholdDegrees ||
        Math.abs(longitudeDelta) > centroidThresholdDegrees
      ) {
        centroidDifferences.push({
          id: record.id,
          pcode,
          data: record.centroid,
          source: {
            latitude: sourceLatitude,
            longitude: sourceLongitude,
          },
          delta: {
            latitude: round(latitudeDelta, 6),
            longitude: round(longitudeDelta, 6),
          },
        });
      }
    }
  }

  return {
    sourceRecords: sourceRows.length,
    dataRecords: records.length,
    missingInData,
    extraInData,
    parentMismatches,
    nameVariants,
    arabicNameVariants,
    areaDifferences: areaDifferences.sort(
      (left, right) => Math.abs(right.delta) - Math.abs(left.delta),
    ),
    centroidDifferences: centroidDifferences.sort(
      (left, right) => maxAbsDelta(right.delta) - maxAbsDelta(left.delta),
    ),
  };
}

function difference(values, referenceMap) {
  return values.filter((value) => !referenceMap.has(value)).sort();
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{Mark}/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '');
}

function parseNumber(value) {
  if (value === '' || value === undefined || value === null) {
    return null;
  }

  const number = Number.parseFloat(value);

  return Number.isFinite(number) ? number : null;
}

function round(value, digits) {
  const multiplier = 10 ** digits;

  return Math.round(value * multiplier) / multiplier;
}

function maxAbsDelta(delta) {
  return Math.max(Math.abs(delta.latitude), Math.abs(delta.longitude));
}

function hasNoStrictMismatches(comparisonReport) {
  return Object.values(comparisonReport.levels).every(
    (level) =>
      level.missingInData.length === 0 &&
      level.extraInData.length === 0 &&
      level.parentMismatches.length === 0,
  );
}

function renderMarkdown(comparisonReport) {
  const lines = [
    '# HDX Admin Boundary Comparison',
    '',
    'Generated source QA report for the canonical ADM1, ADM2, and ADM3 records.',
    '',
    `- Generated at: ${comparisonReport.generatedAt}`,
    `- Source workbook: \`${comparisonReport.sourceXlsx}\``,
    `- Data directory: \`${comparisonReport.dataDirectory}\``,
    `- Area threshold: ${comparisonReport.thresholds.areaKm2} km2`,
    `- Centroid threshold: ${comparisonReport.thresholds.centroidDegrees} degrees`,
    '',
    '## Summary',
    '',
    '| Level | Source | Data | Missing in data | Extra in data | Parent mismatches | Name variants | Arabic variants | Area differences | Centroid differences |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];

  for (const [level, result] of Object.entries(comparisonReport.levels)) {
    lines.push(
      `| ${level} | ${result.sourceRecords} | ${result.dataRecords} | ${result.missingInData.length} | ${result.extraInData.length} | ${result.parentMismatches.length} | ${result.nameVariants.length} | ${result.arabicNameVariants.length} | ${result.areaDifferences.length} | ${result.centroidDifferences.length} |`,
    );
  }

  lines.push('', '## Strict Mismatches', '');

  for (const [level, result] of Object.entries(comparisonReport.levels)) {
    lines.push(`### ${titleCase(level)}`, '');
    lines.push(renderList('Missing in data', result.missingInData));
    lines.push(renderList('Extra in data', result.extraInData));
    lines.push(renderObjectTable('Parent mismatches', result.parentMismatches));
  }

  lines.push('', '## Review Queues', '');

  for (const [level, result] of Object.entries(comparisonReport.levels)) {
    lines.push(`### ${titleCase(level)}`, '');
    lines.push(renderObjectTable('Name variants', result.nameVariants.slice(0, maxItems)));
    lines.push(
      renderObjectTable('Arabic name variants', result.arabicNameVariants.slice(0, maxItems)),
    );
    lines.push(
      renderObjectTable('Largest area differences', result.areaDifferences.slice(0, maxItems)),
    );
    lines.push(
      renderObjectTable(
        'Largest centroid differences',
        result.centroidDifferences.slice(0, maxItems),
      ),
    );
  }

  lines.push(
    '',
    'Name, area, and centroid differences are review queues, not automatic errors. Strict mismatches are missing P-codes, extra P-codes, and parent P-code disagreements.',
    '',
  );

  return `${lines.join('\n')}\n`;
}

function renderList(label, values) {
  if (values.length === 0) {
    return `**${label}:** none\n`;
  }

  return [`**${label}:**`, '', ...values.map((value) => `- \`${value}\``), ''].join('\n');
}

function renderObjectTable(label, rows) {
  if (rows.length === 0) {
    return `**${label}:** none\n`;
  }

  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const lines = [
    `**${label}:**`,
    '',
    `| ${columns.map(escapeMarkdown).join(' | ')} |`,
    `| ${columns.map(() => '---').join(' | ')} |`,
  ];

  for (const row of rows) {
    lines.push(`| ${columns.map((column) => formatCell(row[column])).join(' | ')} |`);
  }

  lines.push('');

  return lines.join('\n');
}

function formatCell(value) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  if (typeof value === 'object') {
    return `\`${escapeMarkdown(JSON.stringify(value))}\``;
  }

  return escapeMarkdown(String(value));
}

function escapeMarkdown(value) {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
