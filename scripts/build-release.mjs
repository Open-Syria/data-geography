import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  datasetReleaseStatusSchema,
  districtRecordSchema,
  governorateRecordSchema,
  localityRecordSchema,
  parseJsonArray,
  readJson,
  releaseManifestSchema,
  sourceRecordSchema,
  subdistrictRecordSchema,
} from './lib/data-schemas.mjs';

const root = process.cwd();
const dataDirectory = path.resolve(root, getCliOption('--data-dir') ?? 'data');
const releaseDirectory = path.resolve(root, getCliOption('--release-dir') ?? 'dist/release');
const packageJson = await readJson(path.join(root, 'package.json'));
const releaseVersion = process.env.RELEASE_VERSION ?? `v${packageJson.version}`;
const releaseStatus = datasetReleaseStatusSchema.parse(process.env.RELEASE_STATUS ?? 'seed');
const releasePublishedAt = process.env.RELEASE_PUBLISHED_AT ?? null;
const assetBaseUrl = process.env.RELEASE_ASSET_BASE_URL;

const datasetConfigs = [
  {
    name: 'governorates',
    tableName: 'governorates',
    fileName: 'governorates.json',
    schema: governorateRecordSchema,
    columns: [
      'id',
      'name_en',
      'name_ar',
      'aliases_json',
      'iso31662',
      'centroid_latitude',
      'centroid_longitude',
      'area_km2',
      'area_source_ids_json',
      'population',
      'population_year',
      'population_source_ids_json',
      'wikidata_id',
      'geonames_id',
      'geoboundaries_id',
      'source_ids_json',
      'source_status',
    ],
  },
  {
    name: 'districts',
    tableName: 'districts',
    fileName: 'districts.json',
    schema: districtRecordSchema,
    columns: [
      'id',
      'governorate_id',
      'name_en',
      'name_ar',
      'aliases_json',
      'centroid_latitude',
      'centroid_longitude',
      'area_km2',
      'area_source_ids_json',
      'population',
      'population_year',
      'population_source_ids_json',
      'wikidata_id',
      'geonames_id',
      'geoboundaries_id',
      'source_ids_json',
      'source_status',
    ],
  },
  {
    name: 'subdistricts',
    tableName: 'subdistricts',
    fileName: 'subdistricts.json',
    schema: subdistrictRecordSchema,
    columns: [
      'id',
      'governorate_id',
      'district_id',
      'name_en',
      'name_ar',
      'aliases_json',
      'centroid_latitude',
      'centroid_longitude',
      'wikidata_id',
      'geonames_id',
      'geoboundaries_id',
      'source_ids_json',
      'source_status',
    ],
  },
  {
    name: 'localities',
    tableName: 'localities',
    fileName: 'localities.json',
    schema: localityRecordSchema,
    columns: [
      'id',
      'governorate_id',
      'district_id',
      'subdistrict_id',
      'kind',
      'name_en',
      'name_ar',
      'aliases_json',
      'centroid_latitude',
      'centroid_longitude',
      'wikidata_id',
      'geonames_id',
      'geoboundaries_id',
      'source_ids_json',
      'source_status',
    ],
  },
];

const artifactFormats = [
  {
    extension: 'json',
    format: 'json',
    mediaType: 'application/json',
    serialize: ({ records }) => stringifyJson({ items: records }),
  },
  {
    extension: 'ndjson',
    format: 'ndjson',
    mediaType: 'application/x-ndjson',
    serialize: ({ records }) => records.map((record) => stringifyCompactJson(record)).join('\n'),
  },
  {
    extension: 'csv',
    format: 'csv',
    mediaType: 'text/csv',
    serialize: ({ columns, rows }) => serializeCsv(columns, rows),
  },
  {
    extension: 'sql',
    format: 'sql',
    mediaType: 'application/sql',
    serialize: ({ columns, rows, tableName }) => serializeSql(tableName, columns, rows),
  },
  {
    extension: 'yaml',
    format: 'yaml',
    mediaType: 'application/yaml',
    serialize: ({ records }) => serializeYaml({ items: records }),
  },
  {
    extension: 'xml',
    format: 'xml',
    mediaType: 'application/xml',
    serialize: ({ name, records }) => serializeXml(name, records),
  },
];

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

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function getArtifactUrl(relativePath) {
  if (!assetBaseUrl) {
    return undefined;
  }

  return `${assetBaseUrl.replace(/\/$/, '')}/${relativePath}`;
}

