# Contributing

Thanks for helping improve OpenSyria geography data.

This repository accepts controlled data contributions. The maintainer owns the dataset scope, schemas, release pipeline, validation rules, and source acceptance policy.

Start with the full contributor guide:

```text
contributions/README.md
```

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

## Validation

Run:

```bash
pnpm run validate
```

## Pull Request Checklist

- The change is within the approved schema.
- Every changed record has source IDs.
- Source licenses allow reuse.
- IDs are stable and unique.
- No personal or sensitive data is added.
- Validation passes.
