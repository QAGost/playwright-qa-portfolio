# Waiting for the state the next step needs

Open when an action starts something asynchronous (a search, a reset, a navigation) and a later step
depends on its result.

An action returns only when the page is ready for the **next** step. Wait for evidence of that state,
and pick evidence that cannot be left over from an earlier action.

- **Prefer the network response** for the call the action starts (`page.waitForResponse(...)` with the
  method and the endpoint from `enums`), set up **before** the click, then await it after.
- **Or a DOM state the next step needs**: a count (`toHaveCount(n)`), a heading that is hidden or
  visible. A web-first assertion in the action is allowed.
- **Do not trust app markers that persist.** A "completed" test id can stay in the page after a reset
  and let the next search return early (seen in the product search page object).
- **A reset waits for the default state**, not only the click: a late response from the reset can
  overwrite the next search. The reset action waits until the default grid is back.
- Never `waitForTimeout`; a flake fix needs 5 green runs (`debugging`).
