# Changelog

## Unreleased

## v0.1.3 - 2026-06-28

- Add 225 Arabic article-insensitive one-to-one GeoNames locality matches within 2 km.
- Improve the reusable GeoNames locality matcher with Arabic article-insensitive variants.
- Add a reviewed import manifest for the Arabic article-insensitive GeoNames locality match pass.
- Improve locality GeoNames ID coverage from 4,049 to 4,274 records.

## v0.1.2 - 2026-06-28

- Add 281 widened-radius one-to-one GeoNames locality matches using exact normalized names and same-governorate checks.
- Add a reusable GeoNames locality matching script with dry-run and apply modes.
- Add a reviewed import manifest for the widened-radius GeoNames locality match pass.
- Improve locality GeoNames ID coverage from 3,768 to 4,049 records.

## v0.1.1 - 2026-06-28

- Add 15 close one-to-one GeoNames locality matches from a conservative final review pass.
- Add a reviewed import manifest for the close GeoNames locality match pass.
- Improve coverage analysis so documented source gaps remain visible but are excluded from actionable contribution focus.
- Document known source-backed gaps separately from unresolved GeoNames locality ID work.

## v0.1.0 - 2026-06-28

- Add initial repository structure.
- Add validation and release artifact generation scripts.
- Add release preparation guardrails for versioned public artifacts.
- Add controlled dataset contribution policy.
- Add generated JSON, NDJSON, CSV, SQL, YAML, and XML release artifacts.
- Add fixture validation and non-empty fixture release builds.
- Add machine-readable schemas for canonical data, release manifests, and import manifests.
- Add maintainer data quality reports.
- Add source import workflow documentation.
- Add canonical seed data for 14 governorates, 62 districts, 272 subdistricts, and 7,605 localities.
- Add source-backed administrative hierarchy, OCHA P-codes, centroids, areas, population history, and external identifiers where approved sources support them.
- Document known source gaps: 2 Quneitra subdistrict population values remain null because the USCB workbook uses missing-data sentinels, 6 Quneitra locality Arabic names remain unset because the GeoNames point-fill rows have no Arabic alternate names, and locality GeoNames ID coverage remains partial.
