# Test plan: Product search

- Route: `/` (the home page holds search, sort, filters and the product grid; would be
  `AppRoutes.HOME`)
- Auth: none. Search behaves the same signed out; explored signed out.
- Explored: 2026-11-22 with playwright-cli, viewport 1920x1080
- Status: Reviewed 2026-11-23; P1 implemented, P2 next
- Part of: the E2E checkout journey (search → product → cart → checkout → invoice); this plan
  covers its first step.

## Users and what they need

| User                                         | Goal                                              | Must work                                                           |
| -------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| Shopper who knows what they want             | Find a product by name and open it                | Search by name, results relevant, product opens                     |
| Shopper comparing options                    | Look at several results in turn                   | Open a result, come back, open the next one without searching again |
| Shopper who types loosely                    | Find things despite capitals, spaces, half a word | Case-insensitive, trimmed, partial matches                          |
| Shopper with a typo or a product not stocked | Understand there is no match                      | A clear "nothing found" message and a way back                      |
| Bargain hunter                               | Cheapest suitable product                         | Sort results by price without the result set changing               |
| Keyboard and assistive-tech user             | Search without a mouse                            | Enter submits; controls have meaningful names                       |
| Anyone typing HTML or script into the box    | Nothing (or an attacker)                          | Input is shown as text, never executed                              |

## Critical workflows (explored live)

| Workflow                                                | Observed                                                                                                     | Verdict                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Search "drill" (button)                                 | Caption "Searched for: drill", "4 products found for 'drill'", 4 cordless drills                             | Works (PS-01)                          |
| Search with Enter                                       | Same as the button                                                                                           | Works (PS-06)                          |
| Open a result                                           | Product page `/product/<generated id>`                                                                       | Works (PS-02)                          |
| Capitals ("DRILL"), spaces (" drill "), partial ("dri") | 4, 4 and 6 results; same drills for the first two                                                            | Works (PS-05, PS-11)                   |
| No match ("xyzzyqq")                                    | "0 products found for 'xyzzyqq'" and "There are no products found."                                          | Works (PS-03)                          |
| Reset with "X"                                          | Box and caption cleared, default 9-product grid back                                                         | Works (PS-04)                          |
| HTML in the box (`<b>bold</b>`)                         | Shown as text in the caption, no element created                                                             | Works (PS-16)                          |
| Open a result, then Back                                | **Search lost**: unfiltered home page                                                                        | Gap or defect, Open question 1 (PS-07) |
| Search "hammer", then sort by price                     | **6 results become 7** ("Sledgehammer" appears)                                                              | Likely defect, Open question 2 (PS-08) |
| Home page on load                                       | Price filter preset to 1-100: **5 of 50 products hidden** (all over $100, e.g. "Cordless Drill 20V" $125.23) | Gap, Open question 3                   |
| Search results vs the price slider                      | Results include $125.23 and $119.24 while the slider still shows 1-100                                       | Inconsistency, Open question 3 (PS-12) |
| Search "s" or "sa"                                      | **Nothing happens**: no request, no message; minimum is 3 characters, nowhere stated                         | Gap, Open question 4 (PS-14)           |
| Empty search                                            | Nothing happens; the previous results stay under an empty box                                                | Gap, Open question 4 (PS-15)           |
| After a search                                          | **The box empties itself**; refining the query means retyping it                                             | Gap, Open question 4 (PS-17)           |
| Reload after a search; share the URL                    | Search lost; the URL stays `/`                                                                               | Gap, Open question 4 (PS-18)           |
| Search plus category "Hand Saw" ("hammer")              | 0 results (filters combine with AND)                                                                         | Works (PS-09)                          |
| More than 9 search results                              | Not producible: no 3-letter term found with more than 8 whole-word hits                                      | Untestable with current data           |

## Page summary

