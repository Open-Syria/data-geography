# Source Decisions

This document records how sources are treated by this repository.

The source registry in `data/sources.json` is the machine-readable source of truth. This document explains maintainer intent and review decisions.

This is not legal advice. Before a large import or public release, the maintainer should re-check source terms, attribution requirements, and access dates.

## Decision States

| Status | Meaning |
| --- | --- |
| `approved` | Records may reference this source. |
| `restricted` | Useful for review, but not allowed in default records until a licensing strategy is approved. |
| `proposed` | Under review. Records may not reference it yet. |
| `rejected` | Do not use for imports or record references. |

## Current Registry Decisions

| Source ID | Registry status | Intended use | Release rule |
| --- | --- | --- | --- |
| `geoboundaries-syr` | `approved` | Administrative boundary and geography cross-checking. | May be used when attribution and imported fields are recorded. |
| `geonames-sy` | `approved` | Place-name and feature cross-checking. | May be used when attribution and imported fields are recorded. |
| `wikidata` | `approved` | Public identifiers, aliases, multilingual names, and cross-checking. | May be used when imported fields are traceable. |
| `openstreetmap` | `restricted` | Review, matching, and potential future ODbL-compatible exports. | Do not use in default records unless the maintainer approves the ODbL approach. |

## Approving a Source

A source can become `approved` only when the maintainer confirms:

- the source is public,
- the source license allows reuse and redistribution,
- required attribution can be preserved,
- imported fields are compatible with the planned release license,
- the source does not introduce personal, private, security-sensitive, or prohibited data,
- the import can be reproduced or reviewed.

## Restricted Sources

A restricted source may be useful for human review, but records must not cite it as an approved source.

Common reasons for restriction:

- share-alike requirements that affect the release license,
- no clear redistribution permission,
- no clear attribution path,
- terms that prohibit automated extraction,
- commercial or proprietary origin,
- operational sensitivity.

## Rejected Sources

Rejected sources should not be used for:

- imports,
- corrections,
- coordinates,
- aliases,
- IDs,
- source confirmation.

Examples of rejected source categories:

- Google Maps,
- commercial map databases,
- proprietary directories,
- unclear-license scraped websites,
- AI output as a factual source.

## Source Notes in Pull Requests

Pull requests that add or change source-backed records should explain:

- which source IDs were used,
- which fields came from each source,
- whether any sources disagree,
- why the selected value is preferred,
- whether uncertainty remains.

For large imports, create a maintainer-approved source/import plan before adding records.
