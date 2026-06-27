# Pre-Seed Checklist

Use this checklist before adding the first real geography records.

## Repository Setup

- `pnpm install` completes with the committed lockfile.
- `pnpm run validate` passes.
- `pnpm run report:data` runs successfully.
- Git working tree is clean before starting a seed import.
- Raw source files are kept under ignored local paths such as `imports/raw/` or `imports/tmp/`.

## Source Readiness

- The source exists in `data/sources.json`.
- The source has a clear license and source URL.
- The source status is correct: `approved`, `restricted`, `proposed`, or `rejected`.
- Only `approved` sources are referenced by records.
- Any OSM-derived source has explicit ODbL handling before it touches default release records.
- Source decisions are reflected in [SOURCE_DECISIONS.md](SOURCE_DECISIONS.md).

## Import Readiness

- The import follows [IMPORT_WORKFLOW.md](IMPORT_WORKFLOW.md).
- A source import manifest exists under `imports/manifests/` for batch imports.
- `pnpm run validate:imports` passes.
- Imported fields are listed in the import manifest.
- Transformation steps are documented clearly enough to reproduce or review.

## Data Readiness

- Canonical records are edited only under `data/`.
- Records include stable IDs following [ID_POLICY.md](ID_POLICY.md).
- Records include `aliases` as an array and `externalIds` as an object.
- Parent records are added before child records.
- Coordinates are `null` unless a reusable source supports them.
- AI output is not cited as a source.
- Uncertainty is documented in `notes` or left out.

## Quality Gates

- `pnpm run validate` passes.
- `pnpm run report:data` has been reviewed.
- Duplicate names in the report are reviewed.
- Missing Arabic names are either filled from reusable sources or accepted as known gaps.
- Low centroid or external ID coverage is accepted as a known gap before release.

## Release Dry Run

- `pnpm run release:build` succeeds.
- `dist/release/release-manifest.json` lists expected sources and artifacts.
- Generated artifacts under `dist/release/artifacts/` have expected record counts.
- Generated files are not committed unless the maintainer is preparing an explicit release branch.

## First Seed Order

Recommended order:

1. Sources.
2. Governorates.
3. Districts.
4. Subdistricts.
5. Localities.

Do not seed lower administrative levels before parent IDs are stable.
