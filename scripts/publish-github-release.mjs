import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const booleanOptions = new Set(['dry-run', 'help']);

function usage() {
  return `
Usage:
  pnpm run release:publish:github -- --tag v0.1.3

Options:
  --tag <tag>             Release tag. Defaults to GITHUB_REF_NAME.
  --release-dir <path>    Release output directory. Default: dist/release.
  --dry-run               Print planned uploads without calling GitHub.
`.trim();
}

function parseArgs(argv) {
  const options = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') {
      continue;
    }

    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const equalsIndex = arg.indexOf('=');
    const name = arg.slice(2, equalsIndex === -1 ? undefined : equalsIndex);

    if (booleanOptions.has(name)) {
      options.set(name, equalsIndex === -1 ? true : arg.slice(equalsIndex + 1) !== 'false');
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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

async function githubRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${requireEnv('GITHUB_TOKEN')}`,
      'User-Agent': 'OpenSyria-Data-Release',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub request failed ${response.status} ${response.statusText}: ${body}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function getReleaseByTag(repository, tag) {
  const response = await fetch(`https://api.github.com/repos/${repository}/releases/tags/${tag}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${requireEnv('GITHUB_TOKEN')}`,
      'User-Agent': 'OpenSyria-Data-Release',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub release lookup failed ${response.status} ${response.statusText}: ${body}`,
    );
  }

  return response.json();
}

async function createRelease(repository, tag, manifest) {
  return githubRequest(`https://api.github.com/repos/${repository}/releases`, {
    method: 'POST',
    body: JSON.stringify({
      tag_name: tag,
      name: tag,
      body: releaseBody(manifest),
      draft: false,
      prerelease: tag.includes('-'),
    }),
  });
}

function releaseBody(manifest) {
  const lines = [
    `OpenSyria geography dataset ${manifest.release.version}.`,
    '',
    `Artifacts: ${manifest.artifacts.length}`,
    `Sources: ${manifest.sources.length}`,
  ];

  return lines.join('\n');
}

async function collectReleaseAssets(releaseDirectory, manifest) {
  const artifactsDirectory = path.join(releaseDirectory, 'artifacts');
  const artifactFiles = await readdir(artifactsDirectory);
  const mediaTypesByName = new Map(
    manifest.artifacts.map((artifact) => [path.posix.basename(artifact.path), artifact.mediaType]),
  );
  const assets = [
    {
      name: 'release-manifest.json',
      filePath: path.join(releaseDirectory, 'release-manifest.json'),
      mediaType: 'application/json',
    },
  ];

  for (const fileName of artifactFiles.sort()) {
    assets.push({
      name: fileName,
      filePath: path.join(artifactsDirectory, fileName),
      mediaType: mediaTypesByName.get(fileName) ?? 'application/octet-stream',
    });
  }

  return assets;
}

async function deleteExistingAsset(repository, asset) {
  await githubRequest(`https://api.github.com/repos/${repository}/releases/assets/${asset.id}`, {
    method: 'DELETE',
  });
}

async function uploadAsset(release, asset) {
  const buffer = await readFile(asset.filePath);
  const uploadUrl = `${release.upload_url.replace(/\{.*$/, '')}?name=${encodeURIComponent(
    asset.name,
  )}`;

  return githubRequest(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(buffer.byteLength),
      'Content-Type': asset.mediaType,
    },
    body: buffer,
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.get('help')) {
    console.log(usage());
    return;
  }

  const tag = options.get('tag') ?? process.env.GITHUB_REF_NAME;

  if (!tag) {
    throw new Error('--tag is required when GITHUB_REF_NAME is not set');
  }

  const releaseDirectory = path.resolve(root, options.get('release-dir') ?? 'dist/release');
  const manifest = await readJson(path.join(releaseDirectory, 'release-manifest.json'));

  if (manifest.release.version !== tag) {
    throw new Error(`Manifest version is ${manifest.release.version}, expected ${tag}`);
  }

  const assets = await collectReleaseAssets(releaseDirectory, manifest);

  if (options.get('dry-run')) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: true,
          tag,
          releaseDirectory: path.relative(root, releaseDirectory).replaceAll('\\', '/'),
          assets: assets.map((asset) => ({
            name: asset.name,
            mediaType: asset.mediaType,
          })),
        },
        null,
        2,
      ),
    );
    return;
  }

  const repository = requireEnv('GITHUB_REPOSITORY');
  const existingRelease = await getReleaseByTag(repository, tag);
  const release = existingRelease ?? (await createRelease(repository, tag, manifest));
  const existingAssetsByName = new Map((release.assets ?? []).map((asset) => [asset.name, asset]));

  for (const asset of assets) {
    const existingAsset = existingAssetsByName.get(asset.name);

    if (existingAsset) {
      await deleteExistingAsset(repository, existingAsset);
    }

    await uploadAsset(release, asset);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        tag,
        releaseUrl: release.html_url,
        assets: assets.length,
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