The home page lists products in a 9-per-page grid with a left-hand panel: Sort (a select),
Price Range (a two-handle slider, preset to 1-100), Search (box, "X" reset, Search button), and
filters by category, brand and eco-friendliness. Submitting a search replaces the grid with
whole-word matches and shows a caption and a result count. Sorting or filtering afterwards
re-queries a different endpoint with part-of-word matching.

## Element inventory

| Element                   | Proposed locator (verified live)                                                      | Notes                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Search box                | `getByRole('textbox', { name: 'Search' })`                                            | `data-test="search-query"`, placeholder "Search", no `required`, no `minlength`             |
| Search button             | `getByRole('button', { name: 'Search', exact: true })`                                | `data-test="search-submit"`, `type="submit"`                                                |
| Reset button              | `getByRole('button', { name: 'X' })`                                                  | `data-test="search-reset"`; accessible name is just "X" (a11y finding)                      |
| Search caption            | `getByRole('heading', { name: /^Searched for:/ })`                                    | `data-test="search-caption"`, level 3; term in `data-test="search-term"`                    |
| Result count              | `getByTestId('search-result-count')`                                                  | No role; text "`<n>` products found for '`<term>`'"                                         |
| No-results message        | `getByText(Messages.NO_PRODUCTS_FOUND)`                                               | No `data-test`                                                                              |
| Search finished marker    | `getByTestId('search_completed')`                                                     | Present after a search; a reliable wait target                                              |
| Sort                      | `getByRole('combobox', { name: 'sort' })`                                             | `data-test="sort"`; options Name A-Z/Z-A, Price High-Low/Low-High, CO₂ Rating A-E/E-A       |
| Price slider handles      | `getByRole('slider', { name: 'ngx-slider' })`, `{ name: 'ngx-slider-max' }`           | Names are the library defaults (a11y finding); range 0-200, preset 1-100                    |
| Category filter           | `getByRole('checkbox', { name: '<category>' })`                                       | e.g. "Hand Saw", "Hammer"; nested under "Hand Tools", "Power Tools", "Other"                |
| Eco filter                | `getByRole('checkbox', { name: 'Show only eco-friendly products' })`                  | `data-test="eco-friendly-filter"`                                                           |
| Product names in the grid | `getByTestId('product-name')`                                                         | `h5`; role alternative `getByRole('heading', { level: 5 })` not verified unique on the page |
| Product card (link)       | `getByRole('link').filter({ has: page.getByRole('heading', { name, exact: true }) })` | `data-test="product-<generated id>"`: id changes with the data, never use it                |
| Product price             | `getByTestId('product-price')`                                                        | No role; text like "$14.15"                                                                 |
| Compare button            | `getByRole('button', { name: 'Compare' })`                                            | `data-test="compare-btn"`; one per card                                                     |
| Pagination                | `getByRole('button', { name: 'Page-2' })`, `{ name: 'Next' }`                         | `data-test="pagination-next"` on Next                                                       |

## Messages observed

| Trigger              | Exact text                        | Where it appears                                         |
| -------------------- | --------------------------------- | -------------------------------------------------------- |
| Any search           | `Searched for: <term>`            | Heading above the grid                                   |
| Any search           | `<n> products found for '<term>'` | Under the caption; term echoed as typed, spaces included |
| Search with no match | `There are no products found.`    | In place of the grid                                     |

## API calls observed

| Action                                  | Method + endpoint                                                                                                                       | Status |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Page load                               | `QUERY /products` `{"page":"1","between":"price,1,100","is_rental":"false"}`; `GET /brands`, `/categories/tree`, `/product-specs/names` | 200    |
| Submit a search                         | `QUERY /products/search` `{"q":"<term>"}` (whole-word match)                                                                            | 200    |
| Sort or filter after a search           | `QUERY /products` `{"page":"0","q":"<term>","sort":"price,asc","between":"price,1,100","is_rental":"false"}` (part-of-word match)       | 200    |
| Reset with "X"                          | `QUERY /products` `{"page":"0","between":"price,1,100","is_rental":"false"}` (`page` 0, not 1)                                          | 200    |
| Search under 3 characters, empty search | none                                                                                                                                    |        |