function escapeNonAscii(value) {
  return value.replace(
    /[\u007f-\uffff]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}

function stringifyJson(data) {
  return escapeNonAscii(JSON.stringify(data, null, 2));
}

function stringifyCompactJson(data) {
  return escapeNonAscii(JSON.stringify(data));
}

function toPublicRecord(record) {
  return removeUndefined({
    id: record.id,
    governorateId: record.governorateId,
    districtId: record.districtId,
    subdistrictId: record.subdistrictId,
    kind: record.kind,
    name: record.name,
    aliases: record.aliases,
    iso31662: record.iso31662,
    centroid: record.centroid,
    area: record.area,
    population: record.population,
    externalIds: record.externalIds,
    sourceIds: record.sourceIds,
    sourceStatus: record.sourceStatus,
  });
}

function removeUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  );
}

function toFlatRow(record) {
  return {
    id: record.id,
    governorate_id: record.governorateId ?? null,
    district_id: record.districtId ?? null,
    subdistrict_id: record.subdistrictId ?? null,
    kind: record.kind ?? null,
    name_en: record.name.en,
    name_ar: record.name.ar ?? null,
    aliases_json: stringifyCompactJson(record.aliases),
    iso31662: record.iso31662 ?? null,
    centroid_latitude: record.centroid?.latitude ?? null,
    centroid_longitude: record.centroid?.longitude ?? null,
    area_km2: record.area?.value ?? null,
    area_source_ids_json: stringifyCompactJson(record.area?.sourceIds ?? []),
    population: record.population?.value ?? null,
    population_year: record.population?.year ?? null,
    population_source_ids_json: stringifyCompactJson(record.population?.sourceIds ?? []),
    wikidata_id: record.externalIds.wikidata ?? null,
    geonames_id: record.externalIds.geonames ?? null,
    geoboundaries_id: record.externalIds.geoboundaries ?? null,
    source_ids_json: stringifyCompactJson(record.sourceIds),
    source_status: record.sourceStatus,
  };
}

function formatTextArtifact(content) {
  if (content.length === 0) {
    return Buffer.from('');
  }

  return Buffer.from(`${content}\n`);
}

async function writeArtifact(relativePath, content) {
  const buffer = formatTextArtifact(content);
  const filePath = path.join(releaseDirectory, relativePath);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);

  return buffer;
}

async function writeJson(filePath, data) {
  const buffer = Buffer.from(`${stringifyJson(data)}\n`);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);

  return buffer;
}

function csvEscape(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = escapeNonAscii(String(value));

  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function serializeCsv(columns, rows) {
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(',')),
  ].join('\n');
}

function sqlIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function sqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return `'${escapeNonAscii(String(value)).replaceAll("'", "''")}'`;
}

function sqlColumnType(column) {
  if (column === 'centroid_latitude' || column === 'centroid_longitude' || column === 'area_km2') {
    return 'REAL';
  }

  if (column === 'population' || column === 'population_year') {
    return 'INTEGER';
  }

  return 'TEXT';
}

function serializeSql(tableName, columns, rows) {
  const createTable = [
    `CREATE TABLE IF NOT EXISTS ${sqlIdentifier(tableName)} (`,
    columns
      .map((column, index) => {
        const suffix = index === columns.length - 1 ? '' : ',';
        const primaryKey = column === 'id' ? ' PRIMARY KEY' : '';

        return `  ${sqlIdentifier(column)} ${sqlColumnType(column)}${primaryKey}${suffix}`;
      })
      .join('\n'),
    ');',
  ].join('\n');

  const inserts = rows.map((row) => {
    const identifiers = columns.map(sqlIdentifier).join(', ');
    const values = columns.map((column) => sqlValue(row[column])).join(', ');

    return `INSERT INTO ${sqlIdentifier(tableName)} (${identifiers}) VALUES (${values});`;
  });

  return [createTable, ...inserts].join('\n');
}

function yamlScalar(value) {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return escapeNonAscii(JSON.stringify(String(value)));
}

