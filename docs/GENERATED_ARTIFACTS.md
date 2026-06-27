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
dist/release/artifacts/{governorates,districts,subdistricts,localities}.{json,ndjson,csv,sql,yaml,xml}
```

Implemented generated formats:

```text
governorates.json
governorates.ndjson
governorates.csv
governorates.sql
governorates.yaml
governorates.xml
```

The same formats are generated for:

```text
governorates
districts
subdistricts
localities
```

Planned later:

```text
*.geojson
*.sqlite
```

GeoJSON should wait until geometry and boundary-source licensing are settled. SQLite should wait until the project intentionally adds and maintains a database generation dependency.

JSON remains the canonical input format even after generated formats exist.

## Format Notes

| Format | Purpose |
| --- | --- |
| JSON | Primary structured release artifact for API ingestion and general use. |
| NDJSON | Streaming-friendly one-record-per-line artifact. |
| CSV | Spreadsheet-friendly flat artifact with nested values encoded as JSON strings. |
| SQL | Portable SQL import file with one table per dataset artifact. |
| YAML | Human-readable structured artifact for docs and review. |
| XML | Structured artifact for consumers that need XML exchange. |

Generated JSON, NDJSON, YAML, and XML preserve nested record shape. CSV and SQL use flattened columns.

## Fixture Release Build

The validation workflow builds both:

```text
dist/release/
dist/fixture-release/
```

`dist/release/` is generated from canonical data.

`dist/fixture-release/` is generated from fake fixture data and exists only to test non-empty release artifacts.

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