## Scenarios

| ID    | Priority | Tag           | User workflow                                                     | Visual check          | Status                  |
| ----- | -------- | ------------- | ----------------------------------------------------------------- | --------------------- | ----------------------- |
| PS-01 | P1       | `@smoke`      | Shopper searches by product name and sees only matching products  | none                  | implemented             |
| PS-02 | P1       | `@smoke`      | Shopper opens a search result and lands on that product           | none                  | implemented (E2E entry) |
| PS-03 | P2       | `@sanity`     | Shopper with no match sees a clear "nothing found" message        | none                  | planned                 |
| PS-04 | P2       | `@sanity`     | Shopper resets the search and gets the full catalogue back        | none                  | planned                 |
| PS-05 | P2       | `@sanity`     | Capitals and surrounding spaces find the same products            | none                  | planned                 |
| PS-06 | P2       | `@sanity`     | Keyboard user searches with Enter                                 | none                  | planned                 |
| PS-07 | P2       | `@sanity`     | Shopper opens a result, presses Back and still sees their results | none                  | known defect (Q1)       |
| PS-16 | P2       | `@sanity`     | HTML typed into the search is shown as text, not executed         | none                  | planned                 |
| PS-08 | P3       | `@regression` | Sorting search results keeps the same set of products             | none                  | known defect (Q2)       |
| PS-09 | P3       | `@regression` | Search combined with a category filter narrows the results        | none                  | planned                 |
| PS-10 | P3       | `@regression` | Sorting search results by price orders them low to high           | none                  | planned                 |
| PS-11 | P3       | `@regression` | Part of a word finds the products that contain it                 | none                  | planned                 |
| PS-12 | P4       | `@regression` | Search results respect the price range shown on screen            | none                  | blocked (Q3)            |
| PS-14 | P4       | `@regression` | A search that is too short tells the user why nothing happened    | none                  | not automated (Q4)      |
| PS-15 | P4       | `@regression` | An empty search does not leave stale results under an empty box   | none                  | not automated (Q4)      |
| PS-17 | P4       | `@regression` | The search box keeps the term after searching, for refining       | none                  | not automated (Q4)      |
| PS-18 | P4       | `@regression` | A search survives a reload                                        | none                  | not automated (Q4)      |
| PS-19 | P5       | `@regression` | Search panel accessibility structure                              | `toMatchAriaSnapshot` | planned                 |
| PS-20 | P5       | `@regression` | No-results state                                                  | `toHaveScreenshot`    | planned                 |

All scenarios run signed out (`resetStorageState()` and opening `/` in `beforeEach`) and read
only. None mutates shared state, so none is `@destructive`. The catalogue is reseeded with the
site's data resets, so tests identify products by **name**, never by id.

### PS-01: Shopper searches by product name and sees only matching products (P1, `@smoke`)

- Preconditions: signed out, on `/`.
- Steps (Given / When / Then):
    1. GIVEN the home page is open
    2. WHEN the shopper searches for a product name from the curated set (e.g. "drill")
    3. THEN the caption shows the term, at least one product is listed, every product name
       contains the term (case-insensitive), and the count message matches the number of cards
- Expected: heading "Searched for: drill"; `search-result-count` reads
  "`<n>` products found for 'drill'" where `<n>` is the number of `product-name` elements and
  `<n>` > 0; every name matches `/drill/i`. The exact count is not hardcoded: the catalogue can
  change, the relationship between count and cards cannot.
- Data: a curated static set of search terms in `test-data/static/app/` (catalogue terms, not
  test-created content).
- Cleanup: none: read-only.
- Visual: none.
- Evidence screenshots: the results.

### PS-02: Shopper opens a search result and lands on that product (P1, `@smoke`)

- Preconditions: signed out, on `/`.
- Steps (Given / When / Then):
    1. GIVEN the shopper searched for "drill"
    2. WHEN they open the first result
    3. THEN the product page shows that product's name and price
