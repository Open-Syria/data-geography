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
| `aliases` | array | no | Alternate names, formal names, spellings, or transliterations |
| `iso31662` | string or null | yes | ISO 3166-2 subdivision code when confidently sourced |
| `centroid.latitude` | number | no | WGS84 latitude |
| `centroid.longitude` | number | no | WGS84 longitude |
| `area.value` | number | no | Area measurement |
| `area.unit` | string | no | Currently `km2` |
| `area.sourceIds` | array | no | Approved source IDs for the area value |
| `population.value` | integer | no | Population measurement |
| `population.year` | integer | no | Measurement year |
| `population.sourceIds` | array | no | Approved source IDs for the population value |
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
        "en": "Example",
        "ar": "\u0645\u062b\u0627\u0644"
      },
      "aliases": [
        {
          "value": "Example Governorate",
          "language": "en",
          "type": "formal"
        }
      ],
      "iso31662": null,
      "centroid": null,
      "area": null,
      "population": null,
      "externalIds": {},
      "sourceIds": ["approved-source-id"],
      "sourceStatus": "seed"
    }
  ]
}
```

## Districts

Canonical file:

```text
data/districts.json
```

Fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Stable OpenSyria ID, for example `sy-aleppo-afrin` |
| `governorateId` | string | yes | Parent governorate ID from `data/governorates.json` |
| `name.en` | string | yes | English display name |
| `name.ar` | string | no | Arabic display name |
| `aliases` | array | no | Alternate names, formal names, spellings, or transliterations |
| `centroid.latitude` | number | no | WGS84 latitude |
| `centroid.longitude` | number | no | WGS84 longitude |
| `area.value` | number | no | Area measurement |
| `area.unit` | string | no | Currently `km2` |
| `area.sourceIds` | array | no | Approved source IDs for the area value |
| `population` | object or null | yes | Reserved for dated sourced population measurements; currently `null` in the district seed |
| `externalIds.wikidata` | string | no | Wikidata QID |
| `externalIds.geonames` | string | no | GeoNames ID |
| `externalIds.geoboundaries` | string | no | geoBoundaries shape ID |
| `sourceIds` | array | yes | At least one approved source ID from `data/sources.json` |
| `sourceStatus` | enum | yes | Review/release state |
| `notes` | string | no | Maintainer notes; not necessarily exposed by the API |

Generated release artifacts:

```text
dist/release/artifacts/districts.json
dist/release/artifacts/districts.ndjson
dist/release/artifacts/districts.csv
dist/release/artifacts/districts.sql
dist/release/artifacts/districts.yaml
dist/release/artifacts/districts.xml
```

## Subdistricts

Canonical file:

```text
data/subdistricts.json
```

Fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Stable OpenSyria ID, for example `sy-damascus-damascus-damascus` |
| `governorateId` | string | yes | Parent governorate ID from `data/governorates.json` |
| `districtId` | string | yes | Parent district ID from `data/districts.json` |
| `name.en` | string | yes | English display name, seeded from current ADM3 boundary names |
| `name.ar` | string | no | Arabic display name when a reusable source provides a confident value |
| `aliases` | array | no | Alternate names, formal names, spellings, historical names, or transliterations |
| `centroid.latitude` | number | no | WGS84 latitude |
| `centroid.longitude` | number | no | WGS84 longitude |
| `area.value` | number | no | Area measurement |
| `area.unit` | string | no | Currently `km2` |
| `area.sourceIds` | array | no | Approved source IDs for the area value |
| `population` | object or null | yes | Reserved for dated sourced population measurements; currently `null` in the subdistrict seed |
| `externalIds.wikidata` | string | no | Wikidata QID |
| `externalIds.geonames` | string | no | GeoNames ID |
| `externalIds.geoboundaries` | string | no | geoBoundaries shape ID |
| `sourceIds` | array | yes | At least one approved source ID from `data/sources.json` |
| `sourceStatus` | enum | yes | Review/release state |
| `notes` | string | no | Maintainer notes; not necessarily exposed by the API |

Generated release artifacts:

```text
dist/release/artifacts/subdistricts.json
dist/release/artifacts/subdistricts.ndjson
dist/release/artifacts/subdistricts.csv
dist/release/artifacts/subdistricts.sql
dist/release/artifacts/subdistricts.yaml
dist/release/artifacts/subdistricts.xml
```

Seed notes:

- Subdistrict records use geoBoundaries ADM3 features as the current structural source.
- Parent `districtId` relationships are derived by matching ADM3 geometry to ADM2 geometry.
- Area values are derived from reusable ADM3 geometry and rounded to three decimal places.
- GeoNames and Wikidata enrich records with Arabic names, aliases, centroids, and external IDs where they match current ADM3 shapes.
- Population is intentionally `null` until dated, reusable subdistrict-level population sources are reviewed.
- Records with missing `name.ar`, GeoNames IDs, or Wikidata IDs are valid seed records and should be improved through focused source-backed contributions.

## Localities

Canonical file:

```text
data/localities.json
```

The repository still includes an empty placeholder for localities.

Validation schemas already exist for this file, including parent relationship checks.

Generated artifacts already exist for all canonical files so the release pipeline can be tested before real locality data is added.

Normal contributors should not introduce new fields for this dataset before maintainer approval.
