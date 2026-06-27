# Data Schema

This repository stores canonical source records under `data/`.

Release artifacts are generated from canonical records and may contain only the fields needed by public API endpoints.

Generated artifact rules live in [GENERATED_ARTIFACTS.md](GENERATED_ARTIFACTS.md).

Machine-readable JSON Schemas live in [../schemas](../schemas).

Example records live under `examples/`. Test-only fixture records live under `fixtures/valid-data/` and are validated by `pnpm run validate:fixtures`.

## Common Rules

- IDs must be stable.
- IDs use lowercase kebab-case and start with `sy-`.
- ID rules live in [ID_POLICY.md](ID_POLICY.md).
- Names may include Arabic and English fields.
- Coordinates use WGS84 latitude and longitude.
- Every source-backed record should include `sourceIds`.
- `sourceStatus` describes the review/release state of the record.
- Unknown fields are rejected. New fields require a maintainer-approved schema proposal first.
- Contributors should also read [FIELD_REFERENCE.md](FIELD_REFERENCE.md) before editing records.

## Source Status

```text
pending_release
seed
released
deprecated
```

- `pending_release`: prepared but not yet part of a public release.
- `seed`: initial maintainer-seeded data.
- `released`: reviewed and published in a versioned release.
- `deprecated`: retained for compatibility but no longer current.

## Governorates

Canonical file:

```text
data/governorates.json
```

Fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Stable OpenSyria ID, for example `sy-damascus` |
| `name.en` | string | yes | English display name |
| `name.ar` | string | no | Arabic display name |
| `aliases` | array | no | Alternate names, spellings, or transliterations |
| `iso31662` | string or null | yes | ISO 3166-2 subdivision code when confidently sourced |
| `centroid.latitude` | number | no | WGS84 latitude |
| `centroid.longitude` | number | no | WGS84 longitude |
| `externalIds.wikidata` | string | no | Wikidata QID |
| `externalIds.geonames` | string | no | GeoNames ID |
| `externalIds.geoboundaries` | string | no | geoBoundaries ID or reference |
| `sourceIds` | array | yes | At least one approved source ID from `data/sources.json` |
| `sourceStatus` | enum | yes | Review/release state |
| `notes` | string | no | Maintainer notes; not necessarily exposed by the API |

Generated release artifacts:

```text
dist/release/artifacts/governorates.json
dist/release/artifacts/governorates.ndjson
dist/release/artifacts/governorates.csv
dist/release/artifacts/governorates.sql
dist/release/artifacts/governorates.yaml
dist/release/artifacts/governorates.xml
```

The generated JSON artifact exposes public records and omits maintainer-only `notes`.

```json
{
  "items": [
    {
      "id": "sy-example-governorate",
      "name": {
        "en": "Example Governorate",
        "ar": "\u0645\u062d\u0627\u0641\u0638\u0629 \u0645\u062b\u0627\u0644"
      },
      "aliases": [],
      "iso31662": null,
      "centroid": null,
      "externalIds": {},
      "sourceIds": ["approved-source-id"],
      "sourceStatus": "seed"
    }
  ]
}
```

## Districts, Subdistricts, and Localities

The repository includes empty placeholder files for:

```text
data/districts.json
data/subdistricts.json
data/localities.json
```

Validation schemas already exist for these files, including parent relationship checks.

Generated artifacts already exist for all four canonical files so the release pipeline can be tested before real data is added.

Normal contributors should not introduce fields for these datasets before maintainer approval.