function serializeYamlValue(value, indentation = 0) {
  const indent = ' '.repeat(indentation);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    return value
      .map((item) => {
        if (item && typeof item === 'object') {
          return `${indent}- ${serializeYamlValue(item, indentation + 2).trimStart()}`;
        }

        return `${indent}- ${yamlScalar(item)}`;
      })
      .join('\n');
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      return '{}';
    }

    return entries
      .map(([key, entryValue]) => {
        if (entryValue && typeof entryValue === 'object') {
          const serializedValue = serializeYamlValue(entryValue, indentation + 2);

          if (serializedValue === '[]' || serializedValue === '{}') {
            return `${indent}${key}: ${serializedValue}`;
          }

          return `${indent}${key}:\n${serializedValue}`;
        }

        return `${indent}${key}: ${yamlScalar(entryValue)}`;
      })
      .join('\n');
  }

  return yamlScalar(value);
}

function serializeYaml(value) {
  return serializeYamlValue(value);
}

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replace(
      /[\u007f-\uffff]/g,
      (character) => `&#x${character.charCodeAt(0).toString(16).padStart(4, '0')};`,
    );
}

function serializeXmlElement(name, value, indentation = 0) {
  const indent = ' '.repeat(indentation);

  if (value === null || value === undefined) {
    return `${indent}<${name} />`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${indent}<${name} />`;
    }

    return [
      `${indent}<${name}>`,
      ...value.map((item) => serializeXmlElement('item', item, indentation + 2)),
      `${indent}</${name}>`,
    ].join('\n');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      return `${indent}<${name} />`;
    }

    return [
      `${indent}<${name}>`,
      ...entries.map(([key, entryValue]) => serializeXmlElement(key, entryValue, indentation + 2)),
      `${indent}</${name}>`,
    ].join('\n');
  }

  return `${indent}<${name}>${xmlEscape(value)}</${name}>`;
}

function serializeXml(name, records) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<dataset name="${xmlEscape(name)}">`,
    serializeXmlElement('items', records, 2),
    '</dataset>',
  ].join('\n');
}

async function loadDataset(config) {
  return parseJsonArray(
    config.schema,
    await readJson(path.join(dataDirectory, config.fileName)),
    config.name,
  );
}

async function buildDatasetArtifacts(config) {
  const records = (await loadDataset(config)).map(toPublicRecord);
  const rows = records.map(toFlatRow);

  const artifacts = [];

  for (const artifactFormat of artifactFormats) {
    const fileName = `${config.name}.${artifactFormat.extension}`;
    const relativePath = path.posix.join('artifacts', fileName);
    const content = artifactFormat.serialize({
      name: config.name,
      tableName: config.tableName,
      columns: config.columns,
      records,
      rows,
    });
    const buffer = await writeArtifact(relativePath, content);
    const url = getArtifactUrl(relativePath);

    artifacts.push({
      name: config.name,
      format: artifactFormat.format,
      path: relativePath,
      ...(url ? { url } : {}),
      sha256: sha256(buffer),
      sizeBytes: buffer.byteLength,
      recordCount: records.length,
      mediaType: artifactFormat.mediaType,
    });
  }

  return artifacts;
}

const sources = parseJsonArray(
  sourceRecordSchema,
  await readJson(path.join(dataDirectory, 'sources.json')),
  'sources',
);
const approvedSources = sources.filter((source) => source.status === 'approved');
const artifacts = [];

for (const config of datasetConfigs) {
  artifacts.push(...(await buildDatasetArtifacts(config)));
}

const manifest = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  dataset: {
    id: 'opensyria-geography',
    slug: 'geography',
    repository: 'data-geography',
    category: 'geography',
    title: {
      en: 'Administrative Geography',
      ar: '\u0627\u0644\u062c\u063a\u0631\u0627\u0641\u064a\u0627 \u0627\u0644\u0625\u062f\u0627\u0631\u064a\u0629',
    },
  },
  release: {
    version: releaseVersion,
    status: releaseStatus,
    publishedAt: releasePublishedAt,
    notes: 'Generated geography release artifacts.',
  },
  artifacts,
  sources: approvedSources.map((source) => ({
    id: source.id,
    title: source.title,
    url: source.url,
    license: source.license,
    fields: source.fields,
  })),
};

releaseManifestSchema.parse(manifest);

await writeJson(path.join(releaseDirectory, 'release-manifest.json'), manifest);

console.log(
  JSON.stringify(
    {
      ok: true,
      dataDirectory: path.relative(root, dataDirectory).replaceAll('\\', '/'),
      releaseDirectory,
      artifacts: manifest.artifacts,
    },
    null,
    2,
  ),
);
