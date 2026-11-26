# Playwright QA Portfolio: testing the Toolshop demo shop

[![Lint](https://github.com/QAGost/playwright-qa-portfolio/actions/workflows/lint.yml/badge.svg)](https://github.com/QAGost/playwright-qa-portfolio/actions/workflows/lint.yml)
[![Playwright Tests (API)](https://github.com/QAGost/playwright-qa-portfolio/actions/workflows/playwright.yml/badge.svg)](https://github.com/QAGost/playwright-qa-portfolio/actions/workflows/playwright.yml)

By **Goran Ost**: 20 years in QA, the last three as Principal QA, looking for a Senior or
Principal QA role.

**Start here:**

- **Test design:** the [checkout plan](plans/checkout.md) or the [login plan](plans/login.md): users,
  workflows and scenarios ranked by impact.
- **A whole journey:** the [checkout E2E test](tests/app/e2e/checkout.spec.ts) (search, cart, payment,
  invoice).
- **A finding with evidence:** the [cart double-click bug report](docs/bug-reports/cart-double-click.md),
  and the [test that tracks it](tests/app/functional/product-page.spec.ts) (PP-06).
- **Performance:** the separate [k6 repository](https://github.com/QAGost/k6-toolshop-load).

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
- **Tests that cannot lock themselves out.** The suite registers its own test user, so there are
  no stored credentials and no shared account to lock.
- **AI-assisted, human-decided.** Built with an AI coding assistant under strict rules; every plan
  was reviewed and every trade-off decided by me (see [How this was built](#how-this-was-built)).

## At a glance

| Layer                     | What it answers                                       | Status                                                                                                        | Where                                                                               |
| ------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **API**                   | Does the backend honour its contract?                 | Users API P1 done: register, login, `/users/me`, self-delete forbidden. P2 to P4 planned                      | [`tests/app/api/`](tests/app/api/), plan [`api-users.md`](plans/api-users.md)       |
| **Functional UI**         | Does one feature work for a real user?                | Login, product search and product page: P1 and P2 done (two known-defect tests). P3 to P5 planned             | [`tests/app/functional/`](tests/app/functional/), plan [`login.md`](plans/login.md) |
| **Visual and structural** | Does it still look right, and is everything labelled? | Planned: accessibility snapshot and pixel checks of the login form                                            | inside the functional specs                                                         |
| **E2E**                   | Does a whole journey work across pages?               | Done: search → product → cart → checkout → invoice (checkout plan: [`checkout.md`](plans/checkout.md))        | [`tests/app/e2e/`](tests/app/e2e/)                                                  |
| **Performance**           | Is it fast enough under load?                         | [k6-toolshop-load](https://github.com/QAGost/k6-toolshop-load): smoke and gentle browse load, with thresholds | n/a                                                                                 |

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

| Finding                                                                                                                             | Type               | Severity | Evidence and status                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Double-clicking **Add to cart** shows 2 in the header but the cart holds 1 (two carts are created)                                  | Defect             | Medium   | [Bug report](docs/bug-reports/cart-double-click.md), reproduced by hand and 4 of 4 times; known-defect test PP-06 in the suite |
| Locking an account does **not** end its existing sessions: a token issued before the lock still works                               | Security finding   | Medium   | Reproduced 2026-11-23 on a throwaway user ([plan](plans/api-users.md)); report not yet drafted                                 |
| A double-click on Login sends **two** login requests; with the 3-attempt lockout, one double-click with a typo may use two attempts | Defect             | Low      | [Bug report](docs/bug-reports/login-double-click.md), reproduced by hand; not yet filed upstream                               |
| Sorting search results changes which products match ("hammer": 6 becomes 7); search and sort use two different API endpoints        | Defect             | Low      | Reproduced by hand in the Network tab; known-defect test planned (PS-08, [plan](plans/product-search.md))                      |
| Back from a product page loses the search; the address never changes                                                                | UX defect          | Low      | Known-defect test in the suite ([plan](plans/product-search.md))                                                               |
| An unknown or outdated product id shows a blank page, and the related-products call returns 500                                     | Defect (edge case) | Low      | Observed live; not automated, a shopper only reaches it through a stale link ([plan](plans/product-page.md))                   |
| After being sent to login from an account page, users land on `/account`, not where they were                                       | UX gap             | Low      | Observed live ([plan](plans/login.md))                                                                                         |
| Validation errors return **422**; the OpenAPI contract documents **400**                                                            | Contract gap       | Low      | Observed live; tests follow the live behaviour with an `// OBSERVED` note                                                      |
| `POST /users/login` documents only **200**; 401 and 423 happen live                                                                 | Contract gap       | Low      | Observed live                                                                                                                  |
| The register form requires house number and state; the API marks the address optional                                               | UI/API mismatch    | Low      | Observed live; candidate for a register plan                                                                                   |

Severity is my estimate of the impact if this were a live shop. Every finding is checked by hand
([checklist](docs/manual-verification.md)) before it is called a defect.

None of these has been filed upstream yet; two bug reports are drafted for me to file. The lockout
itself is by design (upstream issue #843).

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
before a file is written. On top of that I added four commands
([`.claude/commands/`](.claude/commands/)):

1. **`/page <name>`** explores a page on the live site, starting from its users, and writes a
   ranked test plan. It writes no test code and stops for review.
2. **`/codetest <name> <priority>`** implements one priority of a reviewed plan, runs the same
   checks as CI, runs the tests and fixes failures for at most three attempts, without ever
   weakening a test.
3. **`/issue <finding>`** turns one finding that I verified by hand into a bug-report draft in
   [`docs/bug-reports/`](docs/bug-reports/), after a read-only search for duplicates upstream. It files
   nothing: that stays my action.
4. **`/heal <test>`** reproduces a failing test, checks the live app, classifies the cause (test defect,
   value drift, contract drift, app defect or environment) and proposes a fix as a diff. It applies
   nothing until I approve, and an app defect never gets a test edited to match the bug.

Each command names its model. Planning (`/page`) and diagnosis (`/heal`) run on Claude Opus, where
judgment matters most. Writing tests to a reviewed plan (`/codetest`) and drafting a report from a
verified finding (`/issue`) run on Claude Sonnet, which is faster and cheaper for settled work.

### The loop: a model proposes, fixed rules validate, a person approves

| Stage    | Who or what                                                                                    | Examples in this repository                                                                    |
| -------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Propose  | The model, from evidence it gathered on the live site                                          | `/page` writes a plan, `/codetest` writes tests, `/heal` proposes a fix, `/issue` a report     |
| Validate | Rules that do not depend on the model: a hook, ESLint, `tsc`, Prettier, skill gates, the tests | A write that breaks a constitution rule is blocked and names the rule; CI runs the same checks |
| Approve  | Me, at a gate between every step                                                               | I review the plan before tests, approve a diff before it is applied, file reports myself       |

What this is: a working workflow built from Claude Code commands and checks in this repository. What it
is not: a standalone tool for other teams. `/heal` has so far been exercised on one simulated failure (a
mistyped message); it has not yet been used on a real regression. The audit of the skills behind the loop
is in [`docs/skills-audit.md`](docs/skills-audit.md).

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
| `npm run test:e2e`    | E2E tests (the checkout journey)                                     |
| `npm run test:headed` | UI tests with a visible browser                                      |
| `npm run report`      | Opens the last HTML report                                           |
| `npm run lint`        | ESLint; CI also runs `npx prettier --check .` and `npx tsc --noEmit` |

**Troubleshooting:** a `401` on login or `/users/me` in the middle of a run usually means the
site's hourly data wipe removed the test user; run again. A `423` means an account was locked
after three failed logins.

### Tried: the "with bugs" build

The demo's maintainers also host `with-bugs.practicesoftwaretesting.com`, a copy with seeded
defects. I ran this suite against it (`ENVIRONMENT=bugs`, a gitignored `env/.env.bugs`) on
2026-11-23: 9 passed, 4 failed and 31 did not run. It is an **older build**, not the main site plus
bugs, so the failures are version differences, not seeded bugs:

- Registration takes a flat `address`, `city`, `country` and `postcode` instead of a nested address
  object (422 on our payload), and the user response carries extra keys that the strict schema rejects.
- Opening `/auth/login` directly returns a server 404 (no single-page-app fallback), so the UI setup
  fails and no UI test can run.

Running the suite there would need per-environment payloads and navigation from the home page, so
it is parked. Hunting the seeded bugs by hand is the cheaper use of that site.

## CI

GitHub Actions runs on every push to `main`:

- **Lint:** ESLint, a constitution scan, TypeScript, Prettier over every file (Markdown included)
  and a check that the test runner collects the suite.
- **Playwright Tests (API):** the API project, with no credentials at all (the run user is
  self-provisioned).

The UI tests run locally only: according to the scaffold's CI notes, the public site's UI sits
behind bot protection that challenges GitHub's runners. The planned fix is to run CI against a
fresh copy of the app in Docker (its licence allows running it for private, non-commercial use, so
this needs checking first), which also gives Linux screenshot baselines.

## Project structure

```
plans/                    test plans: users, workflows, ranked scenarios, findings
docs/bug-reports/         evidence-based bug reports; docs/manual-verification.md lists each finding with steps
tests/app/api/            API tests (*.creates-accounts.spec.ts register users)
tests/app/functional/     functional UI tests
tests/app/e2e/            end-to-end journeys
tests/app/*.setup.ts      test-user provisioning, API token, browser session
pages/                    page objects and components
fixtures/                 Playwright fixtures and Zod schemas (fixtures/api/schemas/)
test-data/                Faker factories and curated invalid values
enums/, config/           routes, endpoints, messages, settings
.claude/                  AI rules, skills and the /page, /codetest, /issue and /heal commands
```

## Roadmap

1. Users API P2: duplicate email, missing or invalid token, logout ends the token, lockout.
2. Product search P3 to P5 and login P3 to P5, including the accessibility snapshots.
3. More checkout scenarios: quantity change, guest sign-in, other payment methods ([plan](plans/checkout.md)).
4. CI against a Dockerised copy of the app, with the UI tests included.
5. File the drafted bug reports upstream and draft the token finding.
6. k6: a write journey and CI, against a private copy of the app ([k6 repository](https://github.com/QAGost/k6-toolshop-load)).

## Credits and licence

This project started from the
[create-agentic-playwright](https://www.npmjs.com/package/create-agentic-playwright) scaffold
by Ivan Davidov and contributors (MIT, see [LICENSE](LICENSE)), which provides the framework,
the AI rules and the enforcement hook. The first commit is the unmodified scaffold, so the
history shows exactly what was added on top. The scaffold's own manual is kept in
[`docs/SCAFFOLD.md`](docs/SCAFFOLD.md); third-party notices are in [`NOTICE.md`](NOTICE.md).

The system under test, [practicesoftwaretesting.com](https://practicesoftwaretesting.com), is
the Toolshop demo by Testsmith, whose source is
public under a non-commercial licence
([testsmith-io/practice-software-testing](https://github.com/testsmith-io/practice-software-testing)).
None of its code is copied into this repository.
