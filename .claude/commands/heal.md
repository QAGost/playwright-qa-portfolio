---
description: Diagnose one failing test, classify the cause, and propose a fix as a diff for approval (never applies it)
argument-hint: <spec file or test title>
---

# /heal $ARGUMENTS

Find out why **$ARGUMENTS** fails and propose the smallest correct fix. This command **proposes**.
It edits nothing until I reply "apply"; then it applies exactly the diff I saw.

If `$ARGUMENTS` is empty, ask which spec or test title. If the test passes, say so and stop.

## The loop this belongs to

A model proposes (`/page`, `/codetest`, `/heal`), fixed rules validate (the constitution hook, ESLint,
`tsc`, Prettier, the skill gates, the test itself) and a person approves. Nothing in this command may
bypass a validator or the approval.

## Procedure

1. **Reproduce.** `npx playwright test <file> --reporter=list --workers=1 --retries=0` (add `--grep` for
   one title). Never propose a fix for a failure you could not reproduce; if it passes on a re-run, say
   it is flaky and go to `debugging` (5 green runs, never a timeout bump).
2. **Read the evidence** in the order of the `debugging` skill: the terminal output (test, failed call,
   expected versus received, line), `test-results/<test>/error-context.md`, the failure screenshot.
3. **Check the live app** before blaming the test: re-explore the one element or message with
   `playwright-cli` (read `.claude/skills/playwright-cli/references/scaffold-usage.md` first); for an API
   test, call the endpoint. If the site or API is down (5xx, timeouts), wait and re-run; that is
   environment, not a defect.
4. **Classify** into exactly one:

    | Class          | Meaning                                             | Proposal                                                                                             |
    | -------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
    | Test defect    | Wrong locator, race, stale wait, wrong expectation  | A diff to the page object or spec (root cause, not the symptom)                                      |
    | Value drift    | A message, route or static value changed in the app | A diff per `refactor-values`, with its impact analysis                                               |
    | Contract drift | An API response differs from the schema             | Per `api-testing`: documented contract means a bug; undocumented means an `// OBSERVED` schema field |
    | App defect     | The app is wrong and the test is right              | **No test change.** Draft the plan row and name `/issue`                                             |
    | Environment    | Outage, hourly data wipe, expired token, load       | No code change; say how to re-run                                                                    |

5. **Propose.** Show the evidence (the failing line and the live check), the class and why, then the
   unified diff of every file the fix touches, and the commands that will validate it. Stop and ask me to
   reply "apply".
6. **On "apply":** apply exactly that diff, then run `npm run lint`, `npx tsc --noEmit`,
   `npx prettier --check .` and the test file with `--workers=1 --retries=0`. For a fix to a test that
   asserts something, show it still fails when it should (change one expected value once, see red,
   restore). Maximum **3** attempts, then stop and report.
7. **Report:** class, files changed, validator results, and anything left (for an app defect, the draft
   plan row and the `/issue` step). Ask before committing.

## Never

The same list as `/codetest`, section "Never make a test pass by weakening it": no skip, no loosened
assertion or schema, no longer timeout, no retries, no `force: true`, no snapshot overwrite, no new
expected value copied from whatever the app returned unless the live check shows the test was wrong.
`test.fail()` only for a defect the plan already records (`test-standards`).

A proposal for an **app defect** never edits the test to match the bug.
