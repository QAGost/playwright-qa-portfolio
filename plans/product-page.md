# Test plan: Product page

- Route: `/product/<generated id>` (`AppRoutes.PRODUCT` exists; the id changes with the site's
  data resets, so a test always arrives by searching for the product's name)
- Auth: both. Adding to the cart works signed out; favourites need a signed-in user (the run
  user from `.auth/app/appStorageState.json`, loaded with `state-load`).
- Explored: 2026-11-23 with playwright-cli, viewport 1920x1080
- Status: P1 and P2 implemented 2026-11-23 (PP-08 moved to P4, not automated) (open questions 1 to 6 still to answer)
- Part of: the E2E checkout journey (search → **product** → cart → checkout → invoice); this
  plan covers its second step. The cart and checkout steps live on `/checkout` and get their own
  plan.

## Users and what they need

| User                                   | Goal                                                | Must work                                                               |
| -------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| Shopper ready to buy                   | Put this product in the cart, in the right quantity | Add to cart, the cart shows this product, quantity and price            |
| Shopper still deciding                 | Read what the product is before buying              | Name, price, brand, category, description and specifications are shown  |
| Shopper buying several                 | Buy 3 of the same thing, or add it again later      | Quantity controls; adding again increases the quantity, nothing is lost |
| Shopper who reloads or clicks twice    | Not lose or double-count what they added            | Cart survives a reload; a double-click does what the badge says         |
| Shopper with an old bookmark or link   | Get back to a product they saw earlier              | A clear message when the product no longer exists                       |
| Signed-in customer                     | Keep a product for later                            | Add to favourites; a clear message if it is already there               |
| Signed-out visitor pressing Favourites | Understand what to do                               | A message, and nothing saved                                            |
| Keyboard and assistive-tech user       | Buy without a mouse                                 | Controls reachable and named; Enter on Add to cart works                |
| Shopper comparing                      | Look at similar products                            | Related products shown and open                                         |

## Critical workflows (explored live)

| Workflow                                 | Observed                                                                                                                                                 | Verdict                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Open a product from search               | `/product/<id>`: name (h1), category and brand badges, price, CO₂ rating, description, quantity, three buttons, specifications table, related products   | Works (PP-01)                 |
| Add to cart, quantity 1, signed out      | Toast "Product added to shopping cart."; cart link shows 1; `/checkout` lists the product, quantity 1, price and total                                   | Works (PP-02)                 |
| Increase quantity, then add (3)          | Cart count 1 → 4 (adds up); `/checkout` shows quantity 4, line price $56.60 = 4 × $14.15                                                                 | Works (PP-03, PP-04)          |
| Reload the cart page                     | Cart unchanged (cart id kept in the tab's session storage)                                                                                               | Works (PP-05)                 |
| **Double-click Add to cart** (first add) | Two `POST /carts` (two carts created); badge shows **2**, but `/checkout` shows quantity **1**, total $14.15; seen signed out and signed in              | **Likely defect** (PP-06, Q1) |
| Quantity: 0, -3, "abc"                   | Box resets to 1; "-" at 1 stays 1                                                                                                                        | Works (PP-11)                 |
| Quantity: 2.5, 99999                     | 2.5 → 2; 99999 → 99                                                                                                                                      | Observed, undocumented (Q4)   |
| Add to favourites, signed out            | Toast "Unauthorized, can not add product to your favorite list."; `POST /favorites` 401; nothing saved                                                   | Works, blunt wording (PP-07)  |
| Add to favourites, signed in             | Toast "Product added to your favorites list." (201); listed on `/account/favorites`                                                                      | Works (PP-09)                 |
| Add the same favourite again             | Toast "Product already in your favorites list." (409)                                                                                                    | Works (PP-10)                 |
| **Open `/product/<unknown id>`**         | `GET /products/<id>` 404 and `GET /products/<id>/related` **500**; the page is **blank** except an empty "Related products" heading; no "not found" text | **Likely defect** (PP-08, Q2) |
| Open the cart in a **second tab**        | The new tab has **no cart** (the cart id lives in per-tab session storage); the first tab still has it                                                   | Gap (Q3)                      |
| Compare                                  | No toast and nothing visible changes                                                                                                                     | Unclear (Q5)                  |
| Delete a favourite (account page)        | The delete button has **no accessible name** (icon only)                                                                                                 | Accessibility finding (Q6)    |
| Related product                          | Four related products (same category in the sample) with image and name; each links to its own product page                                              | Works (PP-12)                 |

## Page summary

The product page shows one product: photo, name, category and brand, price, CO₂ rating,
description, a quantity control, three buttons (Add to cart, Add to favourites, Compare), a
specifications table and a row of related products. Adding to the cart creates an anonymous
cart on first use (`POST /carts`) and then adds the line (`POST /carts/<id>`); the cart link in
the header shows the item count. Favourites need a signed-in user.

## Element inventory

| Element                  | Proposed locator (verified live)                                                        | Notes                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Product name             | `getByRole('heading', { level: 1 })`                                                    | exists in `ProductPage.productName`; `data-test="product-name"` (h1 here, h5 on cards) |
| Unit price               | `getByTestId('unit-price')`                                                             | exists; element holds the number only ("14.15"), the `$` sits outside                  |
| Category, brand          | `getByLabel('category')`, `getByLabel('brand')`                                         | `aria-label` on the badges; to confirm unique in `/codetest`                           |
| Description              | `getByTestId('product-description')`                                                    | paragraph, no role                                                                     |
| CO₂ rating               | `getByTestId('co2-rating-badge')`                                                       | named "A = most environmentally friendly, E = higher environmental impact"             |
| Quantity box             | `getByRole('spinbutton', { name: 'Quantity' })`                                         | `data-test="quantity"`; starts at 1                                                    |
| Quantity buttons         | `getByRole('button', { name: 'Increase quantity' })`, `{ name: 'Decrease quantity' }`   | `increase-quantity`, `decrease-quantity`                                               |
| Add to cart              | `getByRole('button', { name: 'Add to cart' })`                                          | `data-test="add-to-cart"`                                                              |
| Add to favourites        | `getByRole('button', { name: 'Add to favourites' })`                                    | `data-test="add-to-favorites"` (note the spelling difference)                          |
| Compare                  | `getByRole('button', { name: 'Compare' })`                                              | `data-test="add-to-compare"`                                                           |
| Specifications           | `getByRole('table')`, rows `getByRole('row')`, cells `getByRole('cell')`                | `product-specs`, `spec-row`, `spec-name`, `spec-value`                                 |
| Related products         | heading `getByRole('heading', { name: 'Related products', level: 2 })`; cards are links | card name is an h5; filter links by `has` heading, never by `/product/<id>`            |
| Toast                    | `getByText(Messages.…)`                                                                 | no role; disappears after about 2 seconds, so assert straight after the action         |
| Cart link and count      | `getByRole('link', { name: 'cart' })`, count `getByTestId('cart-quantity')`             | in the header (`nav-cart`); the count is the **sum of quantities**; absent while empty |
| Cart lines (`/checkout`) | `getByTestId('product-title')`, `product-quantity` (input), `line-price`, `cart-total`  | belongs to the checkout plan; PP-02 reads it                                           |
| Favourites page          | `/account/favorites`: cards by `getByTestId('product-name')`; delete button unnamed     | PP-09 cleans up through the API instead                                                |

The CLI's `getByTestId` did not match `data-test` during exploration (the CLI uses its own
default attribute); Playwright in the suite is configured for `data-test`, so these are
confirmed by `/codetest`, not assumed.

## Messages observed

| Trigger                                | Exact text                                                 | Where it appears   |
| -------------------------------------- | ---------------------------------------------------------- | ------------------ |
| Add to cart                            | `Product added to shopping cart.`                          | Toast, about 2 s   |
| Add to favourites, signed out          | `Unauthorized, can not add product to your favorite list.` | Toast              |
| Add to favourites, signed in           | `Product added to your favorites list.`                    | Toast              |
| Add to favourites, already a favourite | `Product already in your favorites list.`                  | Toast              |
| Favourites page, none saved            | `You have no favorites yet. …` (start only; not planned)   | Account favourites |

## API calls observed

| Action                     | Method + endpoint                                   | Status             |
| -------------------------- | --------------------------------------------------- | ------------------ |
| Open a product             | `GET /products/<id>`, `GET /products/<id>/related`  | 200, 200           |
| Open an unknown id         | `GET /products/<id>`, `GET /products/<id>/related`  | **404, 500**       |
| Add to cart (first add)    | `POST /carts`, then `POST /carts/<cart id>`         | 201, 200           |
| Double-click, first add    | two `POST /carts`, then two `POST /carts/<cart id>` | 201, 201, 200, 200 |
| Favourite, signed out      | `POST /favorites`                                   | 401                |
| Favourite, signed in       | `POST /favorites`; again                            | 201; 409           |
| List and delete favourites | `GET /favorites`; `DELETE /favorites/<id>`          | 200; 204           |

Cart ids are anonymous and server-side only: nothing in a cart needs cleanup. Favourites belong
to the run user and are removed through the API (`GET` then `DELETE`) in `afterEach`.

## Scenarios

| ID    | Priority | Tag           | User workflow                                                                                                  | Visual check          | Status                    |
| ----- | -------- | ------------- | -------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------- |
| PP-01 | P1       | `@smoke`      | Shopper sees the product's details (name, price, brand, category, description, specifications)                 | none                  | implemented               |
| PP-02 | P1       | `@smoke`      | Shopper adds the product to the cart and finds it there                                                        | none                  | implemented (E2E step)    |
| PP-18 | P1       | `@smoke`      | The product page shows the same details as the API (name, price, category, brand, description, specifications) | none                  | implemented               |
| PP-03 | P2       | `@sanity`     | Shopper adds several: quantity 3 gives a line of 3 at 3 × the price                                            | none                  | implemented               |
| PP-04 | P2       | `@sanity`     | Adding the same product again adds to the quantity                                                             | none                  | implemented               |
| PP-05 | P2       | `@sanity`     | The cart survives a reload                                                                                     | none                  | implemented               |
| PP-06 | P2       | `@sanity`     | A double-click on Add to cart leaves the cart matching the badge                                               | none                  | known defect (Q1)         |
| PP-07 | P2       | `@sanity`     | Signed-out visitor pressing Favourites gets a message and nothing saved                                        | none                  | implemented               |
| PP-08 | P2       | `@sanity`     | A product id that does not exist shows a clear "not found" page                                                | none                  | not automated (edge case) |
| PP-09 | P3       | `@regression` | Signed-in customer adds a favourite and finds it on the account page                                           | none                  | planned                   |
| PP-10 | P3       | `@regression` | Adding the same favourite twice says it is already there                                                       | none                  | planned                   |
| PP-11 | P3       | `@regression` | The quantity box never goes below 1 (0, negative and text become 1)                                            | none                  | planned                   |
| PP-12 | P3       | `@regression` | A related product opens its own, different product page                                                        | none                  | planned                   |
| PP-13 | P3       | `@regression` | Keyboard user adds to the cart with Tab and Enter                                                              | none                  | planned                   |
| PP-14 | P4       | `@regression` | A product added in one tab is still in the cart in a new tab                                                   | none                  | not automated (Q3)        |
| PP-15 | P4       | `@regression` | Compare gives visible feedback                                                                                 | none                  | not automated (Q5)        |
| PP-16 | P4       | `@regression` | Quantity maximum (99) and decimals                                                                             | none                  | not automated (Q4)        |
| PP-17 | P5       | `@regression` | Purchase controls accessibility structure                                                                      | `toMatchAriaSnapshot` | planned                   |

All scenarios open the product by searching for a curated product **name** (never an id) and
run signed out, except PP-09 and PP-10 (run user). The cart is anonymous per browser tab, so
every test starts with a fresh cart without any cleanup. PP-09 and PP-10 revert their own
favourites; they mutate only the run user's own data, so they are `@regression`, not
`@destructive`.

### PP-01: Shopper sees the product's details (P1, `@smoke`)

- Preconditions: signed out, on `/`.
- Steps (Given / When / Then):
    1. GIVEN the shopper searched for a curated product name and opened that product
    2. WHEN the product page has loaded
    3. THEN name, price, category, brand, description and at least one specification row are
       shown, with the three action buttons
- Expected: h1 equals the name opened; price element holds a number; category and brand are not
  empty; description is not empty; the specifications table has one or more rows; "Add to cart",
  "Add to favourites" and "Compare" are visible. No exact descriptions or prices are hardcoded.
- Data: curated product name in `test-data/static/app/` (extend `search-terms.ts`).
- Cleanup: none: read-only.
- Visual: none.
- Evidence screenshots: the product page.

### PP-02: Shopper adds the product to the cart and finds it there (P1, `@smoke`)

- Preconditions: signed out, product page open (fresh tab, empty cart).
- Steps (Given / When / Then):
    1. GIVEN the shopper is on a product page and the cart link shows no count
    2. WHEN they click "Add to cart"
    3. THEN the toast "Product added to shopping cart." shows and the cart count is 1; opening
       the cart lists this product once, with quantity 1 and the unit price as the total
- Expected: `Product added to shopping cart.`; `cart-quantity` = 1; on `/checkout`
  `product-title` equals the name, `product-quantity` = 1, `line-price` and `cart-total` equal
  the unit price read from the product page.
- Data: curated product name.
- Cleanup: none (anonymous cart).
- Visual: none.
- Evidence screenshots: the toast; the cart.

### PP-18: The product page shows the same details as the API (P1, `@smoke`)

- Added 2026-11-23 at the reviewer's request: compare what the UI shows with what the backend
  holds, so a rendering, rounding or field-mapping mistake is caught.
- Steps: GIVEN the product on screen is read through `GET /products/<id>` (the id comes from
  the address; the response is validated against a strict schema built from the contract);
  THEN the page shows the same name, price (to two decimals), category, brand and description;
  AND the specification names match the API's `specs`, in the same order.
- Contract note: `ProductResponse` does not document the `specs` array that the live response
  contains (`OBSERVED`, recorded in `productSchema.ts`); `brand` has no `slug` live.
- The API and the UI share one backend, so this proves the UI is faithful to what the backend
  returns, not that the backend is right.
- Data: curated product name; no hardcoded values from the API.
- Cleanup: none: read-only.

### PP-03: Quantity 3 gives a line of 3 at 3 × the price (P2, `@sanity`)

- Steps: GIVEN the product page is open; WHEN the shopper presses "Increase quantity" twice and
  adds to cart; THEN the box reads 3, the cart count is 3, and on `/checkout` the line quantity
  is 3 and `line-price` equals 3 × the unit price (computed in the test from the page's price,
  rounded to cents).
- Data: curated product name.

### PP-04: Adding the same product again adds to the quantity (P2, `@sanity`)

- Steps: GIVEN one unit is in the cart; WHEN the shopper adds it again; THEN the count is 2 and
  the cart has one line with quantity 2 (not two lines).
- Observed: 1 + 3 gave one line with quantity 4.

### PP-05: The cart survives a reload (P2, `@sanity`)

- Steps: GIVEN a product is in the cart; WHEN the shopper reloads the page; THEN the cart link
  still shows the same count and `/checkout` the same line.

### PP-06: A double-click on Add to cart leaves the cart matching the badge (P2, `@sanity`)

- **Known defect** (observed 2026-11-23, signed out and signed in; Open question 1).
- Steps: GIVEN a fresh tab with an empty cart; WHEN the shopper double-clicks "Add to cart";
  THEN the cart count equals the quantity of the line on `/checkout`.
- Observed: badge 2, `/checkout` quantity 1, total $14.15; two carts were created.
- If confirmed: written with the correct expectation and marked `test.fail()` with a `// BUG:`
  line, and a bug report is drafted alongside the login double-click report.

### PP-07: Signed-out visitor pressing Favourites gets a message (P2, `@sanity`)

- Steps: GIVEN a signed-out visitor on a product page; WHEN they press "Add to favourites";
  THEN the toast `Unauthorized, can not add product to your favorite list.` shows and
  `POST /favorites` answered 401.
- Cleanup: none: nothing saved.

### PP-08: A product id that does not exist shows a clear "not found" page (P4, `@regression`)

- **Edge case, not automated** (decided 2026-11-23): a shopper cannot reach an unknown id by clicking, only through a stale link or a typo. Recorded as a Low finding; no expected message is defined.
- Observed: blank page with an empty "Related products" heading; `GET /products/<id>` 404 and
  `GET /products/<id>/related` 500.
- Data: a random 26-character id from a factory (never a real product id).

### PP-09: Signed-in customer adds a favourite and finds it (P3, `@regression`)

- Preconditions: run user signed in (storage state).
- Steps: GIVEN the customer is on a product page; WHEN they press "Add to favourites"; THEN the
  toast `Product added to your favorites list.` shows and the product is listed on
  `/account/favorites`.
- Cleanup: `afterEach` reads `GET /favorites` and removes it with `DELETE /favorites/<id>`
  (the account page's own delete button has no accessible name, so the API is the safer path).

### PP-10: Adding the same favourite twice says it is already there (P3, `@regression`)

- Steps: GIVEN the product is already a favourite; WHEN the customer presses the button again;
  THEN the toast `Product already in your favorites list.` shows (API 409).
- Cleanup: as PP-09.

### PP-11: The quantity box never goes below 1 (P3, `@regression`)

- Steps: for each of `0`, `-3`, `abc` (static set in `test-data/static/util/invalid-values.ts`
  or `search-terms.ts`, a `for...of` loop): WHEN typed into the box; THEN the box reads 1.
  And "Decrease quantity" at 1 stays 1.
- The upper limit (99) and decimals stay out (Open question 4).

### PP-12: A related product opens its own, different product page (P3, `@regression`)

- Steps: GIVEN a product page with related products; WHEN the shopper opens the first one; THEN
  the URL is a `/product/<id>` page and its h1 is a different name.
- No related product names are hardcoded.

### PP-13: Keyboard user adds to the cart with Tab and Enter (P3, `@regression`)

- Steps: GIVEN focus is on the quantity box; WHEN the user tabs to "Add to cart" and presses
  Enter; THEN the toast and the cart count 1 appear as with a click.

### PP-17: Purchase controls accessibility structure (P5, `@regression`)

- Visual: `toMatchAriaSnapshot` of the quantity and button group, name `purchase-controls.aria.yml`:
  button "Decrease quantity", spinbutton "Quantity", button "Increase quantity", buttons "Add to
  cart", "Add to favourites" and "Compare". The product name, price and description are not part
  of the snapshot (they change with the data).
- Created with `--update-snapshots=missing` and read before it is accepted.

## Code this plan will need

- Page objects: `pages/app/product.page.ts` exists (`productName`, `unitPrice`); extend it with
  category, brand, description, specifications, quantity box and buttons, related products,
  toast and the actions `addToCart()`, `setQuantity(n)`, `increaseQuantity()`,
  `addToFavourites()`. The header cart link and count go into
  `pages/components/navigation.component.ts` (`cartLink`, `cartQuantity`). New minimal
  `pages/app/checkout.page.ts` (cart lines: title, quantity, line price, total), which the
  checkout plan extends; new minimal favourites list locators for PP-09.
- Fixture registration: `checkoutPage` (and `favouritesPage` if it is a separate object).
- Enums: `AppRoutes.CHECKOUT = '/checkout'`, `AppRoutes.FAVORITES = '/account/favorites'`;
  `ApiEndpoints.FAVORITES = '/favorites'`, `ApiEndpoints.PRODUCTS = '/products'`;
  `Messages` for the four toasts above.
- Static data: a curated product name (`Combination Pliers`) in
  `test-data/static/app/search-terms.ts`; invalid quantities (`0`, `-3`, `abc`) in
  `test-data/static/util/invalid-values.ts`.
- Factories: random unknown product id (`faker.string.alphanumeric`) for PP-08.
- Schemas: `fixtures/api/schemas/app/productSchema.ts` (product, built from `ProductResponse`);
  the favourites list response for the PP-09 cleanup (`z.strictObject`, built from the
  OpenAPI document, which `/codetest` re-reads first).
- Config: none.

## Out of scope

- Checkout, payment and invoice: the checkout plan.
- Pixel screenshots of the product page: the photo and description change with the data and
  would need heavy masking for little value; the aria snapshot covers the structure.
- The language switcher and the chat and "live activity" buttons: separate features.
- Compare (Open question 5) and the favourites page itself beyond PP-09.

## Open questions

1. **Double-click on Add to cart** shows 2 but the cart holds 1 (two carts are created). Defect?
   Recommended: yes, PP-06 as a known-defect test and a second bug report (sibling of the login
   double-click report).
2. **Unknown product id** shows a blank page (404 plus a 500 on the related call). What should a
   shopper see? Recommended: a defect, but PP-08 stays blocked until you say what the expected
   message is; meanwhile it goes into the findings.
3. **Cart lives in the tab** (a new tab starts empty). Intended? Recommended: record as a UX
   finding; do not automate (PP-14).
4. **Quantity limits**: 0, negative and text become 1 (sensible, automated as PP-11); 99999
   becomes 99 and 2.5 becomes 2 are observed but nowhere documented. Recommended: do not
   automate those two until a requirement exists.
5. **Compare** shows no feedback. What does it do? Recommended: record, do not automate.
6. **Accessibility**: the favourites page's delete button has no accessible name. Record as a
   finding? Recommended: yes.

## Proposal

- Scope: `plans/product-page.md` only; code in the section above is for /codetest
- Confidence: 7 (medium)
- Rationale:
    - +: every locator, message and API call was seen live, signed out and signed in.
    - +: the cart is anonymous and per tab, so most tests need no cleanup; favourites are cleaned
      up through the API.
    - +: two likely defects found with evidence (double-click cart mismatch, blank unknown id).
    - -: test ids could not be confirmed through the CLI (it uses another default attribute);
      `/codetest` confirms them in the suite's configuration first.
    - -: PP-08 depends on a decision about the expected "not found" behaviour.
- Unknowns: Open questions 1 to 6. P1 (PP-01, PP-02) is unblocked.
