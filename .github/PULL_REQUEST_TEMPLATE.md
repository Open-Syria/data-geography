## Summary

<!-- What data changed, and why? Keep this focused. -->

## Change Type

- [ ] Data correction
- [ ] Missing data
- [ ] Source update
- [ ] Translation, alias, or transliteration
- [ ] Parent relationship correction
- [ ] Coordinate, area, or population correction
- [ ] Documentation correction
- [ ] Maintainer-approved schema proposal
- [ ] Maintainer-owned tooling, validation, or release work

## Dataset Scope

- [ ] This PR changes only approved geography datasets or maintainer-approved support files.
- [ ] This PR does not introduce a new dataset topic.
- [ ] This PR does not introduce new fields or schema changes without prior maintainer approval.
- [ ] This PR does not change ID policy, validation rules, release scripts, or workflows unless maintainer-approved.

## Source Review

- [ ] Every changed record has at least one `sourceId`.
- [ ] Every referenced source exists in `data/sources.json`.
- [ ] Records reference only sources with `status: "approved"`.
- [ ] New or changed sources include URL, license, access date, and reuse notes where applicable.
- [ ] Source licenses allow redistribution and reuse.
- [ ] No Google Maps, commercial maps, proprietary directories, scraped restricted sites, or unclear-license sources are used.
- [ ] No AI output is treated as a source.
- [ ] OSM-derived data is included only if the maintainer approved the ODbL licensing approach.

## File Review

- [ ] I edited canonical files under `data/` only, unless maintainer-approved.
- [ ] I did not edit generated outputs under `dist/`.
- [ ] I did not edit generated CSV, SQL, YAML, XML, GeoJSON, SQLite, or release artifacts.
- [ ] I did not commit raw imports, temporary files, local reports, coverage outputs, or scratch files.
- [ ] I did not change examples, fixtures, schemas, scripts, or workflows unless maintainer-approved.

## Data Safety

- [ ] No personal data is included.
- [ ] No private addresses, phone numbers, IDs, account data, or student records are included.
- [ ] No security, military, checkpoint, surveillance, or operational-sensitive data is included.
- [ ] No unsourced political claims are included.

## Validation

- [ ] `pnpm run check`
- [ ] `pnpm run validate:data`
- [ ] `pnpm run validate:imports` when source/import manifests changed
- [ ] `pnpm run coverage:data` when adding or improving missing data
- [ ] `pnpm run validate`

## Release Impact

- [ ] Record counts changed
- [ ] Source list changed
- [ ] Generated artifact shape changed
- [ ] API-visible data may change after the next release
- [ ] No release impact beyond data corrections

## Notes for Review

<!-- Add source conflicts, uncertainty, coverage targets, migration notes, or follow-up work. -->
