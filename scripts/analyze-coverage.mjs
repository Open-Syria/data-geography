import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  districtRecordSchema,
  governorateRecordSchema,
  localityRecordSchema,
  parseJsonArray,
  readJson,
  sourceRecordSchema,
  subdistrictRecordSchema,
} from './lib/data-schemas.mjs';

const root = process.cwd();
const dataDirectory = path.resolve(root, getCliOption('--data-dir') ?? 'data');
const outputDirectory = path.resolve(root, getCliOption('--out-dir') ?? 'dist/coverage');
const maxItems = Number.parseInt(getCliOption('--max-items') ?? '25', 10);

if (!Number.isInteger(maxItems) || maxItems < 1) {
  throw new Error('--max-items must be a positive integer');
}

const fieldChecks = {
  governorates: [
    fieldCheck('arabicName', 'Arabic name', 'medium', (record) => Boolean(record.name.ar)),
    fieldCheck('aliases', 'Aliases', 'low', (record) => record.aliases.length > 0),
    fieldCheck('iso31662', 'ISO 3166-2 code', 'medium', (record) => Boolean(record.iso31662)),
    fieldCheck('centroid', 'Centroid', 'high', (record) => Boolean(record.centroid)),
    fieldCheck('area', 'Area', 'high', (record) => Boolean(record.area)),
    fieldCheck('population', 'Population', 'medium', (record) => Boolean(record.population)),
    fieldCheck('wikidata', 'Wikidata ID', 'low', (record) => Boolean(record.externalIds.wikidata)),
    fieldCheck('geonames', 'GeoNames ID', 'medium', (record) =>
      Boolean(record.externalIds.geonames),
    ),
    fieldCheck('geoboundaries', 'geoBoundaries ID', 'medium', (record) =>
      Boolean(record.externalIds.geoboundaries),
    ),
    fieldCheck('ochaPcode', 'OCHA P-code', 'medium', (record) =>
      Boolean(record.externalIds.ochaPcode),
    ),
  ],
  districts: [
    fieldCheck('arabicName', 'Arabic name', 'medium', (record) => Boolean(record.name.ar)),
    fieldCheck('aliases', 'Aliases', 'low', (record) => record.aliases.length > 0),
    fieldCheck('centroid', 'Centroid', 'high', (record) => Boolean(record.centroid)),
    fieldCheck('area', 'Area', 'high', (record) => Boolean(record.area)),
    fieldCheck('population', 'Population', 'medium', (record) => Boolean(record.population)),
    fieldCheck('wikidata', 'Wikidata ID', 'low', (record) => Boolean(record.externalIds.wikidata)),
    fieldCheck('geonames', 'GeoNames ID', 'medium', (record) =>
      Boolean(record.externalIds.geonames),
    ),
    fieldCheck('geoboundaries', 'geoBoundaries ID', 'medium', (record) =>
      Boolean(record.externalIds.geoboundaries),
    ),
    fieldCheck('ochaPcode', 'OCHA P-code', 'medium', (record) =>
      Boolean(record.externalIds.ochaPcode),
    ),
  ],
  subdistricts: [
    fieldCheck('arabicName', 'Arabic name', 'medium', (record) => Boolean(record.name.ar)),
    fieldCheck('aliases', 'Aliases', 'low', (record) => record.aliases.length > 0),
    fieldCheck('centroid', 'Centroid', 'high', (record) => Boolean(record.centroid)),
    fieldCheck('area', 'Area', 'high', (record) => Boolean(record.area)),
    fieldCheck('population', 'Population', 'medium', (record) => Boolean(record.population)),
    fieldCheck('wikidata', 'Wikidata ID', 'low', (record) => Boolean(record.externalIds.wikidata)),
    fieldCheck('geonames', 'GeoNames ID', 'medium', (record) =>
      Boolean(record.externalIds.geonames),
    ),
    fieldCheck('geoboundaries', 'geoBoundaries ID', 'low', (record) =>
      Boolean(record.externalIds.geoboundaries),
    ),
    fieldCheck('ochaPcode', 'OCHA P-code', 'medium', (record) =>
      Boolean(record.externalIds.ochaPcode),
    ),
  ],
  localities: [
    fieldCheck('arabicName', 'Arabic name', 'medium', (record) => Boolean(record.name.ar)),
    fieldCheck('aliases', 'Aliases', 'low', (record) => record.aliases.length > 0),
    fieldCheck('centroid', 'Centroid', 'high', (record) => Boolean(record.centroid)),
    fieldCheck('districtId', 'District relationship', 'medium', (record) =>
      Boolean(record.districtId),
    ),
    fieldCheck('subdistrictId', 'Subdistrict relationship', 'medium', (record) =>
      Boolean(record.subdistrictId),
    ),
    fieldCheck('wikidata', 'Wikidata ID', 'low', (record) => Boolean(record.externalIds.wikidata)),
    fieldCheck('geonames', 'GeoNames ID', 'medium', (record) =>
      Boolean(record.externalIds.geonames),
    ),
    fieldCheck('ochaPcode', 'OCHA P-code', 'medium', (record) =>
      Boolean(record.externalIds.ochaPcode),
    ),
  ],
};

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

