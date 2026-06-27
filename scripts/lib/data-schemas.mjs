import { readFile } from 'node:fs/promises';
import { z } from 'zod';

const idSchema = z.string().regex(/^sy-[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const sourceStatusSchema = z.enum(['pending_release', 'seed', 'released', 'deprecated']);
export const datasetReleaseStatusSchema = z.enum(['planned', 'seed', 'released', 'deprecated']);
export const datasetArtifactFormatSchema = z.enum([
  'json',
  'ndjson',
  'csv',
  'geojson',
  'sql',
  'yaml',
  'xml',
  'sqlite',
]);

export const sourceRegistryStatusSchema = z.enum([
  'approved',
  'restricted',
  'proposed',
  'rejected',
]);

export const localizedTextSchema = z
  .object({
    en: z.string().trim().min(1),
    ar: z.string().trim().min(1).optional(),
  })
  .strict();

export const geographicPointSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .strict();

export const aliasSchema = z
  .object({
    value: z.string().trim().min(1),
    language: z.enum(['ar', 'en', 'und']).optional(),
    type: z.enum(['alias', 'transliteration', 'historical', 'alternate_spelling']).optional(),
  })
  .strict();

export const externalIdsSchema = z
  .object({
    wikidata: z
      .string()
      .regex(/^Q[0-9]+$/)
      .optional(),
    geonames: z
      .string()
      .regex(/^[0-9]+$/)
      .optional(),
    geoboundaries: z.string().trim().min(1).optional(),
  })
  .strict();

export const sourceRecordSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    url: z.string().url(),
    license: z.string().trim().min(1),
    licenseUrl: z.string().url().optional(),
    status: sourceRegistryStatusSchema,
    fields: z.array(z.string().trim().min(1)),
    notes: z.string().trim().min(1).optional(),
  })
  .strict();

export const releaseManifestSourceSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    url: z.string().url().optional(),
    license: z.string().trim().min(1),
    accessedAt: z.string().datetime().optional(),
    fields: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

