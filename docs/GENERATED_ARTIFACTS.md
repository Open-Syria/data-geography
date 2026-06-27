# Generated Artifacts

Canonical data lives in JSON files under `data/`.

Generated artifacts are built from those canonical JSON files and must not be edited by contributors.

## Source of Truth

```text
data/governorates.json
data/districts.json
data/subdistricts.json
data/localities.json
data/sources.json
```

These files are the only source of truth for records.

## Generated Output

Generated files are written under:

```text
dist/release/
```

Current generated files:

```text
dist/release/release-manifest.json
dist/release/artifacts/governorates.json
```

Planned generated formats:

```text
governorates.json
governorates.ndjson
governorates.csv
governorates.sql
governorates.yaml
governorates.xml
governorates.sqlite
```

The order of implementation should be:

1. JSON
2. NDJSON
3. CSV
4. SQL
5. YAML
6. XML
7. SQLite

JSON remains the canonical input format even after other generated formats exist.

## Contributor Rule

Contributors should never edit generated files.

If a generated file is wrong, fix the canonical JSON source or the generator script. Generator script changes require maintainer approval.

Generated files should not be included in normal data pull requests unless the maintainer explicitly asks for a release preparation branch.

## Release Manifest

Every generated release must include:

```text
release-manifest.json
```

The manifest records:

- dataset metadata,
- release version,
- artifact paths,
- artifact formats,
- file sizes,
- SHA-256 checksums,
- record counts,
- source attribution.

`datasets-api` consumes the release manifest and verified artifacts. It should not read live branches.

Use [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) before publishing generated artifacts.
