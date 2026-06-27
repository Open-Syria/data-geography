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

function countBy(records, getKey) {
  return Object.fromEntries(
    [
      ...records.reduce((counts, record) => {
        const key = getKey(record) ?? 'unknown';

        counts.set(key, (counts.get(key) ?? 0) + 1);

        return counts;
      }, new Map()),
    ].sort(([left], [right]) => left.localeCompare(right)),
  );
}

function count(records, predicate) {
  return records.filter(predicate).length;
}

function percent(part, total) {
  if (total === 0) {
    return 0;
  }

  return Number(((part / total) * 100).toFixed(2));
}

function coverage(part, total) {
  return {
    count: part,
    percent: percent(part, total),
  };
}

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function duplicateValues(records, getValue) {
  const values = new Map();

  for (const record of records) {
    const value = getValue(record);

    if (!value) {
      continue;
    }

    const normalizedValue = normalizeText(value);
    const ids = values.get(normalizedValue) ?? [];

    ids.push(record.id);
    values.set(normalizedValue, ids);
  }

  return [...values.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([value, ids]) => ({ value, ids }));
}

function summarizeDataset(records) {
  const total = records.length;
  const withArabicName = count(records, (record) => Boolean(record.name.ar));
  const withCentroid = count(records, (record) => Boolean(record.centroid));
  const withExternalIds = count(records, (record) => Object.keys(record.externalIds).length > 0);

  return {
    total,
    sourceStatus: countBy(records, (record) => record.sourceStatus),
    sourceUsage: countBy(
      records.flatMap((record) => record.sourceIds.map((sourceId) => ({ sourceId }))),
      (record) => record.sourceId,
    ),
    coverage: {
      arabicName: coverage(withArabicName, total),
      centroid: coverage(withCentroid, total),
      externalIds: coverage(withExternalIds, total),
    },
    duplicateNames: {
      en: duplicateValues(records, (record) => record.name.en),
      ar: duplicateValues(records, (record) => record.name.ar),
    },
  };
}

const data = await loadData();

const report = {
  ok: true,
  generatedAt: new Date().toISOString(),
  dataDirectory: path.relative(root, dataDirectory).replaceAll('\\', '/'),
  sources: {
    total: data.sources.length,
    status: countBy(data.sources, (source) => source.status),
    licenses: countBy(data.sources, (source) => source.license),
  },
  datasets: {
    governorates: summarizeDataset(data.governorates),
    districts: summarizeDataset(data.districts),
    subdistricts: summarizeDataset(data.subdistricts),
    localities: summarizeDataset(data.localities),
  },
};

console.log(JSON.stringify(report, null, 2));
