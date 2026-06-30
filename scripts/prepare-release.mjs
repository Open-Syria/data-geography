import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const semverTagPattern =
  /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const releaseStatuses = new Set(['planned', 'seed', 'released', 'deprecated']);
const booleanOptions = new Set([
  'allow-package-version-mismatch',
  'allow-zero-version',
  'help',
  'skip-changelog',
  'skip-qa',
]);

function usage() {
  return `
Usage:
  pnpm run release:prepare -- --version v0.1.0

Options:
  --version <tag>                 Release tag. "v" prefix is optional.
  --status <status>               planned, seed, released, or deprecated. Default: released.
  --published-at <iso>            Release timestamp. Defaults to now for released status.
  --asset-base-url <url>          Public release asset URL prefix.
  --data-dir <path>               Canonical data directory. Default: data.
  --release-dir <path>            Release output directory. Default: dist/release.
  --skip-changelog                Do not require a matching CHANGELOG.md heading.
  --skip-qa                       Skip report, coverage, and HDX comparison scripts.
  --allow-package-version-mismatch
                                  Permit package.json version to differ from --version.
  --allow-zero-version            Permit v0.0.0.
`.trim();
}

function parseArgs(argv) {
  const options = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const equalsIndex = arg.indexOf('=');
    const name = arg.slice(2, equalsIndex === -1 ? undefined : equalsIndex);

    if (booleanOptions.has(name)) {
      if (equalsIndex !== -1) {
        const value = arg.slice(equalsIndex + 1);
        options.set(name, value !== 'false');
      } else {
        options.set(name, true);
      }
      continue;
    }

    const inlineValue = equalsIndex === -1 ? undefined : arg.slice(equalsIndex + 1);
    const nextValue = inlineValue ?? argv[index + 1];

    if (!nextValue || nextValue.startsWith('--')) {
      throw new Error(`--${name} requires a value`);
    }

    if (inlineValue === undefined) {
      index += 1;
    }

    options.set(name, nextValue);
  }

  return options;
}

function fail(message) {
  throw new Error(message);
}

function normalizeReleaseVersion(value) {
  if (!value) {
    fail('--version is required');
  }

  const version = value.startsWith('v') ? value : `v${value}`;

  if (!semverTagPattern.test(version)) {
    fail(`Release version must be a SemVer tag such as v0.1.0: ${value}`);
  }

  return version;
}

