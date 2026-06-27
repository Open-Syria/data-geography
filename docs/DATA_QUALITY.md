# Data Quality

This document defines the maintainer quality checks to use before and during geography seeding.

Validation answers: "Is this data structurally allowed?"

Reporting answers: "How complete, sourceable, and reviewable is this data?"

## Commands

Run full validation:

```bash
pnpm run validate
```

Generate a quality report for canonical data:

```bash
pnpm run report:data
```

Generate a quality report for test fixtures:

```bash
pnpm run report:fixtures
```

## What Validation Blocks

Validation fails on:

- invalid JSON shape,
- unknown fields,
- missing required fields,
- duplicate IDs,
- duplicate source IDs on one record,
- records that reference unknown sources,
- records that reference non-approved sources,
- invalid parent relationships,
- duplicate aliases within a record,
- aliases that duplicate canonical names,
- invalid release manifest shape.

## What Reports Show

The quality report shows:

- source counts by status,
- source counts by license,
- record counts by dataset,
- record counts by `sourceStatus`,
- source usage by dataset,
- Arabic-name coverage,
- centroid coverage,
- area coverage,
- population coverage,
- external ID coverage,
- duplicate English names,
- duplicate Arabic names.

Duplicate names are warnings, not automatic failures. Some place names may legitimately repeat. Maintainers should review duplicates before release.

## Pre-Seed Quality Targets

Before publishing the first seed release:

- validation must pass,
- every record must have at least one approved source,
- no default release record should cite a restricted source,
- governorates should have Arabic and English names where sourceable,
- parent IDs must be stable before lower-level records are added,
- uncertain coordinates should be left as `null`,
- uncertain names should be documented in `notes` or left out,
- duplicate names should be reviewed and explained when necessary.

## Field Completeness

Completeness targets vary by field.

| Field | Quality expectation |
| --- | --- |
| `id` | Required for every record and stable after release. |
| `name.en` | Required for every record. |
| `name.ar` | Strongly preferred when sourceable. |
| `aliases` | Empty array when no aliases are known. |
| `centroid` | Optional; use `null` unless a reusable source is clear. |
| `area` | Optional; use a sourced measurement object or `null`. |
| `population` | Optional; use a dated sourced measurement object or `null`. |
| `externalIds` | Empty object when none are known. |
| `sourceIds` | Required and approved. |
| `notes` | Use for uncertainty and maintainer review context. |

## Release Review

Before a release, maintainers should compare:

```bash
pnpm run validate
pnpm run report:data
```

Use the report to decide whether the release notes should mention known gaps such as missing Arabic names, low coordinate coverage, or unresolved duplicate names.
