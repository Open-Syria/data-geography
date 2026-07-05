# Contributing

Thanks for helping improve OpenSyria geography data.

This repository accepts controlled data contributions. The maintainer owns the dataset scope, schemas, release pipeline, validation rules, and source acceptance policy.

Start with the full contributor guide:

```text
contributions/README.md
```

## Table of Contents

- [Contributor Quick Start](#contributor-quick-start)
- [Accepted Contributions](#accepted-contributions)
- [Not Accepted as Normal Pull Requests](#not-accepted-as-normal-pull-requests)
- [Files and Reference Docs](#files-and-reference-docs)
- [Schema Proposals](#schema-proposals)
- [Source Rules](#source-rules)
- [Validation](#validation)
- [Pull Request Checklist](#pull-request-checklist)

## Contributor Quick Start

For a normal data correction or missing-record pull request:

1. Read the detailed workflow in [contributions/README.md](contributions/README.md).
2. Pick one focused change, such as one missing source, one hierarchy correction, or one small group of related records.
3. Edit only the canonical JSON files under `data/` unless a maintainer approved broader work.
4. Confirm every changed value is backed by an approved reusable source in `data/sources.json`.
5. Run `corepack enable pnpm`, `pnpm install`, and `pnpm run validate`.
6. Open a pull request that lists the changed files, source IDs, source URLs, and any uncertainty or conflict.

## Accepted Contributions

You may open pull requests for:

- fixing incorrect records,
- adding missing records within the approved geography scope,
- adding aliases, Arabic names, English names, and transliterations,
- improving source attribution,
- replacing weak sources with stronger reusable sources,
- correcting administrative relationships,
- correcting coordinates when the schema already includes coordinate fields,
- marking records as deprecated, renamed, merged, uncertain, or replaced when supported by sources.

Record IDs must follow [docs/ID_POLICY.md](docs/ID_POLICY.md).

## Not Accepted as Normal Pull Requests

Do not open direct PRs for:

- new dataset topics,
- new fields,
- schema changes,
- ID format changes,
- validation rule changes,
- release pipeline changes,
- large automated imports without prior maintainer approval,
- proprietary or unclear-license data,
- personal, private, sensitive, military, checkpoint, surveillance, or security-related data.

These changes require a schema proposal or maintainer approval before implementation.

Generated files under `dist/`, examples under `examples/`, fixtures under `fixtures/`, validation scripts, schemas, and release workflows are maintainer-owned unless the maintainer explicitly asks for changes.

## Files and Reference Docs

Normal data pull requests usually edit:

| Need | File or doc |
| --- | --- |
| Governorate records | [data/governorates.json](data/governorates.json) |
| District records | [data/districts.json](data/districts.json) |
| Subdistrict records | [data/subdistricts.json](data/subdistricts.json) |
| Locality records | [data/localities.json](data/localities.json) |
| Source registry | [data/sources.json](data/sources.json) |
| Field rules | [docs/FIELD_REFERENCE.md](docs/FIELD_REFERENCE.md) |
| Stable ID rules | [docs/ID_POLICY.md](docs/ID_POLICY.md) |
| Source policy | [docs/SOURCES.md](docs/SOURCES.md) |
| Source decisions | [docs/SOURCE_DECISIONS.md](docs/SOURCE_DECISIONS.md) |
| Review process | [docs/REVIEW_PROCESS.md](docs/REVIEW_PROCESS.md) |
| Coverage targets | [docs/COVERAGE_ANALYSIS.md](docs/COVERAGE_ANALYSIS.md) |

Do not edit generated release or coverage output under `dist/` for a normal data contribution.

## Schema Proposals

New fields are possible, but they must be proposed first.

A proposal should explain:

- what the field is,
- who needs it,
- whether it can be sourced legally and consistently,
- whether it is safe to publish,
- how it should be validated,
- whether it is required or optional,
- how existing records will be migrated,
- how release artifacts and the public API should expose it.

## Source Rules

- Use sources that are public, reusable, and license-compatible.
- Record source IDs in changed records.
- Records must reference at least one approved source.
- Do not use Google Maps, commercial map databases, proprietary directories, or scraped websites as data sources.
- Do not treat AI output as a source.
- Do not import OSM-derived data unless the maintainer explicitly approves the ODbL licensing approach.

Source review decisions are documented in [docs/SOURCE_DECISIONS.md](docs/SOURCE_DECISIONS.md).

## Validation

Install dependencies:

```bash
corepack enable pnpm
pnpm install
```

Run:

```bash
pnpm run validate
```

To find focused missing-data opportunities, run:

```bash
pnpm run coverage:data
```

Then review:

```text
dist/coverage/COVERAGE.md
```

Coverage output is generated and should not be committed in normal data pull requests.

## Pull Request Checklist

- The change is within the approved schema.
- Every changed record has source IDs.
- Source licenses allow reuse.
- IDs are stable and unique.
- No personal or sensitive data is added.
- Validation passes.
- The pull request describes the changed files, source IDs, source URLs, and any uncertainty.
