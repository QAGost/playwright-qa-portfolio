# Security Policy

## Scope

This repository is a test-automation project: Playwright tests, page objects, fixtures, CI
workflows and the AI workflow around them. A vulnerability here means one in that code or its
pipeline, for example:

- a committed credential or token;
- a workflow that runs untrusted code with write permissions;
- a vulnerable or compromised dependency in `package-lock.json`;
- a test or helper that sends real credentials somewhere they should not go.

The applications under test belong to their owners. A vulnerability in one of them is reported to
that owner, not here. Tests in this repository run only against public demo sites, with accounts the
tests create themselves.

## Supported versions

Only the `main` branch is maintained.

## Reporting a vulnerability

Please report privately through GitHub: the repository's **Security** tab, then **Report a
vulnerability**. Do not open a public issue for a security problem.

Include what you found, where (file and line, or workflow and run), and how to reproduce it. You can
expect a first reply within 7 days. Once a fix is merged, the advisory is published with credit to
the reporter, unless you prefer otherwise.

## How the repository protects itself

- GitHub Actions pinned to commit SHAs and updated by Dependabot, with read-only tokens unless a job
  needs more.
- `npm audit`, dependency review on pull requests, gitleaks secret scanning and CodeQL in
  [`.github/workflows/security.yml`](.github/workflows/security.yml).
- OpenSSF Scorecard in [`.github/workflows/scorecard.yml`](.github/workflows/scorecard.yml).
- No secrets in code: URLs and credentials come from environment variables, env files are
  gitignored, and a pre-commit hook and a CI scan block hardcoded credentials.
