# Security Policy

Please do not report security vulnerabilities or sensitive data exposure through public GitHub issues.

## Table of Contents

- [Reporting a Vulnerability](#reporting-a-vulnerability)
- [What to Include](#what-to-include)
- [Scope](#scope)
- [Dataset Safety Reports](#dataset-safety-reports)
- [Public Disclosure](#public-disclosure)

## Reporting a Vulnerability

Use GitHub private vulnerability reporting when it is available for this repository:

```text
https://github.com/Open-Syria/data-geography/security/advisories/new
```

If private vulnerability reporting is not available, contact the project maintainers privately through the OpenSyria organization.

## What to Include

Include enough detail for maintainers to reproduce and assess the issue:

- affected file, script, workflow, dependency, or dataset record,
- impact and likely severity,
- reproduction steps,
- relevant non-sensitive logs,
- affected version, branch, or commit,
- whether the issue is already public.

Do not include secrets, private tokens, private infrastructure URLs, personal data, restricted data, or sensitive operational details in the report.

## Scope

Security reports can include:

- dependency vulnerabilities,
- unsafe scripts or workflows,
- path traversal or file-read issues,
- CI or supply-chain weaknesses,
- accidental exposure of secrets or private data,
- sensitive data appearing in dataset records,
- unsafe publication of restricted, military, checkpoint, surveillance, or operational-sensitive information.

## Dataset Safety Reports

If a dataset record contains sensitive or unsafe information, report it privately.

Examples:

- private addresses or personal contact details,
- data that identifies private individuals,
- security, military, checkpoint, surveillance, or operational-sensitive locations,
- restricted source material accidentally imported into the repository.

Normal data corrections, missing records, source disagreements, and naming disputes should use public issue forms.

## Public Disclosure

Please give maintainers reasonable time to investigate and prepare a fix before public disclosure.
