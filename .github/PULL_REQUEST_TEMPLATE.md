## Summary

-

## Change Type

- [ ] Data correction
- [ ] Missing data
- [ ] Source update
- [ ] Translation, alias, or transliteration
- [ ] Schema proposal approved by maintainer

## Source Review

- [ ] Every changed record has source IDs.
- [ ] Sources are listed in `data/sources.json`.
- [ ] Records reference only sources with `status: "approved"`.
- [ ] Source licenses allow reuse.
- [ ] No Google Maps, commercial maps, proprietary directories, or unclear-license sources are used.
- [ ] No AI output is treated as a source.

## File Review

- [ ] I edited only canonical data files unless a maintainer approved other changes.
- [ ] I did not edit generated outputs such as `dist/`, CSV, SQL, YAML, XML, SQLite, or release artifacts.
- [ ] I did not commit raw import files or generated scratch files.
- [ ] I did not introduce new fields or schema changes without approval.

## Validation

- [ ] `pnpm run validate`
