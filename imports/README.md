# Imports

This directory documents maintainer-led source imports.

Raw downloaded files should not be committed here. Keep raw files local under:

```text
imports/raw/
imports/tmp/
```

Those paths are ignored by Git.

## What Should Be Committed

Commit import manifests and notes that explain how data was collected and transformed:

```text
imports/manifests/
```

An import manifest should record:

- source ID,
- source URL,
- license,
- access date,
- downloaded file names or checksums when available,
- imported fields,
- transformation steps,
- maintainer review notes.

## What Should Not Be Committed

Do not commit:

- proprietary source files,
- unclear-license downloads,
- large raw archives,
- generated scratch files,
- AI-generated source material,
- OSM-derived extracts unless a maintainer has approved the ODbL release approach.

Canonical records still live only under:

```text
data/
```

Import manifests explain provenance. They are not canonical data.
