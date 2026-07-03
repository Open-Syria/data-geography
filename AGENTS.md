# AGENTS.md

This file is the repo-root guide for coding agents working on the OpenSyria
administrative geography dataset. Treat it as the agent-facing companion to
`README.md`: read it before changing files, then read the closest nested
`AGENTS.md` if one exists for the paths you touch.

This repository contains the canonical OpenSyria administrative geography datasets.

Work inside this repository only. Keep canonical data under `data`, schemas under `schemas`, imports under `imports`, examples and fixtures in their existing folders, and automation in `scripts`. Do not commit local secrets, generated scratch files, or unrelated artifacts.

Use Node 24+ and pnpm 11+. Before handing off changes, run the smallest relevant command and prefer `pnpm validate` when data, schemas, imports, or release output behavior changed:

- `pnpm check`
- `pnpm validate:schemas`
- `pnpm validate:imports`
- `pnpm validate:data`
- `pnpm validate`

## Documentation Freshness

- Treat this `AGENTS.md` as living agent documentation. When adding, removing, or renaming a repo-local skill under `.agents/skills`, update the `Local Skill Selection` list in this file in the same change.
- When changing dataset scope, repository layout, commands, release artifacts, contributor-facing workflow, or public documentation links, update `README.md`, `contributions/README.md`, and `CHANGELOG.md` when the change is release-visible.
- When changing canonical record shapes in `data/*.json` or schema files in `schemas/*.schema.json`, update `docs/DATA_SCHEMA.md`, `docs/FIELD_REFERENCE.md`, `docs/ID_POLICY.md`, `schemas/README.md`, and validation examples/tests in the same change.
- When adding, removing, or reclassifying sources, source fields, source licenses, source access dates, or source decision rationale, update `data/sources.json`, `docs/SOURCES.md`, `docs/SOURCE_DECISIONS.md`, import manifests, and any affected source references in canonical records.
- When changing import inputs, normalized outputs, source manifests, import retention policy, or importer scripts, update `imports/README.md`, `imports/manifests/README.md`, `docs/IMPORT_WORKFLOW.md`, `docs/PRE_SEED_CHECKLIST.md`, and `docs/SEED_PLAN.md`.
- When data quality, coverage, currency, review status, blockers, or readiness changes, update `docs/DATA_QUALITY.md`, `docs/COVERAGE_ANALYSIS.md`, `docs/DATA_CURRENCY.md`, `docs/REVIEW_PROCESS.md`, and relevant checklist entries.
- When release build output, manifest fields, artifact names/formats, checksums, publication steps, or GitHub release process changes, update `docs/releases.md`, `docs/GENERATED_ARTIFACTS.md`, `docs/RELEASE_CHECKLIST.md`, `schemas/release-manifest.schema.json`, and coordinate any pinned release changes in `datasets-api/dataset-releases.json` and website dataset metadata.

## Local Skill Selection

Repo-local skills live in `.agents/skills/<skill-name>/SKILL.md`. When a task
matches a skill below, read that `SKILL.md` before editing. Prefer the most
specific skill that covers the task, and combine skills only when the work spans
multiple areas.

Data-only edits to canonical JSON usually do not need a local skill unless they
also change validation rules, import behavior, or release automation. Schema and
script changes should use the relevant skill before editing.

Use these local skills as follows:

- `nodejs-backend-patterns`: use when adding or changing Node scripts that behave like backend services, API clients, import pipelines, release publishers, or long-running automation with error handling and external integrations.
- `nodejs-best-practices`: use when making general Node.js architecture decisions, changing async control flow, handling files/processes, improving security, or choosing between implementation patterns in scripts.
- `zod`: use when defining or refactoring schemas, validators, `safeParse` flows, inferred types, or validation error handling for dataset records and fixtures.
