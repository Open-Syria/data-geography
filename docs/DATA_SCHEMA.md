# Data Schema

This repository stores canonical source records under `data/`.

Release artifacts are generated from canonical records and may contain only the fields needed by public API endpoints.

## Common Rules

- IDs must be stable.
- IDs use lowercase kebab-case and start with `sy-`.
- Names may include Arabic and English fields.
- Coordinates use WGS84 latitude and longitude.
- Every source-backed record should include `sourceIds`.
- `sourceStatus` describes the review/release state of the record.

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
| `sourceIds` | array | yes | Source IDs from `data/sources.json` |
| `sourceStatus` | enum | yes | Review/release state |
| `notes` | string | no | Maintainer notes; not necessarily exposed by the API |

Generated API artifact:

```text
dist/release/artifacts/governorates.json
```

The generated artifact currently exposes:

```json
{
  "items": [
    {
      "id": "sy-example",
      "name": {
        "en": "Example",
        "ar": "\u0645\u062b\u0627\u0644"
      },
      "iso31662": null,
      "centroid": null,
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

Their schemas will be finalized after the governorate seed workflow is stable.

Normal contributors should not introduce fields for these datasets before maintainer approval.