- Expected: URL matches `/product/<id>` (id read from the page, never hardcoded); the product
  page shows the same name and price as the card. The product page's own locators come from its
  `/page` run (the next plan of the journey).
- Data: curated term.
- Cleanup: none.
- Visual: none.
- Evidence screenshots: the product page.

### PS-03: Shopper with no match sees a clear "nothing found" message (P2, `@sanity`)

- Steps: GIVEN `/` is open; WHEN the shopper searches for a random 10-letter string; THEN the
  count reads "0 products found for '`<term>`'", "There are no products found." is visible, and
  no product cards are shown.
- Data: random letters from a factory (`faker.string.alpha`), so the term is never a product.
- Cleanup: none.

### PS-04: Shopper resets the search and gets the full catalogue back (P2, `@sanity`)

- Steps: GIVEN a search for "pliers" is showing; WHEN the shopper clicks "X"; THEN the box is
  empty, the caption and count are gone, and the default grid (9 cards, pagination visible) is
  back.
- Cleanup: none.

### PS-05: Capitals and surrounding spaces find the same products (P2, `@sanity`)

- Steps: GIVEN `/` is open; WHEN the shopper searches "drill", then "DRILL", then " drill "
  (resetting in between); THEN all three show the same product names.
- Expected: identical name lists (order included). Observed live: 4, 4 and 4.
- Data: a curated term plus its upper-case and padded variants, derived in the test.

### PS-06: Keyboard user searches with Enter (P2, `@sanity`)

- Steps: GIVEN focus is in the search box; WHEN the shopper types a term and presses Enter;
  THEN results appear exactly as with the button.
- Expected: caption and count as in PS-01.

### PS-07: Shopper opens a result, presses Back and still sees their results (P2, `@sanity`)

- **Blocked** by Open question 1.
- Observed live: after Back the page shows the unfiltered home grid; the search is gone.
- If confirmed as a defect: written with the correct expectation (the same caption and names
  after Back) and marked `test.fail()` with a `// BUG:` line.

### PS-16: HTML typed into the search is shown as text, not executed (P2, `@sanity`)

- Steps: GIVEN `/` is open; WHEN the shopper searches for `<b>bold</b>`; THEN the caption shows
  the literal text `<b>bold</b>` and contains no `b` element.
- Expected: `search-term` has text `<b>bold</b>`; `search-term` locator `.locator('b')` count 0
  is the one CSS use, justified as asserting the absence of injected markup (needs your approval
  per the `selectors` rules), or `toHaveText` plus an accessibility-tree check without CSS.
- Data: a static set of harmless markup probes in `test-data/static/util/`.

### PS-08: Sorting search results keeps the same set of products (P3, `@regression`)

- **Blocked** by Open question 2.
- Observed live: "hammer" gives 6 products via `QUERY /products/search` (whole words); sorting
  re-queries `QUERY /products` (part of words) and gives 7, adding "Sledgehammer".
- If confirmed as a defect: expectation "same set of names before and after sorting",
  `test.fail()` + `// BUG:`; a bug report like the login one.

### PS-09: Search combined with a category filter narrows the results (P3, `@regression`)

- Steps: GIVEN a search for "hammer"; WHEN the shopper ticks the "Hand Saw" category; THEN the
  count reads "0 products found for 'hammer'" and no cards show (observed live). A positive
  pair (term and matching category) is to be confirmed during implementation.

### PS-10: Sorting search results by price orders them low to high (P3, `@regression`)

- Steps: GIVEN a search for "hammer"; WHEN "Price (Low - High)" is selected; THEN the prices
  read from `product-price` are in ascending order.
- Note: asserts the order only, not the set (PS-08 covers the set).

### PS-11: Part of a word finds the products that contain it (P3, `@regression`)

- Steps: search "dri"; every product name matches `/dri/i` and the result includes every
  product found for "drill" (observed: 6 results containing the 4 drills).

### PS-12: Search results respect the price range shown on screen (P4, `@regression`)

