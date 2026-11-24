# Skills and commands audit

Audited 2026-11-23, after the login, product search, product page and checkout work. Method: run the
repository's own gates, then check whether each rule we needed during real work is written down where
an agent will find it. This is a reading of the skills against evidence from this work, not an
evaluation run of the skills.

## Mechanical health

`npm run check:skills` passes all eight gates: `AGENTS.md` budget and index, generated-tree parity,
skill shape and size caps, vendored-skill lock, rules drift, references, heading pointers and
cross-references (17 skills, 154 cross-reference tokens, 0 drift). The 15 repo-owned skills are 35 to
60 lines each. The two vendored skills (`skill-creator`, `playwright-cli`, about 490 lines each) are
upstream copies pinned by hash and are left alone.

## Gaps found

| #   | Gap                                                                                                                                                                                               | Evidence from this work                                                                                 | Proposed change                                                                                                     | Priority |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | The **known-defect convention** (`test.fail()` first in the body, a `// BUG:` line, a plan row) exists only in `/codetest`. The Constitution says a mismatch is `test.skip` plus `// FIXME`.      | PS-07, PP-06 use `test.fail()`; another agent or harness would not know the rule and would weaken tests | Add `test-standards/references/known-defects.md` and one Critical line; say when `test.skip` and when `test.fail`   | High     |
| 2   | The three **commands** (`/page`, `/codetest`, `/issue`) are Claude Code only and are not named in `AGENTS.md` or the README workflow, so the plan, then tests, then bug report loop is invisible. | `/issue` was added today; nothing links the three                                                       | One short "Claude Code workflow" paragraph in the README and a pointer line in `CLAUDE.md`                          | Medium   |
| 3   | **Waiting for a settled state** is not written down: app markers can outlive a reset, so wait on the API response or on a DOM state the next step needs.                                          | `search_completed` stayed after a reset and let a second search return early; PS-05 raced               | Add a short section to `page-objects` (actions wait for the state the next step needs) and a pointer in `debugging` | Medium   |
| 4   | The **UI against API cross-check** pattern has no home.                                                                                                                                           | PP-18 compares the product page with `GET /products/{id}`; a mutation check proved it can fail          | Add a section to `api-testing/references/` (when to use, strict schema, mutation check)                             | Medium   |
| 5   | The lint rule **`playwright/no-nth-methods`** (no `.first()`) is not in `selectors`.                                                                                                              | Hit during product search; fixed with `allInnerTexts()` and `not.toHaveCount(0)`                        | One line in `selectors` with the two alternatives                                                                   | Low      |
| 6   | The **hourly data wipe** and the run-user lifecycle are only in the README and my notes.                                                                                                          | Affects test data, cleanup and what "state cleanup" means for own data                                  | Two lines in `data-strategy`: own data on this site needs no revert, shared state does                              | Low      |
| 7   | `/codetest` restates the Constitution in its Conventions section, which can drift from `AGENTS.md`.                                                                                               | 139 lines; its Conventions list restates about eight Constitution rules                                 | Replace the duplicated rules with pointers to the skills; keep only what is command-specific                        | Low      |
| 8   | Local runs on a 2-core machine are flaky at the default worker count; CI already uses 1.                                                                                                          | Screenshot timeouts at 2 workers; stable at 1 (about 2 minutes)                                         | Decision for the owner: `workers: 1` locally, or a `test:local` script                                              | Low      |

## What is already good

- Skills are short, single-purpose and routed from one entry skill; the cross-reference gate stops them
  drifting apart.
- The hook turns a Constitution rule into a blocked write with the rule named, which is how a violation (inline text in an
  assertion) was caught and fixed before it was written.
- Commands stop at a human gate (`/page` at a reviewed plan, `/issue` at a draft) and forbid weakening a
  test to make it pass.

## Applied (2026-11-23)

Items 1 to 7 are applied: new references `test-standards/references/known-defects.md`,
`page-objects/references/waiting.md` and `api-testing/references/ui-api-crosscheck.md`; pointers in the
SKILL.md files, a row in the `debugging` table, notes in `selectors` and `data-strategy`; the README and
`CLAUDE.md` name the three commands; `/codetest` Conventions point to the skills. Item 8 stays a decision.

## Not done

Item 8 (workers locally) needs a decision: it changes `playwright.config.ts` or `package.json`.
