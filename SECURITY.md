# Security Policy

## Scope

This repository is a portfolio and demo project in test automation: Playwright tests, page objects, fixtures, CI
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

## What is in place

| Control                                                                                   | Where                                                                   |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Credentials only in environment variables; env files are gitignored                       | `env/.env.example`, `.gitignore`                                        |
| Pre-commit gates: ESLint, Prettier and the Constitution scan (no hardcoded URLs or `any`) | `.husky/pre-commit`                                                     |
| Leaked-credential scan of new commits, and of the whole history weekly (TruffleHog)       | [`security.yml`](.github/workflows/security.yml)                        |
| `npm audit` (high and above) on every push, PR and weekly; dependency review on PRs       | [`security.yml`](.github/workflows/security.yml), `azure-pipelines.yml` |
| CodeQL static analysis of the TypeScript and of the workflow files                        | [`security.yml`](.github/workflows/security.yml), code scanning         |
| Actions pinned to commit SHAs, read-only tokens, no persisted checkout credentials        | `.github/workflows/`                                                    |
| Dependabot update PRs, with a 5-day cooldown (14 days for a major version)                | [`dependabot.yml`](.github/dependabot.yml)                              |
| npm release-age gate: `npm install` takes only versions published 5 or more days ago      | [`.npmrc`](.npmrc)                                                      |
| OpenSSF Scorecard grades the supply-chain practices                                       | [`scorecard.yml`](.github/workflows/scorecard.yml)                      |

The README section [Code quality and supply-chain security](README.md#code-quality-and-supply-chain-security)
explains each tool.
