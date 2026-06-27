# ID Policy

OpenSyria IDs are stable public identifiers. They should be treated as API-facing contracts, not as display labels.

## Format

All geography record IDs must:

- start with `sy-`,
- use lowercase ASCII letters, numbers, and hyphens,
- avoid spaces, underscores, apostrophes, accents, and punctuation,
- remain stable when names, translations, aliases, coordinates, or sources improve.

Valid examples:

```text
sy-example-governorate
sy-example-governorate-example-district
sy-example-governorate-example-locality
```

## ID Design

Use the shortest stable ID that is still unambiguous.

Recommended patterns:

| Record type | Pattern |
| --- | --- |
| Governorate | `sy-{governorate}` |
| District | `sy-{governorate}-{district}` |
| Subdistrict | `sy-{governorate}-{district}-{subdistrict}` |
| Locality | `sy-{governorate}-{locality}` or `sy-{governorate}-{district}-{locality}` when needed for disambiguation |

These are conventions, not automatic transliteration rules. The maintainer may choose a clearer ID when names are duplicated, disputed, or likely to change.

## What IDs Are Not

OpenSyria IDs are not:

- English names,
- Arabic names,
- transliterations,
- ISO codes,
- Wikidata IDs,
- GeoNames IDs,
- OpenStreetMap IDs,
- database row numbers.

External identifiers belong in `externalIds`.

## Renames

Do not rename an existing ID in a normal data PR.

An ID change requires maintainer approval and a migration note because it can break:

- release artifacts,
- API clients,
- downstream datasets,
- cross-repository references.

When a real-world place is renamed, the stable OpenSyria ID usually stays the same. The new name should be added to `name`, and previous names can move to `aliases` when appropriate.

## Deletions and Deprecation

Do not reuse an old ID for a different record.

If a record becomes obsolete, merged, or replaced, keep the ID available until the schema supports explicit deprecation metadata for that record type. Use `sourceStatus: "deprecated"` only when the maintainer approves the release behavior.

## New Records

Before adding a new ID, check:

1. The record is within the approved dataset scope.
2. No existing record already represents the same place.
3. Parent records already exist or are added in the same PR.
4. The ID follows the conventions above.
5. The record references at least one approved source.

## Examples and Fixtures

Files under `examples/` and `fixtures/` use fake IDs that are intentionally not real Syrian records.

Do not copy example IDs into canonical data.
