# Data Currency

This document records the freshness status of the canonical geography data. It is an audit aid, not a guarantee that every value is current.

The main rule is simple: use the newest reusable source available at the same geography level. A national 2026 estimate cannot safely replace a governorate, district, subdistrict, or locality value unless the source also publishes that value at the same level.

## Table of Contents

- [Policy](#policy)
- [Current Audit](#current-audit)
- [Population Guidance](#population-guidance)
- [Release Gate](#release-gate)
- [Sources Checked](#sources-checked)

## Policy

- Prefer current, reusable, sourceable data when it exists at the exact record level.
- Store dated measurements instead of overwriting history when multiple years are available.
- Use `population` for the latest accepted measurement for that record.
- Use `populationHistory` for older accepted measurements for the same record.
- Treat old same-level data as acceptable when no newer reusable source is confirmed, but keep the year, source, and method explicit.
- Do not downscale, interpolate, or infer subnational population from national estimates.
- Do not treat AI output as a source for freshness decisions.
- Recheck changing data such as population before each public release.

## Current Audit

Audited on 2026-06-28.

| Area | Current state | Latest checked source status | Assessment | Next action |
| --- | --- | --- | --- | --- |
| Governorate population | 14 of 14 records have latest `population.year` set to 2016, with history for 2004, 2011, 2014, and 2016. | U.S. Census Bureau tables distributed through HDX include ADM1 estimates through 2016. | Acceptable seed. Current enough for an initial source-backed baseline, but not a live estimate. | Watch for newer reusable ADM1 population estimates before first public release. |
| District population | 62 of 62 records have 2004 population. Baniyas and Qadmous use summed ADM3 values to match the current OCHA district split. | U.S. Census Bureau tables distributed through HDX provide ADM2 census values from 2004 in the imported workbook, but the workbook predates the current Qadmous split. | Old, but acceptable because no newer reusable ADM2 source has been confirmed. | Keep clearly dated as historical and search for newer ADM2 data before release. |
| Subdistrict population | 270 of 272 records have 2004 population. | U.S. Census Bureau tables distributed through HDX provide ADM3 census values from 2004 in the imported workbook. Two Quneitra records are omitted because the source value is a missing-data sentinel. | Old, but acceptable because no newer reusable ADM3 source has been confirmed. | Keep clearly dated as historical and search for newer ADM3 data before release. |
| National population | Not modeled in this repository. | U.S. Census Bureau PopClock and International Database provide current country-level estimates. | Useful context, but not a replacement for subnational records. | Do not import into governorates, districts, or subdistricts. Add only if a country-level dataset is modeled. |
| Administrative boundaries, hierarchy, areas, and centroids | Current seed uses geoBoundaries data derived from UN OCHA sources plus the direct HDX/OCHA COD-AB package for the current Baniyas/Qadmous district split. | The direct HDX/OCHA package metadata was modified on 2026-06-24, the XLSX resource was last modified on 2026-01-26, and the package reports 14 governorates, 62 districts, and 272 subdistricts. | Acceptable seed, with direct OCHA alignment for the known Tartus district split. | Complete a full direct HDX/OCHA comparison before first public release. |
| Localities | 7,605 records are seeded from HDX/OCHA populated places and GeoNames point-in-polygon fills for empty Quneitra subdistricts. No locality population is stored. | HDX/OCHA populated places has dataset date 2020-08-16, resource modified in 2022, and metadata modified in 2026. GeoNames rows are dated by the dump snapshot imported on 2026-06-28. | Acceptable seed, but should stay on the freshness watchlist. | Recheck HDX/OCHA and GeoNames for newer populated-place resources before release. |
| Names, aliases, coordinates, and external IDs | Seeded and cross-checked from approved sources such as HDX/OCHA, geoBoundaries, GeoNames, and Wikidata. | GeoNames and Wikidata can change over time and are useful review sources. | Acceptable for seed when source-backed and validated. | Use coverage reports and contributor review to improve missing Arabic names, aliases, coordinates, and external IDs. |

## Population Guidance

Population values change frequently and must be handled conservatively.

Allowed:

- importing dated population measurements from approved reusable sources,
- keeping multiple years in `populationHistory`,
- setting `population` to the latest accepted measurement at the same geography level,
- leaving population as `null` when only unrelated or unreliable values are available.

Not allowed:

- using a national estimate as a governorate, district, subdistrict, or locality estimate,
- generating local population with AI,
- estimating lower-level population by simple proportional distribution,
- importing values from a source that does not allow redistribution.

## Release Gate

Before the first public geography release:

1. Recheck whether a newer reusable ADM1, ADM2, or ADM3 population source exists.
2. Complete the full ADM1, ADM2, and ADM3 comparison against the direct HDX/OCHA administrative-boundary package.
3. Recheck the HDX/OCHA populated-places package for newer locality data.
4. Run:

   ```bash
   pnpm run validate
   pnpm run report:data
   pnpm run coverage:data
   pnpm run compare:hdx-admin
   ```

5. Mention any still-old but source-backed values in release notes.

## Sources Checked

- U.S. Census Bureau PopClock for Syria: https://www.census.gov/popclock/world/sy
- U.S. Census Bureau International Database: https://www.census.gov/programs-surveys/international-programs/about/idb.html
- U.S. Census Bureau International Database API documentation: https://www.census.gov/data/developers/data-sets/international-database.html
- HDX U.S. Census Bureau Syria subnational population tables: https://data.humdata.org/dataset/syria-subnational-boundaries-and-tabular-data
- HDX Syrian Arab Republic populated places: https://data.humdata.org/dataset/syrian-arab-republic-pop-places
- HDX Syrian Arab Republic subnational administrative boundaries: https://data.humdata.org/dataset/cod-ab-syr
- geoBoundaries Syria downloads: https://www.geoboundaries.org/countryDownloads.html
- GeoNames Syria extract: https://download.geonames.org/export/dump/SY.zip
- Wikidata licensing: https://www.wikidata.org/wiki/Wikidata:Licensing
