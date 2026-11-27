# Changelog

All notable changes to playwright-agentic-demo are documented here.

---

## v0.2.0 -- Supply-chain security -- 2026-11-27

- GitHub Actions pinned to commit SHAs, read-only tokens, no persisted checkout credentials.
- Security workflow: TruffleHog secret scan (new commits; full history weekly and on demand),
  `npm audit` at high severity, dependency review on pull requests, CodeQL over the TypeScript and
  the workflow files. Weekly schedule, manual trigger, per-job timeouts.
- Dependabot for npm and GitHub Actions: weekly, minor and patch grouped, 5-day cooldown (14 days
  for a major version).
- npm release-age gate: `min-release-age=5` in `.npmrc` (npm 11.10 or newer).
- OpenSSF Scorecard workflow and badge; `npm audit` in the Azure pipeline.
- SECURITY.md with the private reporting route and the controls in place; README section
  "Code quality and supply-chain security".

---

## v0.1.0 -- Project scaffolded -- 2026-11-21

Scaffolded with [create-agentic-playwright](https://github.com/idavidov13/agentic-playwright).
