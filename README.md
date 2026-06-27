# OpenSyria Data Geography

OpenSyria Data Geography is the canonical repository for public, non-personal Syrian administrative geography data.

This repository will publish versioned release artifacts consumed by [`datasets-api`](https://github.com/Open-Syria/datasets-api). It is focused on stable reference data, not live maps or operational/security information.

## Scope

Planned geography datasets:

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

This repository is in its seed setup phase.

The first implemented artifact is:

```text
artifacts/governorates.json
```

The initial data files are intentionally empty until the first maintainer-led seed import is prepared and reviewed.

## Repository Layout

```text
data/
  governorates.json
  districts.json
  subdistricts.json
  localities.json
  sources.json
schemas/
  governorates.schema.json
scripts/
  validate-data.mjs
  build-release.mjs
docs/
  DATA_SCHEMA.md
  FIELD_REFERENCE.md
  GENERATED_ARTIFACTS.md
  REVIEW_PROCESS.md
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

## Commands

```bash
corepack enable pnpm
pnpm install
pnpm run validate
pnpm run release:build
```

Generated release files are written to:

```text
dist/release/
```

Generated artifacts are built from canonical JSON files and must not be edited directly. See [docs/GENERATED_ARTIFACTS.md](docs/GENERATED_ARTIFACTS.md).

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

## Source Policy

Every record should be traceable to reusable sources.

Preferred seed sources include:

- geoBoundaries for administrative boundaries,
- GeoNames for place names and feature references,
- Wikidata for public identifiers and cross-checking.

OpenStreetMap data is useful, but OSM-derived data has ODbL share-alike requirements. It should not be mixed into the default CC BY release unless the maintainer explicitly approves the licensing approach.

See [docs/SOURCES.md](docs/SOURCES.md).

Maintainer review rules live in [docs/REVIEW_PROCESS.md](docs/REVIEW_PROCESS.md).

## License

See [LICENSE.md](LICENSE.md).