function fieldCheck(id, label, priority, hasValue) {
  return {
    id,
    label,
    priority,
    hasValue,
  };
}

async function loadData() {
  return {
    sources: parseJsonArray(
      sourceRecordSchema,
      await readJson(path.join(dataDirectory, 'sources.json')),
      'sources',
    ),
    governorates: parseJsonArray(
      governorateRecordSchema,
      await readJson(path.join(dataDirectory, 'governorates.json')),
      'governorates',
    ),
    districts: parseJsonArray(
      districtRecordSchema,
      await readJson(path.join(dataDirectory, 'districts.json')),
      'districts',
    ),
    subdistricts: parseJsonArray(
      subdistrictRecordSchema,
      await readJson(path.join(dataDirectory, 'subdistricts.json')),
      'subdistricts',
    ),
    localities: parseJsonArray(
      localityRecordSchema,
      await readJson(path.join(dataDirectory, 'localities.json')),
      'localities',
    ),
  };
}

function analyzeDataset(records, checks) {
  const total = records.length;

  return {
    total,
    fields: Object.fromEntries(
      checks.map((check) => {
        const missingRecords = records.filter((record) => !check.hasValue(record));
        const present = total - missingRecords.length;

        return [
          check.id,
          {
            label: check.label,
            priority: check.priority,
            present,
            missing: missingRecords.length,
            percent: percent(present, total),
            missingRecordIds: missingRecords.map((record) => record.id),
          },
        ];
      }),
    ),
  };
}

