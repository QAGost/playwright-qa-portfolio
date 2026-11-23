# Test plan: Checkout

- Route: `/checkout` (a four-step wizard on one route), then `/account/invoices`
- Auth: both. The sign-in step is skipped when signed in (observed); signed out it shows the login form.
- Explored: 2026-11-23 with playwright-cli, viewport 1920x1080 (signed in as the run user)
- Status: P1 implemented 2026-11-23; P2 to P5 not started

## Users and what they need

| User              | Goal                                            | Must work                                                       |
| ----------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| Signed-in shopper | Buy what is in the cart and get proof of order  | Steps in order, an invoice number, the order in their invoices  |
| Guest shopper     | Buy without having signed in first              | Sign-in step shown, continue after logging in                   |
| Shopper who errs  | Fix a wrong quantity, address or payment choice | Quantity edit, address validation, payment errors are explained |

## Critical workflows (explored live)

| Workflow                    | Observed                                                                                                       | Verdict  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| Cart, one product           | Line shows title, quantity input, unit price, line total and cart total                                        | works    |
| Proceed while signed in     | Step 2 says "Hello PW Autotest, you are already logged in. You can proceed to checkout." with a Proceed button | works    |
| Billing address             | Prefilled from the profile (country, postal code, house number, street, city, state)                           | works    |
| Payment by Cash on Delivery | Select the method, "Check payment" enables, then shows "Payment was successful" and a Confirm button           | works    |
| Confirm                     | "Thanks for your order! Your invoice number is INV-2026000007."; the cart is deleted (DELETE /carts/{id} 204)  | works    |
| Order appears in account    | `/account/invoices` lists the invoice number, street, date and total ($14.15, equal to the cart)               | works    |
| Other payment methods       | Bank Transfer, Credit Card, Buy Now Pay Later, Gift Card exist; their extra fields were not explored           | not seen |
| Guest at the sign-in step   | Not explored in this pass                                                                                      | not seen |

## Page summary

The checkout is a wizard on `/checkout`: cart, sign in, billing address, payment. A signed-in shopper passes the sign-in step with one click. Confirming the payment creates the invoice and deletes the cart.

## Element inventory

| Element                   | Proposed locator (verified live)                                    | Notes                                                                               |
| ------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Proceed (steps 1, 2, 3)   | `getByRole('button', { name: 'Proceed to checkout' })`              | One visible at a time                                                               |
| Signed-in notice          | `getByText(/you are already logged in/)`                            | Contains the user's name                                                            |
| Country                   | `getByLabel('Country')`                                             | Select                                                                              |
| Postal code, house number | `getByLabel('Postal code')`, `getByLabel('House number')`           | Drive the address lookup                                                            |
| Street, City, State       | `getByLabel('Street')`, `getByLabel('City')`, `getByLabel('State')` |                                                                                     |
| Payment method            | `getByLabel('Payment Method')`                                      | Options: Bank Transfer, Cash on Delivery, Credit Card, Buy Now Pay Later, Gift Card |
| Check payment             | `getByRole('button', { name: 'Check payment' })`                    | Disabled until a method is chosen                                                   |
| Confirm                   | `getByRole('button', { name: 'Confirm' })`                          | After "Payment was successful"                                                      |
| Order confirmation        | `getByText(/Thanks for your order/)`                                | Holds the invoice number                                                            |
| Invoice list              | `getByRole('table')` on `/account/invoices`, heading "Invoices"     | Columns: Invoice Number, Billing Address, Invoice Date, Total                       |

## Messages observed

| Trigger           | Exact text                                                                 | Where it appears |
| ----------------- | -------------------------------------------------------------------------- | ---------------- |
| Step 2, signed in | Hello PW Autotest, you are already logged in. You can proceed to checkout. | Wizard           |
| Payment checked   | Payment was successful                                                     | Wizard           |
| Order confirmed   | Thanks for your order! Your invoice number is INV-2026000007.              | Wizard           |

## API calls observed

| Action          | Method + endpoint    | Status |
| --------------- | -------------------- | ------ |
| Read the cart   | GET /carts/{id}      | 200    |
| Check payment   | POST /payment/check  | 200    |
| Place the order | POST /invoices       | 201    |
| Delete the cart | DELETE /carts/{id}   | 204    |
| List invoices   | GET /invoices?page=1 | 200    |

## Scenarios

| ID    | Priority | Tag           | Title                                                             | Visual check  |
| ----- | -------- | ------------- | ----------------------------------------------------------------- | ------------- |
| CO-01 | P1       | `@e2e`        | Search, buy by Cash on Delivery, see the invoice in the account   | none          |
| CO-02 | P2       | `@sanity`     | Change the quantity in the cart and see the line and total update | none          |
| CO-03 | P2       | `@sanity`     | Signed out, the wizard asks to sign in and continues after login  | none          |
| CO-04 | P2       | `@sanity`     | The invoice total equals the cart total (UI against API)          | none          |
| CO-05 | P3       | `@regression` | Each other payment method shows its fields and completes          | none          |
| CO-06 | P3       | `@regression` | Billing address needs the lookup fields (empty postal code)       | none          |
| CO-07 | P4       | `@regression` | Quantity 0, negative and very large                               | none          |
| CO-08 | P5       | `@regression` | Cart step structure                                               | aria snapshot |

### CO-01: Search, buy by Cash on Delivery, see the invoice in the account (P1, @e2e)

- Preconditions: signed in as the run user (storage state), empty cart
- Steps:
    1. GIVEN the shopper searches for the product and adds it to the cart
    2. WHEN they go through the cart, sign-in, billing address and payment steps with Cash on Delivery and confirm
    3. THEN the confirmation shows an invoice number, and the account's invoice list shows that number with the cart total
- Data: `PRODUCT_TO_BUY`, `PAYMENT_METHOD` enum
- Cleanup: none; the invoice is the user's own data and the site wipes it hourly
- Evidence screenshots: cart, payment success, confirmation, invoice list

## Code this plan will need

- Page object: extend `pages/app/checkout.page.ts` (steps 2 to 4) and add `pages/app/invoices.page.ts`
- Fixture registration: `invoicesPage`
- Enums: `Messages` (signed-in notice, payment success, order thanks), `AppRoutes.INVOICES`, `PaymentMethods`
- Config constants: none

## Out of scope

Credit card number validation and gift card codes (CO-05 covers whether the fields show).

## Open questions

1. Is guest checkout expected to work, or must the shopper log in? (CO-03 assumes the sign-in step is shown.)
2. Are quantity limits defined (CO-07)?

## Proposal

- Scope: plans/checkout.md; code in the section above is for /codetest
- Confidence: 8 (high)
- Rationale: + the whole happy path walked live; - other payment methods and guest flow not seen
- Unknowns: other payment methods, guest sign-in step
