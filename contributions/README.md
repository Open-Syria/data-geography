# Geography Contribution Guide

This guide explains how to contribute data changes to `data-geography`.

The goal is to make contributions easy to review without letting the dataset schema drift. Contributors can improve approved data. Maintainers control schemas, dataset subjects, release artifacts, and source policy.

The same rules are summarized for future automation in [`rules.json`](rules.json).

## What You Can Contribute

Accepted as normal data pull requests:

- fix incorrect values,
- add missing approved records,
- add Arabic names, English names, aliases, or transliterations,
- improve source attribution,
- replace weak sources with stronger approved sources,
- fix parent relationships,
- fix coordinates when the schema already supports coordinates,
- mark records as deprecated when sources support that change.

Not accepted as normal pull requests:

- new fields,
- schema changes,
- ID format changes,
- new dataset topics,
- generated release pipeline changes,
- large automated imports without maintainer approval,
- data from unclear or incompatible sources,
- personal, private, military, checkpoint, surveillance, or security-related data.

Use a schema proposal issue before working on anything outside the current schema.

## Files Contributors Should Edit

Usually edit only:

```text
data/governorates.json
data/districts.json
data/subdistricts.json
data/localities.json
data/sources.json
```

Do not edit generated output:

```text
dist/
```

Generated artifacts include JSON, NDJSON, CSV, SQL, YAML, and XML files. These are all built from canonical JSON source files under `data/`.

GeoJSON and SQLite are planned later.

Do not edit schema, scripts, or workflow files unless the maintainer has approved that work:

```text
schemas/
scripts/
.github/workflows/
examples/
fixtures/
```

Files under `examples/` are documentation examples. Files under `fixtures/` are test-only fake records used by validation. They are not contribution targets for normal data PRs.

## Contribution Types

### Add Missing Data

Use this when a valid record is missing from an approved dataset.

Checklist:

- choose the correct file under `data/`,
- create a stable `id`,
- include `name.en`,
- include `name.ar` when known,
- include `aliases` as an array, even when empty,
- include `iso31662` for governorates when known, otherwise `null`,
- include `centroid` when the schema supports it and the source is clear, otherwise `null`,
- include `externalIds` as an object, even when empty,
- include at least one approved `sourceId`,
- set `sourceStatus` to `seed` or `pending_release`.

### Correct Existing Data

Use this when a value is wrong, outdated, misspelled, duplicated, or linked to the wrong parent.

Checklist:

- keep the existing `id` unless the maintainer approves an ID migration,
- update only the incorrect fields,
- add or update source IDs,
- explain why the correction is needed in the pull request,
- do not mix unrelated corrections into one PR.

### Add Names, Aliases, or Transliterations

Use `aliases` for alternate names, historical spellings, or transliterations.

Do not duplicate `name.en` or `name.ar` inside `aliases`.

Example:

```json
{
  "value": "Dimashq",
  "language": "en",
  "type": "transliteration"
}
```

### Improve Sources

Use this when a record has missing, weak, or outdated source attribution.

Checklist:

- add the source to `data/sources.json` if it is new,
- confirm the source license allows reuse,
- mark the source as `approved`, `restricted`, `proposed`, or `rejected`,
- reference only `approved` sources from data records,
- do not add OSM-derived values unless the maintainer approves the ODbL approach.

## ID Rules

IDs must:

- be stable,
- start with `sy-`,
- use lowercase kebab-case,
- not include accents, apostrophes, underscores, or spaces,
- not change because a display name improves.

Examples:

```text
sy-damascus
sy-rif-dimashq
sy-aleppo
```

See [`../docs/ID_POLICY.md`](../docs/ID_POLICY.md) for the full ID policy.

## Parent Relationship Rules

Administrative records must reference valid parents:

```text
district.governorateId -> governorates.id
subdistrict.districtId -> districts.id
subdistrict.governorateId -> governorates.id
locality.governorateId -> governorates.id
locality.districtId -> districts.id, when present
locality.subdistrictId -> subdistricts.id, when present
```

Validation fails if a parent ID does not exist.

## Source Rules

Every record must have at least one `sourceId`.

Allowed record sources:

- sources with `status: "approved"` in `data/sources.json`.

Not allowed as record sources:

- `restricted`,
- `proposed`,
- `rejected`,
- unknown source IDs.

AI may help organize or compare data, but AI output is not a source.

Source decisions are tracked in [`../docs/SOURCE_DECISIONS.md`](../docs/SOURCE_DECISIONS.md).

## Running Validation

Install dependencies:

```bash
corepack enable pnpm
pnpm install
```

Validate:

```bash
pnpm run validate
```

This checks:

- formatting,
- published schema metadata,
- schema shape,
- unknown fields,
- unique IDs,
- unique ISO codes,
- known approved sources,
- parent relationships,
- duplicate aliases,
- generated release artifact compatibility.

Generated artifact rules are documented in [`../docs/GENERATED_ARTIFACTS.md`](../docs/GENERATED_ARTIFACTS.md).

## Review Flow

1. Contributor opens a focused PR.
2. CI runs validation.
3. Maintainer reviews source quality and licensing.
4. Maintainer reviews data semantics and parent relationships.
5. Maintainer either requests changes, approves, or closes the PR with an explanation.
6. Merged data is included in a future maintainer-controlled release.

Passing CI does not guarantee acceptance. Source quality, licensing, safety, and scope still matter.
