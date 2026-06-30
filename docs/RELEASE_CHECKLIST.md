# Release Checklist

Use this checklist before publishing a versioned `data-geography` release.

Releases are maintainer-controlled. Contributors should not publish release artifacts directly.

Before the first real seed import, use [PRE_SEED_CHECKLIST.md](PRE_SEED_CHECKLIST.md).

## Table of Contents

- [Before Building](#before-building)
- [Validate](#validate)
- [Build](#build)
- [Inspect Artifacts](#inspect-artifacts)
- [Publish](#publish)
- [After Publishing](#after-publishing)
- [Emergency Fixes](#emergency-fixes)

## Before Building

- Confirm every record is within repository scope.
- Confirm every record references at least one approved source.
- Confirm source licenses and attribution requirements still allow release.
- Confirm no restricted source is mixed into default release artifacts.
- Confirm source imports have reviewable manifests when data was imported in batches.
- Confirm no personal, private, military, checkpoint, surveillance, or security-sensitive data is present.
- Confirm IDs are stable and unique.
- Confirm parent relationships are valid.
- Confirm uncertain values are documented in notes or left out.
- Review `pnpm run report:data` output for coverage gaps and duplicates.
- Update `CHANGELOG.md` when the release includes public data changes.

## Validate

Run:

```bash
pnpm run validate
```

This checks:

- formatting,
- canonical data schemas,
- fixture schemas,
- published schema metadata,
- import manifest metadata,
- unique IDs,
- source references,
- parent references,
- generated artifact compatibility,
- non-empty fixture release artifact compatibility.

## Build

For a publishable release, run:

```bash
pnpm run release:prepare -- --version v0.1.0
```

This builds with explicit release metadata, verifies package/version alignment, checks the changelog heading, validates artifact URLs, and rechecks artifact sizes, checksums, and record counts.

For a raw local artifact build, run:

```bash
pnpm run release:build
```

Generated files are written to:

```text
dist/release/
```

Do not manually edit files under `dist/`.

## Inspect Artifacts

Before publishing, inspect:

- `dist/release/release-manifest.json`,
- generated artifact names,
- generated artifact formats,
- record counts,
- SHA-256 checksums,
- file sizes,
- source attribution,
- release status and version,
- generated timestamp.

## Publish

Recommended maintainer flow:

1. Create a release commit.
2. Create a version tag.
3. Push the version tag.
4. Let the `Release` workflow build release artifacts from the tagged commit and attach `release-manifest.json` plus generated artifacts to the GitHub Release.
5. Review the published release notes and add known limitations when needed.
6. Confirm `datasets-api` points at the published dataset tag and can sync the release assets.

## After Publishing

- Confirm release assets are downloadable.
- Confirm checksums match the manifest.
- Confirm `datasets-api` can read the manifest in staging before production use.
- Open follow-up issues for known gaps instead of editing a published release in place.

## Emergency Fixes

If a release contains unsafe or legally incompatible data:

1. Remove or disable the release asset.
2. Document the issue.
3. Publish a corrected release.
4. Keep a clear changelog entry explaining the replacement.
