# Schemas

This directory contains machine-readable JSON Schemas for canonical data files and generated release manifests.

## Canonical Data Schemas

```text
sources.schema.json
governorates.schema.json
districts.schema.json
subdistricts.schema.json
localities.schema.json
```

These schemas are useful for editors, external tooling, and contributors who want early feedback while editing JSON.

## Release Schemas

```text
release-manifest.schema.json
```

The release manifest schema documents the contract consumed by downstream tools such as `datasets-api`.

## Validation

Run:

```bash
pnpm run validate:schemas
pnpm run validate
```

The repository validation scripts remain the authoritative validation path because they also check cross-file rules such as unique IDs, approved source references, duplicate aliases, and parent relationships.
