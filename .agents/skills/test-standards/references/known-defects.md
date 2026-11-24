# Known defects: `test.fail()` versus `test.skip`

Open when a scenario hits behaviour you have confirmed is a defect in the app under test.

## The two cases

| Situation                                                             | Use                                       | Why                                                |
| --------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------- |
| The API answers differently from its documented contract              | `test.skip` + `// FIXME:` (`api-testing`) | The schema is the contract; it is never loosened   |
| A defect the test plan records (observed live, confirmed by a person) | `test.fail()` + `// BUG:` (this file)     | The correct expectation stays in the test and runs |
| A failure found while writing tests that nobody has confirmed yet     | neither: report it first                  | A new red is evidence, not yet a known defect      |

## The pattern

`test.fail()` is the first line of the body, and a `// BUG:` line above it names the defect, the date
observed and the plan row. The assertions stay exactly as a correct app would satisfy them.

```typescript
test(
    'should keep the results after Back',
    { tag: '@sanity' },
    async ({ page }) => {
        // BUG: Back loses the search, observed 2026-11-23, see plans/product-search.md PS-07
        test.fail();
        // ...GIVEN / WHEN / THEN with the correct expectation
    }
);
```

Playwright reports the test green while the defect exists and red once the app is fixed. That red is the
signal to delete the marker.

## Rules

- The defect is in the plan (a scenario row marked as a known defect) before the marker is written.
- Prove the test fails for the right reason: remove `test.fail()` once, read the failure, put it back.
  A wrong selector or a typo also "passes" under `test.fail()`.
- List every `test.fail()` in the report. Never use it to hide a failure you have not explained.
- A bug report drafted from the plan (`/issue`) links the test.