function analyzeRelationships(data) {
  const governoratesById = indexById(data.governorates);
  const districtsById = indexById(data.districts);
  const subdistrictsById = indexById(data.subdistricts);
  const subdistrictsByDistrict = groupBy(data.subdistricts, (record) => record.districtId);
  const localitiesByDistrict = groupBy(
    data.localities.filter((record) => record.districtId),
    (record) => record.districtId,
  );
  const localitiesBySubdistrict = groupBy(
    data.localities.filter((record) => record.subdistrictId),
    (record) => record.subdistrictId,
  );

  const invalid = [];

  for (const district of data.districts) {
    if (!governoratesById.has(district.governorateId)) {
      invalid.push({
        dataset: 'districts',
        recordId: district.id,
        field: 'governorateId',
        value: district.governorateId,
        problem: 'unknown governorate',
      });
    }
  }

  for (const subdistrict of data.subdistricts) {
    const district = districtsById.get(subdistrict.districtId);

    if (!governoratesById.has(subdistrict.governorateId)) {
      invalid.push({
        dataset: 'subdistricts',
        recordId: subdistrict.id,
        field: 'governorateId',
        value: subdistrict.governorateId,
        problem: 'unknown governorate',
      });
    }

    if (!district) {
      invalid.push({
        dataset: 'subdistricts',
        recordId: subdistrict.id,
        field: 'districtId',
        value: subdistrict.districtId,
        problem: 'unknown district',
      });
    } else if (district.governorateId !== subdistrict.governorateId) {
      invalid.push({
        dataset: 'subdistricts',
        recordId: subdistrict.id,
        field: 'governorateId',
        value: subdistrict.governorateId,
        problem: `does not match parent district governorate ${district.governorateId}`,
      });
    }
  }

  for (const locality of data.localities) {
    const district = locality.districtId ? districtsById.get(locality.districtId) : undefined;
    const subdistrict = locality.subdistrictId
      ? subdistrictsById.get(locality.subdistrictId)
      : undefined;

    if (!governoratesById.has(locality.governorateId)) {
      invalid.push({
        dataset: 'localities',
        recordId: locality.id,
        field: 'governorateId',
        value: locality.governorateId,
        problem: 'unknown governorate',
      });
    }

    if (locality.districtId && !district) {
      invalid.push({
        dataset: 'localities',
        recordId: locality.id,
        field: 'districtId',
        value: locality.districtId,
        problem: 'unknown district',
      });
    }

    if (locality.subdistrictId && !subdistrict) {
      invalid.push({
        dataset: 'localities',
        recordId: locality.id,
        field: 'subdistrictId',
        value: locality.subdistrictId,
        problem: 'unknown subdistrict',
      });
    }

    if (district && district.governorateId !== locality.governorateId) {
      invalid.push({
        dataset: 'localities',
        recordId: locality.id,
        field: 'governorateId',
        value: locality.governorateId,
        problem: `does not match parent district governorate ${district.governorateId}`,
      });
    }

    if (subdistrict && subdistrict.governorateId !== locality.governorateId) {
      invalid.push({
        dataset: 'localities',
        recordId: locality.id,
        field: 'governorateId',
        value: locality.governorateId,
        problem: `does not match parent subdistrict governorate ${subdistrict.governorateId}`,
      });
    }

    if (district && subdistrict && subdistrict.districtId !== district.id) {
      invalid.push({
        dataset: 'localities',
        recordId: locality.id,
        field: 'subdistrictId',
        value: locality.subdistrictId,
        problem: `does not belong to parent district ${district.id}`,
      });
    }
  }

  return {
    invalid,
    gaps: {
      districtsWithoutSubdistricts: data.districts
        .filter((record) => !subdistrictsByDistrict.has(record.id))
        .map((record) => record.id),
      districtsWithoutLocalities: data.districts
        .filter((record) => !localitiesByDistrict.has(record.id))
        .map((record) => record.id),
      subdistrictsWithoutLocalities: data.subdistricts
        .filter((record) => !localitiesBySubdistrict.has(record.id))
        .map((record) => record.id),
    },
    byGovernorate: data.governorates.map((governorate) => ({
      governorateId: governorate.id,
      districts: data.districts.filter((record) => record.governorateId === governorate.id).length,
      subdistricts: data.subdistricts.filter((record) => record.governorateId === governorate.id)
        .length,
      localities: data.localities.filter((record) => record.governorateId === governorate.id)
        .length,
    })),
  };
}

function buildContributionFocus(report) {
  const focus = [];

  if (report.relationships.invalid.length > 0) {
    focus.push({
      priority: 'high',
      area: 'relationships',
      title: 'Fix invalid parent references',
      count: report.relationships.invalid.length,
      recordIds: report.relationships.invalid.map((item) => item.recordId),
      action: 'Correct parent IDs before adding more records.',
    });
  }

  if (report.datasets.subdistricts.total === 0 && report.datasets.districts.total > 0) {
    focus.push({
      priority: 'high',
      area: 'subdistricts',
      title: 'Seed subdistrict records',
      count: report.relationships.gaps.districtsWithoutSubdistricts.length,
      recordIds: report.relationships.gaps.districtsWithoutSubdistricts,
      action: 'Add sourced subdistrict records under existing districts.',
    });
  }

  if (report.datasets.localities.total === 0 && report.datasets.districts.total > 0) {
    focus.push({
      priority: 'high',
      area: 'localities',
      title: 'Seed city, town, village, and locality records',
      count: report.relationships.gaps.districtsWithoutLocalities.length,
      recordIds: report.relationships.gaps.districtsWithoutLocalities,
      action: 'Add sourced localities and connect them to known parents where possible.',
    });
  }

  for (const [datasetName, dataset] of Object.entries(report.datasets)) {
    for (const [fieldId, field] of Object.entries(dataset.fields)) {
      if (field.missing === 0 || dataset.total === 0) {
        continue;
      }

      focus.push({
        priority: field.priority,
        area: `${datasetName}.${fieldId}`,
        title: `Improve ${field.label.toLowerCase()} coverage for ${datasetName}`,
        count: field.missing,
        recordIds: field.missingRecordIds,
        action: buildFieldAction(datasetName, field.label),
      });
    }
  }

  return focus.sort(
    (left, right) => priorityWeight(right.priority) - priorityWeight(left.priority),
  );
}

