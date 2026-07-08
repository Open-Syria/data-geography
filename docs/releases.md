# Releases

`data-geography` uses a maintainer-controlled, tag-driven release flow for
public dataset artifacts.

This repository does not use release-please. Dataset releases should remain
intentional publication events: maintainers update the version, changelog, data
quality notes, and release checklist before publishing artifacts.

## What A Release Publishes

Pushing a version tag such as `v0.1.3` runs `.github/workflows/release.yml`.

The release workflow:

1. Installs dependencies.
2. Runs `pnpm run release:prepare -- --version "$GITHUB_REF_NAME" --skip-qa`.
3. Rebuilds `dist/release`.
4. Verifies `release-manifest.json`.
5. Publishes `release-manifest.json` and generated artifacts to the GitHub Release.

The tagged GitHub workflow skips maintainer-local QA that depends on ignored raw
source files, such as the HDX administrative boundary workbook. Maintainers
should run the full local `release:prepare` command before tagging; the workflow
then rebuilds and verifies the release from committed, reproducible inputs.

Generated artifacts include JSON, NDJSON, CSV, SQL, YAML, and XML files for:

```text
governorates
districts
subdistricts
localities
```

## Release Gates

`release:prepare` verifies:

- `package.json` version matches the release tag,
- `CHANGELOG.md` contains a heading for the release,
- schemas, imports, and canonical data validate,
- generated artifact URLs target the release tag,
- artifact sizes, checksums, and record counts match the manifest,
- release sources are approved,
- data reports and coverage analysis pass.

The release checklist remains the step-by-step operational gate:

```text
docs/RELEASE_CHECKLIST.md
```

## Maintainer Flow

1. Make the data, schema, source, import, or release-script change.
2. Update affected docs such as data schema, field reference, source docs, import workflow, quality, coverage, generated artifacts, and this file when release behavior changes.
3. Update `CHANGELOG.md` with the public data or artifact changes.
4. Update `package.json` version.
5. Run validation:

```bash
pnpm run validate
pnpm run report:data
pnpm run coverage:data
pnpm run release:prepare -- --version v0.1.3
```

6. Create and push the version tag:

```bash
git tag v0.1.3
git push origin v0.1.3
```

7. Confirm the GitHub Release assets are present and downloadable.
8. Confirm `datasets-api` can sync the release before updating production pins.

## Downstream Coordination

After publishing a dataset release, update downstream consumers only through
reviewed changes:

- `datasets-api/dataset-releases.json` when the API should serve the new release,
- website dataset metadata when record counts, titles, descriptions, release versions, or download links change,
- root/workspace docs when public release status or roadmap language changes.

Production does not automatically follow the latest dataset GitHub Release.
