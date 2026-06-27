import path from 'node:path';
import {
  districtRecordSchema,
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

async function loadData() {
  const sources = parseJsonArray(
    sourceRecordSchema,
    await readJson(path.join(root, 'data/sources.json')),
    'sources',
  );
  const governorates = parseJsonArray(
    governorateRecordSchema,
    await readJson(path.join(root, 'data/governorates.json')),
    'governorates',
  );
  const districts = parseJsonArray(
    districtRecordSchema,
    await readJson(path.join(root, 'data/districts.json')),
    'districts',
  );
  const subdistricts = parseJsonArray(
    subdistrictRecordSchema,
    await readJson(path.join(root, 'data/subdistricts.json')),
    'subdistricts',
  );
  const localities = parseJsonArray(
    localityRecordSchema,
    await readJson(path.join(root, 'data/localities.json')),
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
  ensureReferences(data);
}

const data = await loadData();

validateData(data);

console.log(
  JSON.stringify(
    {
      ok: true,
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