function buildFieldAction(datasetName, label) {
  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes('population')) {
    return `Add dated, source-backed population measurements for ${datasetName}.`;
  }

  if (lowerLabel.includes('centroid')) {
    return `Add WGS84 coordinates from reusable sources for ${datasetName}.`;
  }

  if (lowerLabel.includes('area')) {
    return `Add area values only from reusable boundary/statistical sources for ${datasetName}.`;
  }

  if (lowerLabel.includes('relationship')) {
    return `Connect ${datasetName} records to the most specific known administrative parent.`;
  }

  if (lowerLabel.includes('id')) {
    return `Add external IDs from approved public references for ${datasetName}.`;
  }

  return `Add missing ${lowerLabel} values with source-backed review notes where needed.`;
}

function buildMarkdown(report) {
  const lines = [
    '# Geography Coverage Report',
    '',
    `Generated at: ${report.generatedAt}`,
    '',
    `Data directory: \`${report.dataDirectory}\``,
    '',
    'This report identifies missing fields and hierarchy gaps in the canonical data. It does not prove real-world completeness; it shows where contributors can focus next within the current schema.',
    '',
    '## Dataset Summary',
    '',
    markdownTable(
      ['Dataset', 'Records', 'Arabic names', 'Centroids', 'Areas', 'Population', 'External IDs'],
      Object.entries(report.datasets).map(([datasetName, dataset]) => [
        datasetName,
        dataset.total,
        metricCell(dataset.fields.arabicName),
        metricCell(dataset.fields.centroid),
        metricCell(dataset.fields.area),
        metricCell(dataset.fields.population),
        externalIdSummary(dataset),
      ]),
    ),
    '',
    '## Contribution Focus',
    '',
  ];

  if (report.contributionFocus.length === 0) {
    lines.push('No coverage gaps were detected for the configured checks.', '');
  } else {
    lines.push(
      markdownTable(
        ['Priority', 'Area', 'Missing', 'Action', 'Example records'],
        report.contributionFocus.map((item) => [
          item.priority,
          item.area,
          item.count,
          item.action,
          sampleIds(item.recordIds),
        ]),
      ),
      '',
    );
  }

  lines.push(
    '## Missing Field Details',
    '',
    ...Object.entries(report.datasets).flatMap(([datasetName, dataset]) => [
      `### ${toTitle(datasetName)}`,
      '',
      markdownTable(
        ['Field', 'Present', 'Missing', 'Coverage', 'Missing examples'],
        Object.values(dataset.fields).map((field) => [
          field.label,
          field.present,
          field.missing,
          coverageCell(field),
          sampleIds(field.missingRecordIds),
        ]),
      ),
      '',
    ]),
    '## Relationship Gaps',
    '',
    markdownTable(
      ['Gap', 'Count', 'Examples'],
      [
        [
          'Districts without subdistricts',
          report.relationships.gaps.districtsWithoutSubdistricts.length,
          sampleIds(report.relationships.gaps.districtsWithoutSubdistricts),
        ],
        [
          'Districts without localities',
          report.relationships.gaps.districtsWithoutLocalities.length,
          sampleIds(report.relationships.gaps.districtsWithoutLocalities),
        ],
        [
          'Subdistricts without localities',
          report.relationships.gaps.subdistrictsWithoutLocalities.length,
          sampleIds(report.relationships.gaps.subdistrictsWithoutLocalities),
        ],
      ],
    ),
    '',
    '## Records By Governorate',
    '',
    markdownTable(
      ['Governorate', 'Districts', 'Subdistricts', 'Localities'],
      report.relationships.byGovernorate.map((item) => [
        item.governorateId,
        item.districts,
        item.subdistricts,
        item.localities,
      ]),
    ),
    '',
    '## Invalid Relationships',
    '',
  );

  if (report.relationships.invalid.length === 0) {
    lines.push('No invalid parent relationships were detected.', '');
  } else {
    lines.push(
      markdownTable(
        ['Dataset', 'Record', 'Field', 'Value', 'Problem'],
        report.relationships.invalid.map((item) => [
          item.dataset,
          item.recordId,
          item.field,
          item.value,
          item.problem,
        ]),
      ),
      '',
    );
  }

  return `${lines.join('\n')}\n`;
}

