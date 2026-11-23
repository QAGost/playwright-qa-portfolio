# Playwright QA Portfolio: testing the Toolshop demo shop

[![Lint](https://github.com/QAGost/playwright-qa-portfolio/actions/workflows/lint.yml/badge.svg)](https://github.com/QAGost/playwright-qa-portfolio/actions/workflows/lint.yml)
[![Playwright Tests (API)](https://github.com/QAGost/playwright-qa-portfolio/actions/workflows/playwright.yml/badge.svg)](https://github.com/QAGost/playwright-qa-portfolio/actions/workflows/playwright.yml)

By **Goran Ost**, Principal QA for the past three years, looking for a Senior or Principal QA
role.

**Start here:** the [login test plan](plans/login.md) (test design), the
[login tests](tests/app/functional/login.spec.ts) (P1 and P2) and the
[double-click bug report](docs/bug-reports/login-double-click.md) (a finding with evidence).

A risk-based test suite in **Playwright and TypeScript** for
[practicesoftwaretesting.com](https://practicesoftwaretesting.com), a public demo web shop built
for testers. It covers the API and the UI in one framework that shares schemas, test data and
setup between layers.

What this repository is meant to show:

- **Test design before test code.** Every feature starts with a written plan: who uses it, which
  workflows have to work, and scenarios ranked P1 to P5 by impact on those users
  ([`plans/`](plans/)).
- **Contract-first API tests.** Strict Zod schemas built field by field from the API's OpenAPI
  document; gaps between the contract and live behaviour are recorded, not papered over.
- **Findings, not just green ticks.** Defects and contract gaps found while testing, with an
  evidence-based bug report ([`docs/bug-reports/`](docs/bug-reports/)).
- **Tests nobody can break from outside.** The suite registers its own test user, so there are
  no stored credentials and no shared account to lock.
- **AI-assisted, human-decided.** Built with an AI coding assistant under strict rules; every plan
  was reviewed and every trade-off decided by me (see [How this was built](#how-this-was-built)).

## At a glance

| Layer                     | What it answers                                       | Status                                                                                   | Where                                                                               |
| ------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **API**                   | Does the backend honour its contract?                 | Users API P1 done: register, login, `/users/me`, self-delete forbidden. P2 to P4 planned | [`tests/app/api/`](tests/app/api/), plan [`api-users.md`](plans/api-users.md)       |
| **Functional UI**         | Does one feature work for a real user?                | Login P1 and P2 done. P3 to P5 planned                                                   | [`tests/app/functional/`](tests/app/functional/), plan [`login.md`](plans/login.md) |
| **Visual and structural** | Does it still look right, and is everything labelled? | Planned: accessibility snapshot and pixel checks of the login form                       | inside the functional specs                                                         |
| **E2E**                   | Does a whole journey work across pages?               | Planned: search → cart → checkout → invoice                                              | [`tests/app/e2e/`](tests/app/e2e/)                                                  |
| **Performance**           | Is it fast enough under load?                         | Planned as a separate k6 repository                                                      | n/a                                                                                 |

The full suite (API and UI) runs green locally. CI runs the static checks and the API tests on
every push (see [CI](#ci)).

## Test strategy

**Start from users, not from page elements.** Each plan lists the people who use a feature, what
they are trying to do, and the workflows that _just have to work_. The login plan, for example,
covers a returning customer, someone who mistypes, someone on a shared computer, a keyboard-only
user and a customer pasting from a password manager, and walks each workflow on the live site
before a test is written.

**Priorities come from impact on those users:**

| Priority | Meaning                                                                           | Tag (UI)      |
| -------- | --------------------------------------------------------------------------------- | ------------- |
| P1       | Workflows that just have to work; broken means users can't do what they came for  | `@smoke`      |
| P2       | Common mistakes and recoveries; security expectations (sign-out, protected pages) | `@sanity`     |
| P3, P4   | Validation, boundaries, edge cases                                                | `@regression` |
| P5       | Look and structure                                                                | `@regression` |

API tests all carry `@api`; their priority sets the build order. Every test has exactly one tag,
so `npm run test:smoke` or `npm run test:api` select a clean slice.

**Choose the layer by the risk.** Validation rules and token lifecycles are cheapest to test at
the API; what a user sees and does belongs in the UI; whole journeys belong in E2E. Error states
that are unsafe or impossible to produce against a shared site are candidates for network
mocking.

## Findings

Found while exploring and testing, each recorded with the evidence behind it:

| Finding                                                                                                                             | Type             | Evidence and status                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| A double-click on Login sends **two** login requests; with the 3-attempt lockout, one double-click with a typo may use two attempts | Defect           | [Bug report](docs/bug-reports/login-double-click.md), drafted; not yet filed upstream |
| Locking an account does **not** end its existing sessions: a token issued before the lock still works                               | Security finding | Observed live via the API ([plan](plans/api-users.md)); report to be written          |
| After being sent to login from an account page, users land on `/account`, not where they were                                       | UX gap           | Observed live ([plan](plans/login.md)); candidate enhancement request                 |
| Validation errors return **422**; the OpenAPI contract documents **400**                                                            | Contract gap     | Observed live; tests follow the live behaviour with an `// OBSERVED` note             |
| `POST /users/login` documents only **200**; 401 and 423 happen live                                                                 | Contract gap     | Observed live                                                                         |
| The register form requires house number and state; the API marks the address optional                                               | UI/API mismatch  | Observed live; candidate for a register plan                                          |

None of these was reported in the app's public issue tracker when checked (2026-11-22). The
lockout itself is by design (upstream issue #843).

## Design decisions

- **Self-provisioned test user.** The `setup-api` project reuses the test user saved from an
  earlier run while it can still log in, and otherwise registers a new, clearly labelled one
  (`pw-autotest-*@example.com`, no personal data). UI and API tests then run as that user. A
  shared demo account was locked during development by repeated failed logins, which is what
  prompted this. The public site removes all user data every hour (its privacy policy), so no
  test accounts are left behind.
- **Strict schemas from the contract.** API responses are validated with `z.strictObject`, so an
  unexpected field fails a test instead of passing silently. Schemas cite the contract they come
  from.
- **No weakened tests.** A failing test is never "fixed" by loosening an assertion, adding a skip
  or raising a timeout. A defect that is already recorded in a plan is marked `test.fail()` with
  a `// BUG:` note, which keeps the suite green while the defect exists and turns red when the
  app is fixed.
- **Test data from factories.** Happy-path data comes from Faker factories; invalid values come
  from curated static sets. Failed logins always use random emails, never the test user, so the
  suite can't lock itself out.
- **Locators by accessibility.** `getByRole` and `getByLabel` first, test ids next; one approved,
  documented CSS exception for a button the app gives no name or test id.
- **Never fixed ids of seeded data.** The demo database is rebuilt regularly, so tests look data
  up at run time.

## How this was built

Development used an AI coding assistant (Claude Code) inside guard-rails that come with the
scaffold: a written constitution, rule files per topic, and a hook that blocks rule violations
before a file is written. On top of that I added two commands
([`.claude/commands/`](.claude/commands/)):

1. **`/page <name>`** explores a page on the live site, starting from its users, and writes a
   ranked test plan. It writes no test code and stops for review.
2. **`/codetest <name> <priority>`** implements one priority of a reviewed plan, runs the same
   checks as CI, runs the tests and fixes failures for at most three attempts, without ever
   weakening a test.

The decisions were mine: what to test and in which order, which findings are defects, when a
contract is out of date, how to handle test users on a public site. AI answers were treated as
hypotheses to verify, not as facts.

## Run it

Requires Node.js 22 or newer.

```bash
npm ci
npx playwright install chromium
cp env/.env.example env/.env.dev        # PowerShell: Copy-Item env/.env.example env/.env.dev
npm test                                # everything except @destructive
```

No account or password is needed: the first run registers a test user automatically.

| Command               | Runs                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| `npm run test:api`    | API tests only (no browser)                                          |
| `npm run test:smoke`  | P1 UI tests                                                          |
| `npm run test:headed` | UI tests with a visible browser                                      |
| `npm run report`      | Opens the last HTML report                                           |
| `npm run lint`        | ESLint; CI also runs `npx prettier --check .` and `npx tsc --noEmit` |

**Troubleshooting:** a `401` on login or `/users/me` in the middle of a run usually means the
site's hourly data wipe removed the test user; run again. A `423` means an account was locked
after three failed logins.

## CI

GitHub Actions runs on every push to `main`:

- **Lint:** ESLint, a constitution scan, TypeScript, Prettier over every file (Markdown included)
  and a check that the test runner collects the suite.
- **Playwright Tests (API):** the API project, with no credentials at all (the run user is
  self-provisioned).

The UI tests run locally only: according to the scaffold's CI notes, the public site's UI sits
behind bot protection that challenges GitHub's runners. The planned fix is to run CI against a
fresh copy of the app in Docker (it is open source), which also gives Linux screenshot baselines.

## Project structure

```
plans/                    test plans: users, workflows, ranked scenarios, findings
docs/bug-reports/         evidence-based bug reports
tests/app/api/            API tests (*.creates-accounts.spec.ts register users)
tests/app/functional/     functional UI tests
tests/app/e2e/            end-to-end journeys
tests/app/*.setup.ts      test-user provisioning, API token, browser session
pages/                    page objects and components
fixtures/                 Playwright fixtures and Zod schemas (fixtures/api/schemas/)
test-data/                Faker factories and curated invalid values
enums/, config/           routes, endpoints, messages, settings
.claude/                  AI rules, skills and the /page and /codetest commands
```

## Roadmap

1. Users API P2: duplicate email, missing or invalid token, logout ends the token, lockout.
2. Login P3 to P5, including the accessibility snapshot and the known-defect tests.
3. E2E checkout journey.
4. CI against a Dockerised copy of the app, with the UI tests included.
5. File the findings upstream.
6. Performance tests with k6, in a separate repository.

## Credits and licence

This project started from the
[create-agentic-playwright](https://www.npmjs.com/package/create-agentic-playwright) scaffold
by Ivan Davidov and contributors (MIT, see [LICENSE](LICENSE)), which provides the framework,
the AI rules and the enforcement hook. The first commit is the unmodified scaffold, so the
history shows exactly what was added on top. The scaffold's own manual is kept in
[`docs/SCAFFOLD.md`](docs/SCAFFOLD.md); third-party notices are in [`NOTICE.md`](NOTICE.md).

The system under test, [practicesoftwaretesting.com](https://practicesoftwaretesting.com), is
the open-source Toolshop demo by Testsmith
([testsmith-io/practice-software-testing](https://github.com/testsmith-io/practice-software-testing)).
