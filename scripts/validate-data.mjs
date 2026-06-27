import path from 'node:path';
import {
  districtRecordSchema,
  ensureAliasQuality,
  ensureKnownSources,
  ensureUnique,
  governorateRecordSchema,
  localityRecordSchema,
  parseJsonArray,
  readJson,
  sourceRecordSchema,
  subdistrictRecordSchema,
} from './lib/data-schemas.mjs';

const root = process.cwd();

function getDataDirectory() {
  const dataDirArg = process.argv.find((arg) => arg.startsWith('--data-dir='));
  const dataDirIndex = process.argv.indexOf('--data-dir');

  if (!dataDirArg && dataDirIndex !== -1 && process.argv[dataDirIndex + 1] === undefined) {
    throw new Error('--data-dir requires a directory path');
  }

  const dataDirValue =
    dataDirArg?.slice('--data-dir='.length) ??
    (dataDirIndex === -1 ? undefined : process.argv[dataDirIndex + 1]);

  if (dataDirValue === '' || dataDirValue?.startsWith('--')) {
    throw new Error('--data-dir requires a directory path');
  }

  return path.resolve(root, dataDirValue ?? 'data');
}

async function loadData(dataDirectory) {
  const sources = parseJsonArray(
    sourceRecordSchema,
    await readJson(path.join(dataDirectory, 'sources.json')),
    'sources',
  );
  const governorates = parseJsonArray(
    governorateRecordSchema,
    await readJson(path.join(dataDirectory, 'governorates.json')),
    'governorates',
  );
  const districts = parseJsonArray(
    districtRecordSchema,
    await readJson(path.join(dataDirectory, 'districts.json')),
    'districts',
  );
  const subdistricts = parseJsonArray(
    subdistrictRecordSchema,
    await readJson(path.join(dataDirectory, 'subdistricts.json')),
    'subdistricts',
  );
  const localities = parseJsonArray(
    localityRecordSchema,
    await readJson(path.join(dataDirectory, 'localities.json')),
    'localities',
  );

  return {
    sources,
    governorates,
    districts,
    subdistricts,
    localities,
  };
}

function ensureReferences({ governorates, districts, subdistricts, localities }) {
  const governorateIds = new Set(governorates.map((record) => record.id));
  const districtIds = new Set(districts.map((record) => record.id));
  const subdistrictIds = new Set(subdistricts.map((record) => record.id));

  for (const district of districts) {
    if (!governorateIds.has(district.governorateId)) {
      throw new Error(
        `district ${district.id} references unknown governorate: ${district.governorateId}`,
      );
    }
  }

  for (const subdistrict of subdistricts) {
    if (!governorateIds.has(subdistrict.governorateId)) {
      throw new Error(
        `subdistrict ${subdistrict.id} references unknown governorate: ${subdistrict.governorateId}`,
      );
    }

    if (!districtIds.has(subdistrict.districtId)) {
      throw new Error(
        `subdistrict ${subdistrict.id} references unknown district: ${subdistrict.districtId}`,
      );
    }
  }

  for (const locality of localities) {
    if (!governorateIds.has(locality.governorateId)) {
      throw new Error(
        `locality ${locality.id} references unknown governorate: ${locality.governorateId}`,
      );
    }

    if (locality.districtId && !districtIds.has(locality.districtId)) {
      throw new Error(
        `locality ${locality.id} references unknown district: ${locality.districtId}`,
      );
    }

    if (locality.subdistrictId && !subdistrictIds.has(locality.subdistrictId)) {
      throw new Error(
        `locality ${locality.id} references unknown subdistrict: ${locality.subdistrictId}`,
      );
    }
  }
}

function validateData(data) {
  ensureUnique(data.sources, (source) => source.id, 'sources');
  ensureUnique(data.governorates, (record) => record.id, 'governorates');
  ensureUnique(data.districts, (record) => record.id, 'districts');
  ensureUnique(data.subdistricts, (record) => record.id, 'subdistricts');
  ensureUnique(data.localities, (record) => record.id, 'localities');
  ensureUnique(
    data.governorates.filter((record) => record.iso31662 !== null),
    (record) => record.iso31662,
    'governorates.iso31662',
  );

  ensureKnownSources(data.governorates, data.sources, 'governorate');
  ensureKnownSources(data.districts, data.sources, 'district');
  ensureKnownSources(data.subdistricts, data.sources, 'subdistrict');
  ensureKnownSources(data.localities, data.sources, 'locality');
  ensureAliasQuality(data.governorates, 'governorate');
  ensureAliasQuality(data.districts, 'district');
  ensureAliasQuality(data.subdistricts, 'subdistrict');
  ensureAliasQuality(data.localities, 'locality');
  ensureReferences(data);
}

const dataDirectory = getDataDirectory();
const data = await loadData(dataDirectory);

validateData(data);

console.log(
  JSON.stringify(
    {
      ok: true,
      dataDirectory: path.relative(root, dataDirectory).replaceAll('\\', '/'),
      counts: {
        sources: data.sources.length,
        governorates: data.governorates.length,
        districts: data.districts.length,
        subdistricts: data.subdistricts.length,
        localities: data.localities.length,
      },
    },
    null,
    2,
  ),
);
