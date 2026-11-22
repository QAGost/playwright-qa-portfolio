---
description: Explore one page of practicesoftwaretesting.com with playwright-cli and write a P1-P5 test plan to plans/<name>.md (no test code)
argument-hint: <name>
---

# /page $ARGUMENTS

Explore the **$ARGUMENTS** page of the app under test (`APP_URL` in `env/.env.dev`,
practicesoftwaretesting.com) and write a ranked test plan to `plans/$ARGUMENTS.md`.

**Do not write test code.** No spec, page object, fixture, enum, factory or static-data
file is created or edited by this command. The only file written is `plans/$ARGUMENTS.md`.

If `$ARGUMENTS` is empty, stop and ask which page to explore.

## Rules that bind this command

- Exploration is **`playwright-cli` only** (Constitution: Explore Before Generate, No
  Substitute UI Exploration). Read `.claude/skills/playwright-cli/references/scaffold-usage.md`
  first, then the `playwright-cli` skill. If `playwright-cli` is not on PATH, run the wrapper
  directly: `bash scripts/playwright-cli.sh <command>`. If the CLI cannot run, **stop and tell me**; never
  fall back to an IDE or MCP browser or `codegen`.
- Load the `selectors` skill before proposing any locator; follow its priority order
  (`getByRole` > `getByLabel` > `getByPlaceholder` > `getByText` > `getByTestId`; the app's
  test-id attribute is `data-test`). No XPath, no CSS-only locators.
- Every selector, message string, route and validation rule in the plan must come from what
  you saw in the live app. Nothing guessed; an unknown is an open question.
- Never print, write or paste a credential, token or storage-state content.
- Explore-only artifacts (snapshots, screenshots, state files) stay under `.playwright-cli/`
  and are never committed.

## Procedure

1. **Resolve the page.** Read `APP_URL` from `env/.env.dev` (read only that line). Find the
   route for "$ARGUMENTS" by opening the app and following its navigation; if the name matches
   several pages or none, stop and ask.
2. **Check existing coverage.** `ls pages/ tests/ enums/` and grep for the page name, so the plan
   says what already exists (page object, enum routes, messages, factories) and what is missing.
2b. **Start from users, not elements.** Before exploring, list who uses this page, what each is
   trying to get done, and which workflows *just have to work*. Priorities come from the harm
   to those users when a workflow breaks, never from what is easiest to automate. Include the
   things real people do: reload, open a second tab, press Back, double-click, use only the
   keyboard, paste values (spaces, capitals), recover after a mistake, leave and come back,
   arrive signed out from a deep link.
3. **Log in if the page needs it** (protected route, redirect to login, account-only
   controls). Reuse the suite's storage state, never log in by typing credentials into the
   transcript:
    - `npx playwright test --project setup-ui` (creates `.auth/app/appStorageState.json`)
    - `playwright-cli state-load .auth/app/appStorageState.json`

   If the page behaves differently logged in versus logged out, explore both and say so.
