# Coverage Analysis

Coverage analysis helps maintainers and contributors find the next useful data improvements.

It is not a legal review, source review, or guarantee of real-world completeness. It is a structured report over the current canonical JSON files and the relationships that already exist in the schema.

## Table of Contents

- [Command](#command)
- [What It Checks](#what-it-checks)
- [Contributor Use](#contributor-use)
- [Maintainer Use](#maintainer-use)
- [Interpreting Gaps](#interpreting-gaps)

## Command

Run:

```bash
pnpm run coverage:data
```

The command writes:

```text
dist/coverage/coverage-report.json
dist/coverage/COVERAGE.md
```

These files are generated and should not be edited or committed in normal pull requests.

For fixture data:

```bash
pnpm run coverage:fixtures
```

## What It Checks

The coverage analyzer currently checks:

- record counts for governorates, districts, subdistricts, and localities,
- missing Arabic names,
- missing aliases,
- missing centroids,
- missing area values where the schema supports area,
- missing population values where the schema supports population,
- missing external IDs such as Wikidata, GeoNames, and geoBoundaries,
- missing OCHA P-codes for HDX/OCHA-backed records,
- invalid parent relationships,
- districts without subdistrict records,
- districts without locality records,
- subdistricts without locality records,
- record counts by governorate.

## Contributor Use

Contributors can use `dist/coverage/COVERAGE.md` to pick focused work.

Good contribution targets:

- add missing records inside the approved dataset scope,
- add missing Arabic names or aliases,
- add coordinates from reusable sources,
- add missing external IDs from approved public references,
- improve population or area values only when the schema supports them and the source is reusable,
- connect records to the correct parent district, subdistrict, or governorate.

Avoid using coverage output as permission to add new fields. New fields still require maintainer approval through a schema proposal.

## Maintainer Use

Maintainers can use the report before opening a data slice for contribution:

1. Run `pnpm run coverage:data`.
2. Review `dist/coverage/COVERAGE.md`.
3. Decide which gaps are safe for public contribution.
4. Open focused issues such as "Add missing Wikidata IDs for districts" or "Seed subdistricts for Aleppo Governorate".
5. Keep generated coverage output out of normal commits.

## Interpreting Gaps

A missing value does not always mean a contributor should add it immediately.

Examples:

- Missing population values require dated and reusable statistical sources.
- Missing coordinates require a source that can be redistributed.
- Missing source-specific IDs are checked against records where that source is already used or already has an ID. For example, an admin record sourced only from direct HDX/OCHA COD-AB is not treated as missing a geoBoundaries ID unless it is also tied to `geoboundaries-syr`, and a GeoNames-only locality is not treated as missing an OCHA P-code.
- Missing locality aliases are reported only when the canonical name suggests a shorter source-backed alias, such as a parenthetical English qualifier or Arabic text split by ` - `. Empty aliases are acceptable when no alternate name is known.
- Missing locality Wikidata IDs are source-aware. They are tracked when a record already cites Wikidata or already has a Wikidata ID, because many villages and localities may not have reliable Wikidata items.
- Missing localities may require deciding whether the record should be a city, town, village, or generic locality.
- Missing parent relationships should be fixed only when the relationship is supported by a source.

When in doubt, open a focused issue before starting a large edit.
