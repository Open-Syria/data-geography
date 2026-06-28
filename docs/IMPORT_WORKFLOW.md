# Import Workflow

This workflow is for maintainer-led seed imports.

Normal contributors should not run large imports or add new source-derived batches without maintainer approval.

## Table of Contents

- [1. Review the Source](#1-review-the-source)
- [2. Keep Raw Files Local](#2-keep-raw-files-local)
- [3. Create an Import Manifest](#3-create-an-import-manifest)
- [4. Transform Into Canonical JSON](#4-transform-into-canonical-json)
- [5. Validate and Report](#5-validate-and-report)
- [6. Review Before Release](#6-review-before-release)

## 1. Review the Source

Before importing records:

- add or review the source in `data/sources.json`,
- confirm the source license allows reuse and redistribution,
- confirm the imported fields are allowed by the source license,
- document the decision in [SOURCE_DECISIONS.md](SOURCE_DECISIONS.md),
- keep restricted sources out of default release records.

Only sources with `status: "approved"` may be referenced by canonical records.

## 2. Keep Raw Files Local

Download source files locally under:

```text
imports/raw/
imports/tmp/
```

These directories are ignored by Git.

Do not commit raw files unless the maintainer has explicitly decided that the files are small, legally reusable, and useful to keep in the repository.

## 3. Create an Import Manifest

Copy:

```text
imports/manifests/source-import.template.json
```

Save it as:

```text
imports/manifests/{source-id}-{yyyy-mm-dd}.json
```

The manifest should record:

- source identity,
- source URL,
- license,
- access date,
- raw file names and checksums when practical,
- imported fields,
- target canonical files,
- transformation steps,
- review notes.

Validate manifests with:

```bash
pnpm run validate:imports
```

## 4. Transform Into Canonical JSON

Canonical data belongs only in:

```text
data/governorates.json
data/districts.json
data/subdistricts.json
data/localities.json
data/sources.json
```

The import process may use scripts, spreadsheets, or manual review, but committed records must follow the canonical schema.

AI may assist with matching, cleanup, transliteration suggestions, or review notes. AI output is not a source and must not be cited as one.

## 5. Validate and Report

Run:

```bash
pnpm run validate
pnpm run report:data
```

Validation must pass before merge.

The report should be reviewed for:

- unexpected duplicate names,
- missing Arabic names,
- missing external IDs,
- low coordinate coverage,
- source usage concentration,
- records stuck in `pending_release`.

## 6. Review Before Release

Before a public release:

- inspect the import manifest,
- inspect changed canonical records,
- inspect generated release artifacts,
- confirm source attribution in `release-manifest.json`,
- update release notes with known gaps.

Use [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for final release preparation.