- **Blocked** by Open question 3. Observed: results up to $125.23 while the slider reads 1-100.

### PS-14, PS-15, PS-17, PS-18: Search usability gaps (P4, `@regression`)

- **Blocked** by Open question 4. Observed: under 3 characters and empty searches do nothing
  without feedback (no request); the box empties after each search; reload and shared URLs lose
  the search (URL stays `/`).

### PS-19: Search panel accessibility structure (P5, `@regression`)

- Expected: `toMatchAriaSnapshot({ name: 'search-panel.aria.yml' })` on the search area: the
  "Search" heading, textbox "Search", button "X", button "Search". The snapshot records the
  poor "X" name as found; generated from the live app, never hand-written.

### PS-20: No-results state (P5, `@regression`)

- Expected: `toHaveScreenshot('search-no-results.png')` of the results column after a search
  with no match (caption, count and message only; no product images, nothing dynamic except the
  echoed random term, which is masked). Windows baseline for now (`-win32`).

## Code this plan will need

- Page object: new `pages/app/home.page.ts` (`HomePage`: search box, buttons, caption, count,
  no-results message, sort, category checkboxes, product names, prices, cards; actions
  `openHomePage()`, `search(term)`, `searchWithEnter(term)`, `resetSearch()`,
  `sortBy(option)`, `openProduct(name)`, and a wait on `search_completed`), registered as a
  fixture. `AppPage.openHomePage()` exists; it moves or delegates to `HomePage`.
- Enums: `AppRoutes.HOME = '/'`, `AppRoutes.PRODUCT = '/product'`;
  `Messages.NO_PRODUCTS_FOUND = 'There are no products found.'`; sort option labels.
- The count message "`<n>` products found for '`<term>`'" is a template: a small function in
  the page object (or `helpers/`) builds the expected text from `<n>` and the term.
- Static data: `test-data/static/app/search-terms.ts` (curated catalogue terms and their
  part-word variants, `as const`); markup probes for PS-16.
- Factories: random no-match terms (`faker.string.alpha`).

## Out of scope

- **The product page itself**: its own `/page` run, the next step of the checkout journey.
- **Brand, eco and price-range filters on their own, and the Compare feature**: a separate
  filters plan; only search-related behaviour is planned here.
- **Pagination of search results**: not producible with the current catalogue (whole-word
  search returns at most 8 for any term tried).
- **Rentals** (`is_rental`), the language switcher and the Categories menu in the nav.
- **Search over the API alone** (`/products/search`): belongs in an API products plan; the
  endpoint inconsistency is recorded here because users see it.

## Open questions

None open. Resolved 2026-11-23 (reviewer: "go with your recommendations"):

1. **Back from a product loses the search**: a defect. PS-07 becomes a known-defect test
   (`test.fail()` with a `// BUG:` line) and gets a bug report.
2. **Sorting changes the result set**: a defect. PS-08 becomes a known-defect test and gets a
   bug report.
3. **Hidden expensive products and the slider mismatch**: recorded as UX findings. PS-12 stays
   blocked until the intended behaviour is known.
4. **Search usability gaps**: recorded as UX findings; PS-14, PS-15, PS-17 and PS-18 are not
   automated until a requirement exists.
5. **PS-16 markup check**: no CSS. The caption showing the literal text `<b>` proves the markup
   was not parsed; checked with `toHaveText`.
6. **Accessibility names**: recorded as accessibility findings; the PS-19 snapshot pins today's
   state.

## Proposal

- Scope: `plans/product-search.md` only; code in the section above is for /codetest
- Confidence: 7 (medium)
- Rationale:
    - +: every locator, message and API call was seen live; useful test ids exist, including a
      `search_completed` marker to wait on.
    - +: read-only scenarios; no shared state touched; products identified by name, not id.
    - +: all open questions resolved by review on 2026-11-23.
    - -: the catalogue is reseeded with data resets; tests avoid exact counts for that reason.
- Unknowns: the intended price-range behaviour (PS-12).
