# Review Process

This document defines how maintainers should review data changes.

## Review Gates

Every pull request should pass these gates before merge.

| Gate | Required Evidence |
| --- | --- |
| Scope | The PR changes an approved dataset and does not alter schema without approval |
| Validation | `pnpm run validate` passes |
| Source | Every changed record has approved source IDs |
| License | Sources allow redistribution and reuse |
| Safety | No personal, private, military, checkpoint, surveillance, or sensitive data |
| Semantics | Names, parent relationships, coordinates, and statuses make sense |
| Size | The PR is focused enough to review |

## Maintainer Review Steps

1. Check the PR type.
2. Confirm changed files are expected for that PR type.
3. Review every new or changed source in `data/sources.json`.
4. Confirm record source IDs point only to approved sources.
5. Check parent relationships.
6. Check ID stability.
7. Check whether any field change is actually a schema proposal.
8. Run validation locally for larger changes.
9. Approve, request changes, or close with a clear reason.

## When to Request Changes

Request changes when:

- a value is unsourced,
- a source exists but the license is unclear,
- a record references a restricted/proposed source,
- unrelated changes are bundled together,
- generated files are edited,
- CSV, SQL, YAML, XML, SQLite, or release artifacts are edited directly,
- aliases duplicate canonical names,
- IDs are unstable or inconsistent,
- a schema change is included without approval.

## When to Close

Close when:

- the change is out of scope,
- the data is sensitive or unsafe,
- the source is proprietary or cannot be redistributed,
- the PR adds OSM-derived data without approved ODbL handling,
- the contributor repeatedly ignores requested changes.

## Schema Proposal Review

Schema proposals should be reviewed separately from data PRs.

Before approval, the maintainer should decide:

- whether the field is safe,
- whether it is useful enough,
- whether it can be sourced consistently,
- whether it is optional or required,
- how validation will work,
- whether existing API users are affected,
- how release artifacts will change.

Only after approval should implementation begin.
