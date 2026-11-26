---
description: Write the tests for one priority of plans/<name>.md, run them, read the logs and fix failures (max 3 fix attempts)
argument-hint: <name> <priority P1-P5>
model: sonnet
---

# /codetest $ARGUMENTS

Arguments: `$ARGUMENTS`. The first word is `<name>`, the second is `<priority>`; substitute
them everywhere below. Plan: `plans/<name>.md`.

Write the tests for the **<priority>** scenarios of that plan, run them, and fix failures. Stop after
3 fix attempts and report.

## Before writing anything

1. If `<name>` or `<priority>` is missing, or `<priority>` is not one of `P1`-`P5`, stop and ask.
2. Read `plans/<name>.md`. If it does not exist, stop and tell me to run `/page <name>` first.
3. Select only the scenarios marked `<priority>`. If there are none, stop and say so.
4. If an unresolved item in the plan's **Open questions** affects a `<priority>` scenario, or one depends on
   something the plan does not settle (a missing env var, credential, enum value or
   message), stop and ask. Do not invent it.
5. Running `/codetest` is my approval of the `<priority>` slice of the plan (the human gate of
   `ai-native-workflow`). Anything outside that slice (changing an existing enum or static
   value, a new env var, editing another spec) needs my approval first.

## Conventions

This repo's Constitution (`AGENTS.md`) applies in full; the skills hold the rules, so load them as
they are needed instead of restating them here: `test-standards`, `page-objects`, `selectors`,
`fixtures`, `enums`, `data-strategy`, `config`. What is specific to this command:

- The tag of each test comes from the plan, and the test steps are GIVEN / WHEN / THEN.
- Locators, routes, messages and content values follow the skills; a spec holds no raw locator.
- Specs go in `tests/app/functional/<name>.spec.ts` (or `tests/app/e2e/` for a multi-page
  journey). If the file exists, add to it; do not rewrite tests of other priorities.

## Explore again

Every locator and message must still match the live app. Re-check the ones you will use with
`playwright-cli` (read `.claude/skills/playwright-cli/references/scaffold-usage.md` first; if it
is not on PATH, run `bash scripts/playwright-cli.sh <command>`). A
new `pages/**/*.page.ts` or `*.component.ts` file needs a fresh exploration marker (under 240
minutes old), so explore before creating it. If the CLI cannot run, stop and tell me. Close the
session when done. A plan detail that no longer matches the app is reported, not silently
changed.

## Screenshots

- **Evidence screenshots:** at the steps the plan names, attach a screenshot to the report:
  `await test.info().attach('<step name>', { body: await page.screenshot(), contentType: 'image/png' });`
  (from inside a page-object method or the step). Use them where they help a reader see the
  state, not on every step.
- **Visual comparisons:** use `await expect(locator).toHaveScreenshot('<name>.png', { mask: [...] })`
  for every scenario whose plan says `Visual:`. Prefer an element over the full page. Mask the
  dynamic regions the plan lists (prices, dates, random images, counters) with page-object
  locators. Any tolerance (`maxDiffPixelRatio`, `maxDiffPixels`) is a named constant in
  `config/`, never an inline number.
- **First baseline:** a new `toHaveScreenshot` has no baseline yet. Create it only with
  `npx playwright test <file> --update-snapshots=missing --reporter=list`, then open the new
  PNG under the spec's `-snapshots/` folder and confirm it shows the expected state (not an
  error page, spinner or half-loaded page). A wrong baseline is deleted and the cause fixed;
  it is never accepted. Creating a missing baseline does not count as a fix attempt.
- Baselines are OS-specific (`-win32` on this machine). Say so in the report; a Linux CI run
  needs its own.
- **Structural comparisons:** for every scenario whose plan says `toMatchAriaSnapshot`, use
  `await expect(locator).toMatchAriaSnapshot({ name: '<name>.aria.yml' })`. The stored
  snapshot is created the same way as a pixel baseline (`--update-snapshots=missing`), then
  read: it must list the roles, names and text the plan recorded, nothing from an error or
  half-loaded state. Never hand-write or hand-edit it to make a test pass. Aria snapshots are
  OS-independent, so they need no per-OS copy.

