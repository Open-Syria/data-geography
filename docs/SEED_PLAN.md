# Seed Plan

This document describes the maintainer-led plan for creating the first usable geography release.

The goal is to publish a small, verified, legally reusable foundation before opening broader data corrections.

## Principles

- Seed from reusable sources only.
- Keep source attribution visible.
- Add data in administrative order.
- Prefer fewer reviewed records over many uncertain records.
- Keep generated artifacts reproducible from canonical JSON.
- Use AI only for assistance, never as a source.

## Seed Order

### 1. Source Registry

Prepare `data/sources.json` before importing records.

For each source, record:

- source ID,
- title,
- URL,
- license,
- license URL when available,
- allowed fields,
- maintainer notes,
- project status.

Only sources with `status: "approved"` may be referenced by records.

### 2. Governorates

Seed governorates first because every lower administrative record depends on them.

Review gates:

- stable OpenSyria ID,
- English name,
- Arabic name when available,
- ISO 3166-2 code when confidently sourced,
- source IDs,
- optional external IDs,
- optional centroid.

### 3. Districts

Seed districts after governorates.

Review gates:

- stable ID,
- valid `governorateId`,
- source IDs,
- duplicate name review within and across governorates,
- optional centroid and external IDs.

### 4. Subdistricts

Seed subdistricts after districts.

Review gates:

- stable ID,
- valid `districtId`,
- valid `governorateId`,
- source IDs,
- parent consistency.

### 5. Localities

Seed cities, towns, villages, and other localities after the administrative parent structure is stable.

Review gates:

- stable ID,
- `kind` value,
- valid parent references where known,
- source IDs,
- duplicate and alias review,
- coordinate review when present.

### 6. Cross-Checks

After each stage:

- run validation,
- run the data quality report,
- compare duplicate names,
- check missing parent relationships,
- check source coverage,
- check release artifact shape,
- document unresolved uncertainty.

### 7. First Release

The first public release should contain:

- `release-manifest.json`,
- generated JSON, NDJSON, CSV, SQL, YAML, and XML artifacts,
- clear source attribution,
- a changelog entry,
- known limitations.

GeoJSON and SQLite should be generated later after geometry licensing and database-generation decisions are stable.

## Automation

Automation may help with:

- downloading allowed source files,
- parsing public datasets,
- matching duplicate names,
- transliteration suggestions,
- source comparison,
- formatting,
- validation.

Automation must not:

- import from unclear-license sources,
- use AI-generated facts as records,
- bypass source review,
- bypass maintainer review for large imports,
- mix ODbL-derived data into a release without an approved licensing strategy.

## Initial Non-Goals

The seed phase will not include:

- live map tiles,
- private addresses,
- personal information,
- military, checkpoint, surveillance, or security-related records,
- disputed claims that cannot be represented with clear source notes,
- user-submitted new dataset topics.
