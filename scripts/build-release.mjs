import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  datasetReleaseStatusSchema,
  governorateRecordSchema,
  parseJsonArray,
  readJson,
  releaseManifestSchema,
  sourceRecordSchema,
} from './lib/data-schemas.mjs';

const root = process.cwd();
const releaseDirectory = path.join(root, 'dist/release');
const artifactsDirectory = path.join(releaseDirectory, 'artifacts');
const packageJson = await readJson(path.join(root, 'package.json'));
const releaseVersion = process.env.RELEASE_VERSION ?? `v${packageJson.version}`;
const releaseStatus = datasetReleaseStatusSchema.parse(process.env.RELEASE_STATUS ?? 'seed');
const releasePublishedAt = process.env.RELEASE_PUBLISHED_AT ?? null;
const assetBaseUrl = process.env.RELEASE_ASSET_BASE_URL;

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function getArtifactUrl(fileName) {
  if (!assetBaseUrl) {
    return undefined;
  }

  return `${assetBaseUrl.replace(/\/$/, '')}/${fileName}`;
}

function stringifyJson(data) {
  return JSON.stringify(data, null, 2).replace(
    /[\u007f-\uffff]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}

function mapGovernorate(record) {
  return {
    id: record.id,
    name: record.name,
    iso31662: record.iso31662,
    centroid: record.centroid,
    sourceStatus: record.sourceStatus,
  };
}

async function writeJson(filePath, data) {
  const buffer = Buffer.from(`${stringifyJson(data)}\n`);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);

  return buffer;
}

const governorates = parseJsonArray(
  governorateRecordSchema,
  await readJson(path.join(root, 'data/governorates.json')),
  'governorates',
);
const sources = parseJsonArray(
  sourceRecordSchema,
  await readJson(path.join(root, 'data/sources.json')),
  'sources',
);
const governoratesArtifactPath = path.join(artifactsDirectory, 'governorates.json');
const governoratesArtifact = {
  items: governorates.map(mapGovernorate),
};
const governoratesArtifactBuffer = await writeJson(governoratesArtifactPath, governoratesArtifact);
const approvedSources = sources.filter((source) => source.status === 'approved');

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
  artifacts: [
    {
      name: 'governorates',
      format: 'json',
      path: 'artifacts/governorates.json',
      ...(getArtifactUrl('governorates.json') ? { url: getArtifactUrl('governorates.json') } : {}),
      sha256: sha256(governoratesArtifactBuffer),
      sizeBytes: governoratesArtifactBuffer.byteLength,
      recordCount: governorates.length,
      mediaType: 'application/json',
    },
  ],
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
      releaseDirectory,
      artifacts: manifest.artifacts,
    },
    null,
    2,
  ),
);
