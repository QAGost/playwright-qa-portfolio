---
description: Turn one verified finding from docs/manual-verification.md into a ready-to-file bug report in docs/bug-reports/ (drafts only; files nothing)
argument-hint: <finding id, e.g. A1>
model: sonnet
---

# /issue $ARGUMENTS

Write a bug report for finding **$ARGUMENTS** of `docs/manual-verification.md`, in the format of
`docs/bug-reports/login-double-click.md`, so I can paste it into an upstream issue.

**This command only drafts.** It never files an issue, comments upstream, or posts anywhere. The
only file it writes is `docs/bug-reports/<slug>.md` (and, when a plan names the finding, one
status line in that plan). Filing is my action.

If `$ARGUMENTS` is empty or not a row of the checklist, stop and ask which finding.

## Rules

- **Verified only.** Read the finding's row. If its Verified box is empty (`[ ]`), stop and tell
  me to verify it by hand first; do not draft. If only Claude ticked it, say so in the report's
  Status line ("verified by script, not yet by hand").
- **Nothing invented.** Steps, numbers, messages and counts come from the checklist section, its
  plan (`plans/*.md`) and, if needed, a fresh run against the live site. An unknown goes under
  "Not verified", never into Expected or Actual as fact.
- **Expected is a claim.** Where the app has no stated requirement, say "Expected (my
  assessment)" and why a shopper would expect it. Do not call a design choice a defect.
- **Severity** is the checklist's value (Low, Medium), with one sentence of reasoning. No
  Critical or High without evidence of data loss, security impact or a blocked purchase.
- **No secrets or personal data.** Never write a token, password, real email or storage state.
  Throwaway test accounts are described ("a freshly registered account"), not quoted.
- **Security-flavoured findings** (tokens, access control): say plainly that the target is a
  public practice site, and keep the steps to what is needed to reproduce.
- **Sources of truth.** Site and API URLs and the footer version come from what you read on the
  live site, not from memory.

## Procedure

1. **Read** the finding's row and its steps section in `docs/manual-verification.md`, the plan
   scenario it cites, and any test that covers it (`grep` the plan ID in `tests/`).
2. **Check for a duplicate upstream** (read-only): search the open and closed issues of
   `testsmith-io/practice-software-testing` for two or three plain keywords from the finding
   (for example `cart double click`). Use only the finding's generic words, nothing about me or
   this repository. List any candidates with their numbers and titles under "Related issues";
   say "none found" if none. Do not comment on them.
3. **Choose a title** `[Bug][<Area>] <what is wrong, one line>` and a file name
   `docs/bug-reports/<area>-<short-slug>.md`.
4. **Write the report** with these sections, in this order (same as the existing report):
    - the header table: Status, Upstream issue (`_to be added once filed_`), Found by
      (plan and scenario ID, and the automated test if one exists), Severity (my assessment);
    - Context; Steps to Reproduce (numbered, browser steps first; an automated reproduction
      snippet only if short and secret-free); Expected; Actual; Environment (site, API, footer
      version, browser, OS, date observed); Impact; Not verified; Related issues.
5. **Cross-link**: add the report's path to the finding's row in `docs/manual-verification.md`
   (the Plan column) and, if a plan scenario exists, a `bug report:` line to it.
6. **Check**: `npx prettier --write` on the files you touched, then `npx prettier --check .`.
7. **Stop** and report: the report path, the severity, any duplicates found, what is under "Not
   verified", and the line I should paste into the upstream issue title. Remind me that the
   report is a draft and that I file it. Ask before committing.