4. **Explore.** `playwright-cli open <APP_URL>`, `resize 1920 1080` (the suite's viewport),
   `goto` the route, then:
    - `snapshot` to get the accessibility tree; note roles, accessible names and labels.
    - `eval "el => el.getAttribute('data-test')" <ref>` and similar `eval` calls to inspect the
      DOM for elements without a usable role or label.
    - Exercise the page: fill forms with valid and invalid input, submit empty, open
      dropdowns, sort, filter, paginate, toggle. Record every success, error and validation
      message **verbatim**, and where it appears.
    - Walk every workflow from step 2b on the live app and record what really happens; a
      workflow that misbehaves is a finding (likely defect or gap), not something to plan around.
      If a workflow needs a real login, load `env/.env.dev` into the shell (`set -a; .
      ./env/.env.dev; set +a`) and send all CLI output that would echo the values to
      `/dev/null`; never print them. Never make failed login attempts on the shared
      `APP_EMAIL` account (lockout risk); use random emails from the factory for failures.
    - `console` and `requests` to note errors and the API calls the page makes (endpoint and
      status), which tell the plan what can be set up or cleaned up over the API.
    - `screenshot --filename=.playwright-cli/$ARGUMENTS-<state>.png` for each distinct visual
      state (default, error, success, empty). Look at them; they decide which states are
      stable enough for a `toHaveScreenshot` check and which regions are dynamic (prices,
      dates, random product images, counters) and would need a `mask`.
    - Choose the check per region: `toMatchAriaSnapshot` (structure: roles, names, text;
      OS-independent) for "is it all there and labelled right", `toHaveScreenshot` (pixels;
      per-OS baselines) only where appearance itself matters (styling, layout). Most pages get
      one structural check on their main form or content block.
5. **Close** the session: `playwright-cli close`.
6. **Write `plans/$ARGUMENTS.md`** with the template below. Create `plans/` if missing.
7. **Stop.** Do not continue to `/codetest`. Report the plan path, the scenario count per
   priority, the confidence score and the open questions, and ask me to review the plan.

## Priority scale

| Priority | Meaning | Default tag |
| --- | --- | --- |
| P1 | Critical: the workflows real users need that just have to work; broken means users can't do what they came for. | `@smoke` |
| P2 | High: the most common user mistakes and recoveries, and security expectations (sign-out, protected pages). | `@sanity` |
| P3 | Medium: secondary features, per-field validation, negative paths. | `@regression` |
| P4 | Low: edge cases, boundaries, uncommon states (empty, long, special characters). | `@regression` |
| P5 | Cosmetic: layout and visual regression, copy, minor UI states. | `@regression` |

A scenario that mutates shared state (locale, roles, settings) is tagged `@destructive` instead,
whatever its priority. Exactly one tag per scenario (`test-standards` skill).

## Plan template

```markdown
# Test plan: <Page name>

- Route: <path, as it would appear in enums/app>
- Auth: <none | logged in | both>, <how it was established>
- Explored: <YYYY-MM-DD> with playwright-cli, viewport 1920x1080
- Status: Draft, awaiting review

## Users and what they need
| User | Goal | Must work |
| --- | --- | --- |

## Critical workflows (explored live)
| Workflow | Observed | Verdict (works / likely defect / gap / out of scope) |
| --- | --- | --- |

## Page summary
<What the page does, in 2-4 sentences.>

## Element inventory
| Element | Proposed locator (verified live) | Notes |
| --- | --- | --- |

## Messages observed
| Trigger | Exact text | Where it appears |
| --- | --- | --- |

## API calls observed
| Action | Method + endpoint | Status |
| --- | --- | --- |

## Scenarios
| ID | Priority | Tag | Title | Visual check |
| --- | --- | --- | --- | --- |

### <ID>: <title> (P<n>, <tag>)
- Preconditions: <auth, data, state>
- Steps (Given / When / Then):
  1. GIVEN ...
  2. WHEN ...
  3. THEN ...
- Expected: <assertions, with the exact messages from the table above>
- Data: <factory (test-data/factories/app/) | static set (test-data/static/...) | env var>
- Cleanup: <what is reverted and how, or "none: read-only">
- Visual: <none | toHaveScreenshot of <element or page>, masks: <dynamic regions> | toMatchAriaSnapshot of <element>>
- Evidence screenshots: <steps worth attaching to the report>

## Code this plan will need
- Page object / component: <exists: pages/... | new: pages/app/<name>.page.ts>
- Fixture registration: <needed | exists>
- Enums: <routes, messages to add under enums/app/>
- Factories / static data: <to add>
- Config constants: <e.g. screenshot diff threshold in config/>

## Out of scope
<Anything seen but deliberately not planned, and why.>

## Open questions
<Anything that could not be confirmed live. "None" if none.>

## Proposal
- Scope: plans/<name>.md only; code in the section above is for /codetest
- Confidence: <1-10> (<low|medium|high>)
- Rationale: <one line per +/- factor>
- Unknowns: <list or "none">
```
