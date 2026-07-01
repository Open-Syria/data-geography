# Agent Notes

This repository contains the canonical OpenSyria administrative geography datasets.

Work inside this repository only. Keep canonical data under `data`, schemas under `schemas`, imports under `imports`, examples and fixtures in their existing folders, and automation in `scripts`. Do not commit local secrets, generated scratch files, or unrelated artifacts.

Use Node 24+ and pnpm 11+. Before handing off changes, run the smallest relevant command and prefer `pnpm validate` when data, schemas, imports, or release output behavior changed:

- `pnpm check`
- `pnpm validate:schemas`
- `pnpm validate:imports`
- `pnpm validate:data`
- `pnpm validate`

## Local Skills

Read the matching `SKILL.md` before using a local skill.

- `nodejs-backend-patterns`: use when adding or changing Node scripts that behave like backend services, API clients, import pipelines, release publishers, or long-running automation with error handling and external integrations.
- `nodejs-best-practices`: use when making general Node.js architecture decisions, changing async control flow, handling files/processes, improving security, or choosing between implementation patterns in scripts.
- `zod`: use when defining or refactoring schemas, validators, `safeParse` flows, inferred types, or validation error handling for dataset records and fixtures.
