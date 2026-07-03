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