export const releaseManifestArtifactSchema = z
  .object({
    name: z.string().trim().min(1),
    format: datasetArtifactFormatSchema,
    path: z.string().trim().min(1),
    url: z.string().url().optional(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    sizeBytes: z.number().int().nonnegative(),
    recordCount: z.number().int().nonnegative().optional(),
    mediaType: z.string().trim().min(1).optional(),
  })
  .strict();

export const releaseManifestSchema = z
  .object({
    schemaVersion: z.literal('1.0'),
    generatedAt: z.string().datetime(),
    dataset: z
      .object({
        id: z.literal('opensyria-geography'),
        slug: z.literal('geography'),
        repository: z.literal('data-geography'),
        category: z.literal('geography'),
        title: localizedTextSchema,
      })
      .strict(),
    release: z
      .object({
        version: z.string().trim().min(1),
        status: datasetReleaseStatusSchema,
        publishedAt: z.string().datetime().nullable(),
        notes: z.string().nullable().optional(),
      })
      .strict(),
    artifacts: z.array(releaseManifestArtifactSchema),
    sources: z.array(releaseManifestSourceSchema),
  })
  .strict();

export const sourceImportManifestSchema = z
  .object({
    sourceId: z.string().trim().min(1),
    sourceTitle: z.string().trim().min(1),
    sourceUrl: z.string().url(),
    license: z.string().trim().min(1),
    licenseUrl: z.string().url().optional(),
    accessedAt: z.string().datetime(),
    status: z.enum(['planned', 'imported', 'reviewed', 'rejected', 'superseded']),
    rawFiles: z.array(
      z
        .object({
          name: z.string().trim().min(1),
          sha256: z
            .string()
            .regex(/^[a-f0-9]{64}$/)
            .optional(),
          notes: z.string().trim().min(1).optional(),
        })
        .strict(),
    ),
    importedFields: z.array(z.string().trim().min(1)).min(1),
    targetFiles: z
      .array(
        z.enum([
          'data/governorates.json',
          'data/districts.json',
          'data/subdistricts.json',
          'data/localities.json',
          'data/sources.json',
        ]),
      )
      .min(1),
    transforms: z.array(z.string().trim().min(1)).min(1),
    reviewNotes: z.string().trim().min(1),
  })
  .strict();

export const governorateRecordSchema = z
  .object({
    id: idSchema,
    name: localizedTextSchema,
    aliases: z.array(aliasSchema),
    iso31662: z
      .string()
      .regex(/^SY-[A-Z]{2}$/)
      .nullable(),
    centroid: geographicPointSchema.nullable(),
    externalIds: externalIdsSchema,
    sourceIds: z.array(z.string().trim().min(1)).min(1),
    sourceStatus: sourceStatusSchema,
    notes: z.string().trim().min(1).optional(),
  })
  .strict();

export const districtRecordSchema = z
  .object({
    id: idSchema,
    governorateId: idSchema,
    name: localizedTextSchema,
    aliases: z.array(aliasSchema),
    centroid: geographicPointSchema.nullable(),
    externalIds: externalIdsSchema,
    sourceIds: z.array(z.string().trim().min(1)).min(1),
    sourceStatus: sourceStatusSchema,
    notes: z.string().trim().min(1).optional(),
  })
  .strict();

export const subdistrictRecordSchema = z
  .object({
    id: idSchema,
    districtId: idSchema,
    governorateId: idSchema,
    name: localizedTextSchema,
    aliases: z.array(aliasSchema),
    centroid: geographicPointSchema.nullable(),
    externalIds: externalIdsSchema,
    sourceIds: z.array(z.string().trim().min(1)).min(1),
    sourceStatus: sourceStatusSchema,
    notes: z.string().trim().min(1).optional(),
  })
  .strict();

export const localityRecordSchema = z
  .object({
    id: idSchema,
    governorateId: idSchema,
    districtId: idSchema.optional(),
    subdistrictId: idSchema.optional(),
    kind: z.enum(['city', 'town', 'village', 'locality']),
    name: localizedTextSchema,
    aliases: z.array(aliasSchema),
    centroid: geographicPointSchema.nullable(),
    externalIds: externalIdsSchema,
    sourceIds: z.array(z.string().trim().min(1)).min(1),
    sourceStatus: sourceStatusSchema,
    notes: z.string().trim().min(1).optional(),
  })
  .strict();

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export function parseJsonArray(schema, value, label) {
  const result = z.array(schema).safeParse(value);

  if (!result.success) {
    throw new Error(
      `${label} failed schema validation: ${JSON.stringify(z.treeifyError(result.error), null, 2)}`,
    );
  }

  return result.data;
}

export function ensureUnique(records, getKey, label) {
  const seen = new Set();

  for (const record of records) {
    const key = getKey(record);

    if (seen.has(key)) {
      throw new Error(`${label} contains duplicate key: ${key}`);
    }

    seen.add(key);
  }
}

export function ensureKnownSources(records, sources, label) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  for (const record of records) {
    const seenSourceIds = new Set();

    for (const sourceId of record.sourceIds) {
      if (seenSourceIds.has(sourceId)) {
        throw new Error(`${label} ${record.id} contains duplicate source ID: ${sourceId}`);
      }

      seenSourceIds.add(sourceId);

      const source = sourceById.get(sourceId);

      if (!source) {
        throw new Error(`${label} ${record.id} references unknown source: ${sourceId}`);
      }

      if (source.status !== 'approved') {
        throw new Error(`${label} ${record.id} references non-approved source: ${sourceId}`);
      }
    }
  }
}

export function ensureAliasQuality(records, label) {
  for (const record of records) {
    const canonicalNames = [record.name.en, record.name.ar]
      .filter(Boolean)
      .map((value) => value.trim().toLowerCase());
    const seenAliases = new Set();

    for (const alias of record.aliases) {
      const normalizedAlias = alias.value.trim().toLowerCase();

      if (canonicalNames.includes(normalizedAlias)) {
        throw new Error(
          `${label} ${record.id} repeats a canonical name in aliases: ${alias.value}`,
        );
      }

      if (seenAliases.has(normalizedAlias)) {
        throw new Error(`${label} ${record.id} contains duplicate alias: ${alias.value}`);
      }

      seenAliases.add(normalizedAlias);
    }
  }
}
