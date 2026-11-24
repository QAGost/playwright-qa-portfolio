# [Bug][Cart] Double-clicking "Add to cart" shows 2 in the header but the cart holds 1

|                          |                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------- |
| Status                   | Drafted 2026-11-23; verified by hand and by script; not yet filed upstream              |
| Upstream issue           | _to be added once filed at github.com/testsmith-io/practice-software-testing_           |
| Found by                 | Test plan [`plans/product-page.md`](../../plans/product-page.md), scenario PP-06        |
| Automated test           | `tests/app/functional/product-page.spec.ts`, PP-06 (a known-defect test, `test.fail()`) |
| Severity (my assessment) | Medium: the shopper is told they have 2 items and then finds 1, and pays for 1, not 2   |

## Context

On a product page, pressing "Add to cart" twice in quick succession (a double-click) adds the
product once to the cart, but the cart count in the header goes to 2. The shopper then sees a
different number on the cart page.

## Steps to Reproduce

1. Open a **new browser tab** (a fresh tab has no cart) at https://practicesoftwaretesting.com
2. Open the developer tools, Network tab, and filter by `carts`.
3. Search for `Combination Pliers` and open the product.
4. **Double-click** "Add to cart" (two quick clicks).
5. Read the number on the cart link in the header.
6. Click the cart link and read the quantity of the line and the total.

Also try a **single click** in a fresh tab: the header and the cart both show 1, which confirms it is
the double-click.

## Expected

The header count and the cart quantity agree. For two clicks that is 2 and 2; for one add it is 1 and

1.

Expected (my assessment): a shopper who sees "2" in the header expects 2 in the cart, and a second
click on the same product either adds one more or is ignored while the first request is pending.

## Actual

- Header count: **2**
- Cart page: quantity **1**, total $14.15 (one unit)
- Network: **two** `POST /carts` (201), then two `POST /carts/<id>` (200). The two requests use
  **different cart ids**: the first click created a cart, and the second click created another one
  instead of using it.

Repeated on 2026-11-23: 4 of 4 fresh sessions gave header 2 and cart quantity 1, signed out and signed
in.

## Environment

- Site: https://practicesoftwaretesting.com (footer: v2.5 | Built 2026-10-11 | Angular 20.0.5)
- API: https://api.practicesoftwaretesting.com
- Browser: Chromium (Chrome for Testing 158), Windows 10, viewport 1920x1080
- Observed: 2026-11-23

## Impact

- The header count and the cart disagree, so the shopper may believe they ordered 2 and receive 1.
- A second, unused cart is created on the server for every double-click.
- It is the same pattern as the login double-click report (`login-double-click.md`): the first click
  starts a request and the button stays active for the second.

## Not verified

- Whether the abandoned second cart is ever cleaned up by the server.
- Whether the cart id a later "Add to cart" uses is the first or the second one (a follow-up add
  after the double-click was not recorded).
- A touch screen double-tap and the keyboard (Enter twice) were not tried.

## Related issues

None found: searches of `testsmith-io/practice-software-testing` for "cart double click",
"add to cart quantity badge" and "cart two carts" returned no issues (2026-11-23).