function assertValidDateTime(value, label) {
  if (!value || Number.isNaN(Date.parse(value))) {
    fail(`${label} must be a valid ISO date-time string`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: options.env ?? process.env,
    shell: options.shell ?? false,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runPnpm(args) {
  if (process.platform === 'win32') {
    run(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', 'pnpm', ...args]);
    return;
  }

  run('pnpm', args);
}

function runNodeScript(scriptPath, args = [], options = {}) {
  run(process.execPath, [scriptPath, ...args], options);
}

async function assertChangelogHasVersion(releaseVersion) {
  const changelog = await readFile(path.join(root, 'CHANGELOG.md'), 'utf8');
  const versionWithoutPrefix = releaseVersion.slice(1);
  const headingPattern = new RegExp(
    `^##\\s+(?:\\[?${escapeRegExp(releaseVersion)}\\]?|\\[?${escapeRegExp(
      versionWithoutPrefix,
    )}\\]?)\\b`,
    'm',
  );

  if (!headingPattern.test(changelog)) {
    fail(`CHANGELOG.md needs a release heading for ${releaseVersion}`);
  }
}

function resolveInside(baseDirectory, relativePath) {
  const resolvedPath = path.resolve(baseDirectory, relativePath);
  const relative = path.relative(baseDirectory, resolvedPath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    fail(`Refusing to inspect artifact outside release directory: ${relativePath}`);
  }

  return resolvedPath;
}

async function hashFile(filePath) {
  const buffer = await readFile(filePath);

  return {
    buffer,
    sha256: createHash('sha256').update(buffer).digest('hex'),
  };
}

function expectedArtifactUrl(assetBaseUrl, artifactPath) {
  return `${assetBaseUrl.replace(/\/$/, '')}/${path.posix.basename(artifactPath)}`;
}

async function assertJsonArtifactCount(buffer, artifact) {
  const parsed = JSON.parse(buffer.toString('utf8'));
  const items = Array.isArray(parsed) ? parsed : parsed.items;

  if (!Array.isArray(items)) {
    fail(`${artifact.path} must contain an array or an object with an items array`);
  }

  if (items.length !== artifact.recordCount) {
    fail(
      `${artifact.path} recordCount is ${artifact.recordCount}, but the JSON artifact has ${items.length} records`,
    );
  }
}

async function verifyReleaseManifest({
  assetBaseUrl,
  releaseDirectory,
  releasePublishedAt,
  releaseStatus,
  releaseVersion,
}) {
  const manifestPath = path.join(releaseDirectory, 'release-manifest.json');
  const manifest = await readJson(manifestPath);

  if (manifest.release.version !== releaseVersion) {
    fail(`Manifest version is ${manifest.release.version}, expected ${releaseVersion}`);
  }

  if (manifest.release.status !== releaseStatus) {
    fail(`Manifest status is ${manifest.release.status}, expected ${releaseStatus}`);
  }

  if (releaseStatus === 'released' && !manifest.release.publishedAt) {
    fail('Released manifests must include release.publishedAt');
  }

  if (releasePublishedAt && manifest.release.publishedAt !== releasePublishedAt) {
    fail(`Manifest publishedAt is ${manifest.release.publishedAt}, expected ${releasePublishedAt}`);
  }

  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
    fail('Release manifest must list at least one artifact');
  }

  const sourceRegistry = await readJson(path.join(root, 'data', 'sources.json'));
  const nonApprovedSourceIds = new Set(
    sourceRegistry.filter((source) => source.status !== 'approved').map((source) => source.id),
  );

  for (const source of manifest.sources) {
    if (nonApprovedSourceIds.has(source.id)) {
      fail(`Release manifest includes non-approved source: ${source.id}`);
    }
  }

  const seenArtifactKeys = new Set();
  const recordCountsByName = new Map();

  for (const artifact of manifest.artifacts) {
    const artifactKey = `${artifact.name}:${artifact.format}`;

    if (seenArtifactKeys.has(artifactKey)) {
      fail(`Duplicate artifact entry: ${artifactKey}`);
    }

    seenArtifactKeys.add(artifactKey);

    if (!Number.isInteger(artifact.recordCount) || artifact.recordCount <= 0) {
      fail(`${artifact.path} must include a positive recordCount`);
    }

    const existingCount = recordCountsByName.get(artifact.name);

    if (existingCount !== undefined && existingCount !== artifact.recordCount) {
      fail(`${artifact.name} artifacts disagree on recordCount`);
    }

    recordCountsByName.set(artifact.name, artifact.recordCount);

    if (!artifact.url) {
      fail(`${artifact.path} is missing a public artifact URL`);
    }

    const expectedUrl = expectedArtifactUrl(assetBaseUrl, artifact.path);

    if (artifact.url !== expectedUrl) {
      fail(`${artifact.path} URL is ${artifact.url}, expected ${expectedUrl}`);
    }

    const artifactPath = resolveInside(releaseDirectory, artifact.path);
    const artifactStats = await stat(artifactPath);

    if (artifactStats.size !== artifact.sizeBytes) {
      fail(`${artifact.path} size is ${artifactStats.size}, expected ${artifact.sizeBytes}`);
    }

    const { buffer, sha256 } = await hashFile(artifactPath);

    if (sha256 !== artifact.sha256) {
      fail(`${artifact.path} sha256 is ${sha256}, expected ${artifact.sha256}`);
    }

    if (artifact.format === 'json') {
      await assertJsonArtifactCount(buffer, artifact);
    }
  }

  return manifest;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.get('help')) {
    console.log(usage());
    return;
  }

  const releaseVersion = normalizeReleaseVersion(options.get('version'));
  const releaseStatus = options.get('status') ?? 'released';

  if (!releaseStatuses.has(releaseStatus)) {
    fail(`Unsupported release status: ${releaseStatus}`);
  }

  if (releaseVersion === 'v0.0.0' && !options.get('allow-zero-version')) {
    fail('Refusing to prepare v0.0.0. Choose a real release tag such as v0.1.0.');
  }

  const packageJson = await readJson(path.join(root, 'package.json'));
  const packageVersion = packageJson.version;
  const versionWithoutPrefix = releaseVersion.slice(1);

  if (packageVersion !== versionWithoutPrefix && !options.get('allow-package-version-mismatch')) {
    fail(
      `package.json version is ${packageVersion}, expected ${versionWithoutPrefix}. Update it or pass --allow-package-version-mismatch for a dry run.`,
    );
  }

  const releasePublishedAt =
    options.get('published-at') ?? (releaseStatus === 'released' ? new Date().toISOString() : null);

  if (releasePublishedAt) {
    assertValidDateTime(releasePublishedAt, '--published-at');
  }

  if (releaseStatus === 'released' && !options.get('skip-changelog')) {
    await assertChangelogHasVersion(releaseVersion);
  }

  const releaseDirectory = path.resolve(root, options.get('release-dir') ?? 'dist/release');
  const dataDirectory = path.resolve(root, options.get('data-dir') ?? 'data');
  const assetBaseUrl =
    options.get('asset-base-url') ??
    `https://github.com/Open-Syria/data-geography/releases/download/${releaseVersion}`;
  const releaseEnv = {
    ...process.env,
    RELEASE_ASSET_BASE_URL: assetBaseUrl,
    RELEASE_STATUS: releaseStatus,
    RELEASE_VERSION: releaseVersion,
  };

  if (releasePublishedAt) {
    releaseEnv.RELEASE_PUBLISHED_AT = releasePublishedAt;
  } else {
    delete releaseEnv.RELEASE_PUBLISHED_AT;
  }

  runPnpm(['run', 'check']);
  runNodeScript('scripts/validate-schemas.mjs');
  runNodeScript('scripts/validate-imports.mjs');
  runNodeScript('scripts/validate-data.mjs', [`--data-dir=${dataDirectory}`]);
  runNodeScript(
    'scripts/build-release.mjs',
    [`--data-dir=${dataDirectory}`, `--release-dir=${releaseDirectory}`],
    { env: releaseEnv },
  );

  const manifest = await verifyReleaseManifest({
    assetBaseUrl,
    releaseDirectory,
    releasePublishedAt,
    releaseStatus,
    releaseVersion,
  });

  if (!options.get('skip-qa')) {
    runNodeScript('scripts/report-data.mjs', [`--data-dir=${dataDirectory}`]);
    runNodeScript('scripts/analyze-coverage.mjs', [`--data-dir=${dataDirectory}`]);
    runNodeScript('scripts/compare-hdx-admin-boundaries.mjs', [`--data-dir=${dataDirectory}`]);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        releaseDirectory,
        version: manifest.release.version,
        status: manifest.release.status,
        publishedAt: manifest.release.publishedAt,
        artifacts: manifest.artifacts.length,
        sources: manifest.sources.length,
      },
      null,
      2,
    ),
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