function metricCell(metric) {
  if (!metric) {
    return '-';
  }

  const total = metric.present + metric.missing;

  if (total === 0) {
    return 'n/a';
  }

  return `${metric.present}/${total} (${metric.percent}%)`;
}

function coverageCell(metric) {
  return metric.present + metric.missing === 0 ? 'n/a' : `${metric.percent}%`;
}

function externalIdSummary(dataset) {
  if (dataset.total === 0) {
    return 'n/a';
  }

  const metrics = [dataset.fields.wikidata, dataset.fields.geonames, dataset.fields.geoboundaries]
    .filter(Boolean)
    .map((metric) => `${metric.label}: ${metric.percent}%`);

  return metrics.length === 0 ? '-' : metrics.join('; ');
}

function sampleIds(recordIds) {
  if (recordIds.length === 0) {
    return '-';
  }

  const sampledIds = recordIds.slice(0, maxItems);
  const suffix =
    recordIds.length > sampledIds.length ? `, +${recordIds.length - sampledIds.length}` : '';

  return `${sampledIds.map((id) => `\`${id}\``).join(', ')}${suffix}`;
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.map(escapeMarkdownCell).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(
      (row) => `| ${row.map((value) => escapeMarkdownCell(String(value))).join(' | ')} |`,
    ),
  ].join('\n');
}

function escapeMarkdownCell(value) {
  return value.replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

function toTitle(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function indexById(records) {
  return new Map(records.map((record) => [record.id, record]));
}

function groupBy(records, getKey) {
  return records.reduce((groups, record) => {
    const key = getKey(record);
    const group = groups.get(key) ?? [];

    group.push(record);
    groups.set(key, group);

    return groups;
  }, new Map());
}

function percent(part, total) {
  if (total === 0) {
    return 0;
  }

  return Number(((part / total) * 100).toFixed(2));
}

function priorityWeight(priority) {
  return {
    high: 3,
    medium: 2,
    low: 1,
  }[priority];
}

const data = await loadData();
const datasets = {
  governorates: analyzeDataset(data.governorates, fieldChecks.governorates),
  districts: analyzeDataset(data.districts, fieldChecks.districts),
  subdistricts: analyzeDataset(data.subdistricts, fieldChecks.subdistricts),
  localities: analyzeDataset(data.localities, fieldChecks.localities),
};
const relationships = analyzeRelationships(data);
const report = {
  ok: relationships.invalid.length === 0,
  generatedAt: new Date().toISOString(),
  dataDirectory: path.relative(root, dataDirectory).replaceAll('\\', '/'),
  datasets,
  relationships,
};

report.contributionFocus = buildContributionFocus(report);

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, 'coverage-report.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);
await writeFile(path.join(outputDirectory, 'COVERAGE.md'), buildMarkdown(report));

console.log(
  JSON.stringify(
    {
      ok: report.ok,
      dataDirectory: report.dataDirectory,
      outputDirectory: path.relative(root, outputDirectory).replaceAll('\\', '/'),
      datasets: Object.fromEntries(
        Object.entries(report.datasets).map(([datasetName, dataset]) => [
          datasetName,
          dataset.total,
        ]),
      ),
      contributionFocusItems: report.contributionFocus.length,
      invalidRelationships: report.relationships.invalid.length,
    },
    null,
    2,
  ),
);
