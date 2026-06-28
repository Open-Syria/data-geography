# OpenSyria Data Geography

[![Validate](https://github.com/Open-Syria/data-geography/actions/workflows/validate.yml/badge.svg)](https://github.com/Open-Syria/data-geography/actions/workflows/validate.yml)
[![License](https://img.shields.io/badge/license-see%20LICENSE.md-blue.svg)](LICENSE.md)
[![Node.js 24+](https://img.shields.io/badge/node-%3E%3D24-339933?logo=node.js&logoColor=white)](package.json)
[![pnpm 11](https://img.shields.io/badge/pnpm-11-F69220?logo=pnpm&logoColor=white)](package.json)

OpenSyria Data Geography is the canonical repository for public, non-personal Syrian administrative geography data.

This repository publishes versioned release artifacts consumed by [`datasets-api`](https://github.com/Open-Syria/datasets-api). It is focused on stable reference data, not live maps or operational/security information.

## Table of Contents

- [Scope](#scope)
- [Current Status](#current-status)
- [Repository Layout](#repository-layout)
- [Data Workflow](#data-workflow)
- [Commands](#commands)
- [Maintainer Tooling](#maintainer-tooling)
- [Contribution Model](#contribution-model)
- [Source Policy](#source-policy)
- [Public Documentation](#public-documentation)
- [License](#license)

## Scope

Geography coverage includes:

- governorates,
- districts,
- subdistricts,
- cities,
- towns,
- villages,
- localities.

Out of scope:

- personal data,
- private addresses,
- checkpoints,
- military/security locations,
- surveillance-related data,
- unsourced political claims,
- proprietary map data,
- data that cannot be legally redistributed.

## Current Status

The first public seed release is `v0.1.0`.

Current seed coverage:

| Dataset | Records |
| --- | ---: |
| Governorates | 14 |
| Districts | 62 |
| Subdistricts | 272 |
| Localities | 7,605 |

The release generator currently produces artifacts for:

```text
governorates
districts
subdistricts
localities
```

in JSON, NDJSON, CSV, SQL, YAML, and XML formats.

The seed data is source-backed and maintainer-reviewed. Known gaps are tracked in the data quality and currency documents, and improvements should be made through source-backed follow-up releases.

## Repository Layout

```text
data/
  governorates.json
  districts.json
  subdistricts.json
  localities.json
  sources.json
schemas/
  README.md
  sources.schema.json
  governorates.schema.json
  districts.schema.json
  subdistricts.schema.json
  localities.schema.json
  release-manifest.schema.json
scripts/
  validate-data.mjs
  validate-schemas.mjs
  validate-imports.mjs
  build-release.mjs
  report-data.mjs
  analyze-coverage.mjs
imports/
  README.md
  manifests/
examples/
  *.example.json
fixtures/
  valid-data/
docs/
  DATA_SCHEMA.md
  COVERAGE_ANALYSIS.md
  DATA_QUALITY.md
  FIELD_REFERENCE.md
  GENERATED_ARTIFACTS.md
  ID_POLICY.md
  IMPORT_WORKFLOW.md
  PRE_SEED_CHECKLIST.md
  RELEASE_CHECKLIST.md
  REVIEW_PROCESS.md
  SEED_PLAN.md
  SOURCE_DECISIONS.md
  SOURCES.md
contributions/
  README.md
```

## Data Workflow

1. Edit canonical files under `data/`.
2. Run validation.
3. Build release artifacts.
4. Publish a GitHub Release with:
   - `release-manifest.json`
   - files under `artifacts/`

Examples live under `examples/`. Machine-validated fake fixture data lives under `fixtures/valid-data/`.

## Commands

```bash
corepack enable pnpm
pnpm install
pnpm run validate
pnpm run validate:schemas
pnpm run validate:imports
pnpm run release:prepare -- --version v0.1.0
pnpm run release:build
pnpm run report:data
pnpm run coverage:data
pnpm run validate:fixtures
pnpm run release:build:fixtures
```

Generated release files are written to:

```text
dist/release/
```

Generated artifacts are built from canonical JSON files and must not be edited directly. See [docs/GENERATED_ARTIFACTS.md](docs/GENERATED_ARTIFACTS.md).

Coverage analysis files are written to:

```text
dist/coverage/
```

Use [docs/COVERAGE_ANALYSIS.md](docs/COVERAGE_ANALYSIS.md) to identify missing fields, parent hierarchy gaps, and focused contribution targets.

## Maintainer Tooling

This repository uses:

- Biome for formatting and checks,
- Husky for local Git hooks,
- lint-staged for staged-file checks,
- commitlint for Conventional Commit messages.

Hooks run lightweight checks before commits. CI still runs the full validation workflow.

## Contribution Model

Contributions are limited to improving approved datasets:

- fixing incorrect values,
- adding missing records,
- improving names, aliases, translations, and transliterations,
- improving source attribution,
- correcting administrative relationships,
- correcting coordinates when the schema already supports coordinates.

New fields, new dataset topics, ID format changes, validation changes, and release pipeline changes require a maintainer-approved schema proposal first.

See [CONTRIBUTING.md](CONTRIBUTING.md).

Detailed contributor workflow lives in [contributions/README.md](contributions/README.md).

Maintainer workflow and review references:

- [docs/PRE_SEED_CHECKLIST.md](docs/PRE_SEED_CHECKLIST.md)
- [docs/SEED_PLAN.md](docs/SEED_PLAN.md)
- [docs/IMPORT_WORKFLOW.md](docs/IMPORT_WORKFLOW.md)
- [docs/COVERAGE_ANALYSIS.md](docs/COVERAGE_ANALYSIS.md)
- [docs/DATA_QUALITY.md](docs/DATA_QUALITY.md)
- [docs/ID_POLICY.md](docs/ID_POLICY.md)
- [docs/SOURCE_DECISIONS.md](docs/SOURCE_DECISIONS.md)
- [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md)

## Source Policy

Every record should be traceable to reusable sources.

Preferred seed sources include:

- geoBoundaries for administrative boundaries,
- GeoNames for place names and feature references,
- Wikidata for public identifiers and cross-checking.

OpenStreetMap data is useful, but OSM-derived data has ODbL share-alike requirements. It should not be mixed into the default CC BY release unless the maintainer explicitly approves the licensing approach.

See [docs/SOURCES.md](docs/SOURCES.md).

Maintainer review rules live in [docs/REVIEW_PROCESS.md](docs/REVIEW_PROCESS.md).

## Public Documentation

- [Contribution guide](CONTRIBUTING.md)
- [Detailed contribution workflow](contributions/README.md)
- [Review process](docs/REVIEW_PROCESS.md)
- [Data schema](docs/DATA_SCHEMA.md)
- [Field reference](docs/FIELD_REFERENCE.md)
- [ID policy](docs/ID_POLICY.md)
- [Source policy](docs/SOURCES.md)
- [Source decisions](docs/SOURCE_DECISIONS.md)
- [Data quality](docs/DATA_QUALITY.md)
- [Data currency](docs/DATA_CURRENCY.md)
- [Coverage analysis](docs/COVERAGE_ANALYSIS.md)
- [Generated artifacts](docs/GENERATED_ARTIFACTS.md)
- [Import workflow](docs/IMPORT_WORKFLOW.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Support](SUPPORT.md)
- [Security policy](SECURITY.md)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

See [LICENSE.md](LICENSE.md).