## Run, read, fix

1. Static checks, the same as the CI Lint workflow: `npm run lint` (zero warnings),
   `npx tsc --noEmit`, and `npx prettier --check .` (covers Markdown, YAML and JSON, which
   ESLint does not; plans and docs fail CI too). Fix formatting with
   `npx prettier --write <file>`, then re-check: a file that still fails after `--write` has a
   structural Markdown problem (for example invalid list numbering) to fix by hand.
2. Run: `npx playwright test tests/app/functional/<name>.spec.ts --reporter=list --workers=1 --retries=0 --trace retain-on-failure`.
   Always pass `--reporter=list` (terminal output only; the config's HTML and JUnit reporters
   are for CI) and `--trace retain-on-failure` (a trace of the first failed attempt; passing
   tests keep none). Use the same flags on every re-run.
3. If anything is red, load the `debugging` skill and read, in this order: the terminal
   output (test, failed call, expected versus received, line), then
   `test-results/<test>/error-context.md`, the failure screenshot (`test-failed-*.png`), and for
   a visual failure the `-actual`, `-expected` and `-diff` PNGs. Open
   `test-results/<test>/trace.zip` with the trace inspector (`debugging`,
   `references/tools.md`) when those do not explain the failure, or when it looks like timing,
   navigation or the network: read `trace actions`, then `trace snapshot <n> --name before` for
   the failing action, `trace requests` and `trace errors`; never dump the whole trace. Classify
   with the `debugging` table and fix the root cause in the file it names (usually the page
   object or the data).
4. Re-run lint and the spec. That is **one fix attempt**. The first run in step 2 is not an
   attempt.
5. Stop when the spec is green, or after **3 fix attempts**, whichever comes first.

## Never make a test pass by weakening it

These are forbidden, whatever the failure:

- `test.skip`, `test.fixme`, conditional skips, or commenting a test out (this overrides the
  Constitution's `test.skip` plus `// FIXME:` allowance for this command);
- `test.fail()`, with one exception below;
- removing, softening or loosening an assertion: deleting an `expect`, `toBeVisible` to
  `toBeAttached`, exact text to a partial match or a looser regex, `expect.soft` in place of
  `expect`, `try/catch` around an `expect`;
- longer timeouts, `waitForTimeout`, retries, `force: true` clicks;
- raising a screenshot tolerance, adding masks to hide a real diff, or
  `--update-snapshots` over an existing baseline;
- changing expected values to whatever the app returned, unless the live app shows the plan
  was wrong; then say so in the report.

If the evidence points to an app defect rather than a test defect, stop fixing that test and
report it as a likely bug with the error, the screenshot path and the steps to reproduce.

**Known-defect exception (approved 2026-11-22).** A scenario the plan itself marks as a likely
defect (observed live during `/page`, or confirmed by me) is written with its correct,
unweakened expectation and marked `test.fail()` as the first line of the test body, with a
`// BUG: <what is wrong>, observed <date>, see plans/<name>.md <ID>` line above it. Playwright
then reports it green while the defect exists and red once the app is fixed, which is the
signal to remove the marker. Never use this for a failure found during `/codetest`: that is
reported first, and only becomes a known defect once I confirm it and it is added to the plan.
List every `test.fail()` in the report.

## Report

Stop and report:

- the scenarios implemented (ID, title, tag) and the files created or changed;
- lint status and the final test result per test (pass or fail);
- for each fix attempt: the failure, the cause found (quote the trace line that shows it when
  the trace was read), the change made;
- for anything still red after 3 attempts: the last error, the evidence paths, and your best
  diagnosis (test defect, app defect or unknown);
- baselines created, with paths, and the OS-specific note;
- plan details that no longer match the app.

Walk the `common-tasks` verification checklist before reporting. Do not commit; ask first.
