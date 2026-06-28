# Sources

OpenSyria Data Geography should only use sources that are legally reusable, documented, and practical to review.

## Table of Contents

- [Source Registry](#source-registry)
- [Initial Source Policy](#initial-source-policy)
- [Rejected or Restricted Sources](#rejected-or-restricted-sources)
- [OpenStreetMap Note](#openstreetmap-note)
- [Source Links](#source-links)

## Source Registry

Source metadata is stored in:

```text
data/sources.json
```

Records reference sources through `sourceIds`.

Maintainer source decisions are tracked in [SOURCE_DECISIONS.md](SOURCE_DECISIONS.md).

Maintainer import steps are documented in [IMPORT_WORKFLOW.md](IMPORT_WORKFLOW.md).

Data freshness decisions are tracked in [DATA_CURRENCY.md](DATA_CURRENCY.md).

## Initial Source Policy

Preferred sources for the first geography seed:

| Source | License | Status | Use |
| --- | --- | --- | --- |
| geoBoundaries | CC BY 4.0 | approved | Administrative boundaries and administrative hierarchy cross-checking |
| GeoNames | CC BY 4.0 | approved | Place names, feature IDs, alternate names, and coordinates cross-checking |
| Wikidata | CC0 | approved | Public identifiers, multilingual names, and cross-checking |
| HDX/OCHA administrative boundaries | CC BY 3.0 IGO | approved | Current COD-AB hierarchy, P-codes, centroids, and area values |
| HDX/OCHA populated places | CC BY 3.0 IGO | approved | Locality names, coordinates, administrative relationships, and P-codes |
| U.S. Census Bureau via HDX | CC BY | approved | Dated ADM1, ADM2, and ADM3 population measurements |
| OpenStreetMap | ODbL | restricted | Review and comparison only unless ODbL handling is explicitly approved |

## Rejected or Restricted Sources

Do not import data from:

- Google Maps,
- commercial map databases,
- proprietary directories,
- sources marked non-commercial only,
- sources that prohibit redistribution,
- unclear-license sources,
- sources that require permission before redistribution,
- AI output.

Avoid boundary sources such as GADM unless explicit redistribution permission is obtained.

## OpenStreetMap Note

OpenStreetMap is valuable, but OSM data is licensed under ODbL. ODbL has share-alike obligations for derived databases.

For the default seed workflow, OSM may be used for manual review and comparison, but OSM-derived values should not be imported into canonical data unless the maintainer approves the ODbL-compatible release approach.

## Source Links

- geoBoundaries: https://www.geoboundaries.org/
- GeoNames downloads: https://download.geonames.org/export/dump/
- Wikidata licensing: https://www.wikidata.org/wiki/Wikidata:Licensing
- HDX Syria administrative boundaries: https://data.humdata.org/dataset/cod-ab-syr
- HDX Syria populated places: https://data.humdata.org/dataset/syrian-arab-republic-pop-places
- U.S. Census Bureau Syria subnational population tables: https://data.humdata.org/dataset/syria-subnational-boundaries-and-tabular-data
- OpenStreetMap copyright: https://www.openstreetmap.org/copyright
- Open Data Commons ODbL: https://opendatacommons.org/licenses/odbl/1-0/
