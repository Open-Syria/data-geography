# Field Reference

This document gives contributor-facing rules for common fields.

## Table of Contents

- [`id`](#id)
- [`name`](#name)
- [`aliases`](#aliases)
- [`iso31662`](#iso31662)
- [`centroid`](#centroid)
- [`area`](#area)
- [`population` and `populationHistory`](#population-and-populationhistory)
- [`externalIds`](#externalids)
- [`sourceIds`](#sourceids)
- [`sourceStatus`](#sourcestatus)
- [`notes`](#notes)

## `id`

Stable OpenSyria identifier.

Rules:

- required,
- unique within its file,
- starts with `sy-`,
- lowercase kebab-case,
- never changes because a display name changes.

Example:

```json
"id": "sy-damascus"
```

## `name`

Canonical display names.

Rules:

- `name.en` is required,
- `name.ar` is strongly preferred when known,
- names should not include extra descriptors unless part of the official/common name.

Example:

```json
"name": {
  "en": "Damascus",
  "ar": "\u062f\u0645\u0634\u0642"
}
```

## `aliases`

Alternate names, formal names, spellings, historical names, or transliterations.

Rules:

- always use an array,
- use an empty array when there are no aliases,
- do not duplicate `name.en` or `name.ar`,
- avoid duplicate aliases within the same record.
- use `type: "formal"` for administrative names such as `Damascus Governorate` or `محافظة دمشق`.

Example:

```json
"aliases": [
  {
    "value": "Dimashq",
    "language": "en",
    "type": "transliteration"
  }
]
```

## `iso31662`

ISO 3166-2 subdivision code.

Rules:

- governorates only for now,
- use `null` when not confidently sourced,
- format must be `SY-XX`.

Example:

```json
"iso31662": "SY-DI"
```

## `centroid`

Approximate representative point for a geography record.

Rules:

- use WGS84 latitude and longitude,
- use `null` when unknown or unsourced,
- prefer coordinates from approved reusable geospatial or gazetteer sources,
- do not infer from a visual map without a reusable source,
- do not use Google Maps or proprietary map coordinates.

Example:

```json
"centroid": {
  "latitude": 33.5138,
  "longitude": 36.2765
}
```

## `area`

Area measurement.

Rules:

- use `null` when unknown or unsourced,
- store square-kilometre values with `unit: "km2"`,
- include approved source IDs inside `area.sourceIds`,
- do not mix area values from multiple sources without a review note.

Example:

```json
"area": {
  "value": 18032,
  "unit": "km2",
  "sourceIds": ["wikidata"]
}
```

## `population` and `populationHistory`

Dated population measurements.

`population` is the latest preferred measurement available for that exact record and geography level. `populationHistory` keeps the dated measurements used to choose that value.

Rules:

- use `null` when unknown or unsourced,
- include the measurement year,
- include `date` when the source gives a more precise date,
- include approved source IDs inside `population.sourceIds`,
- include approved source IDs inside every `populationHistory[].sourceIds`,
- do not add undated population values,
- do not treat population values as current unless the source explicitly says they are current,
- do not use a national estimate for a governorate, district, subdistrict, or locality record,
- keep `population` equal to the newest entry in `populationHistory` when history is present.

Example:

```json
"population": {
  "value": 2957000,
  "year": 2016,
  "sourceIds": ["uscb-syria-population"]
},
"populationHistory": [
  {
    "value": 2836000,
    "year": 2011,
    "date": "2011-12-01",
    "sourceIds": ["uscb-syria-population"]
  },
  {
    "value": 2957000,
    "year": 2016,
    "sourceIds": ["uscb-syria-population"]
  }
]
```

## `externalIds`

Identifiers in reusable external datasets.

Rules:

- always use an object,
- use an empty object when there are no external IDs,
- supported keys are `wikidata`, `geonames`, `geoboundaries`, and `ochaPcode`.

Example:

```json
"externalIds": {
  "wikidata": "Q3766",
  "geonames": "170654",
  "ochaPcode": "C1001"
}
```

## `sourceIds`

References to `data/sources.json`.

Rules:

- required,
- must contain at least one source ID,
- every ID must exist in `data/sources.json`,
- records may reference only sources with `status: "approved"`.

Example:

```json
"sourceIds": ["wikidata", "geonames-sy"]
```

## `sourceStatus`

Record review/release state.

Allowed values:

```text
pending_release
seed
released
deprecated
```

Use:

- `pending_release` for prepared records not yet released,
- `seed` for maintainer-seeded records,
- `released` after a reviewed public release,
- `deprecated` when a record is retained for compatibility but no longer current.

## `notes`

Maintainer notes.

Rules:

- optional,
- not intended as a public long description,
- should explain uncertainty, source conflicts, or review decisions.
