# Findings to verify by hand

Everything the test plans recorded as a likely defect, gap or observation, with steps to
reproduce each in a browser or terminal. Tick a box only when you saw it yourself; change the
plan's wording if you did not. Checked against the live site on 2026-11-22 and 2026-11-23, which
may have changed since (the data is wiped every hour).

**Setup for all steps:** Chrome or Edge, DevTools open (F12) on the **Network** tab, site
`https://practicesoftwaretesting.com`. A request's method and status show in the Network list;
filter by `api.` to see only API calls.

**Account safety:** the site locks an account after 3 failed logins. Never fail a login on an
account you want to keep. Use a made-up email (`nobody-123@example.com`) for failed logins, or
register a throwaway account first (Sign in → Register your account; any made-up details; the
site deletes all users every hour).

## A. Likely defects (verify these first)

| #   | Finding                                                     | Plan                     | Verified               | Severity |
| --- | ----------------------------------------------------------- | ------------------------ | ---------------------- | -------- |
| A1  | Double-click on Add to cart: badge says 2, cart holds 1     | product-page PP-06       | [x] you and Claude     | Medium   |
| A2  | Double-click on Login sends two login requests              | login; docs/bug-reports/ | [x] you and Claude     | Low      |
| A3  | Sorting search results changes which products are listed    | product-search PS-08     | [x] you, Network tab   | Low      |
| A4  | Back from a product page loses the search                   | product-search PS-07     | [ ]                    | Low      |
| A5  | Unknown product id shows a blank page (and a 500 behind it) | product-page PP-08       | [ ]                    | Low      |
| A6  | A token issued before an account lock still works           | api-users API-18         | [x] Claude, 2026-11-23 | Medium   |

### A1. Double-click on Add to cart: badge 2, cart holds 1

1. Open a **new tab** (a fresh tab has no cart) and go to the home page.
2. Search for `Combination Pliers`, open the product.
3. In DevTools, filter the Network tab by `carts`.
4. **Double-click** "Add to cart" (two quick clicks).
5. Look at the cart count in the header, then click the cart link and read the quantity.

- Expected: the count and the cart quantity agree (1 for a single add, or 2 and 2).
- Seen: count **2**, cart quantity **1**, total $14.15. Network shows **two** `POST /carts` (201),
  then two `POST /carts/<id>` (200), and the two requests use different cart ids.
- Also try: a single click in a fresh tab (count 1, cart 1) to confirm it is the double-click.
- Repeated 2026-11-23: 4 of 4 fresh sessions gave badge 2 and cart quantity 1. Note which number you
  see in the header and which on the cart page; they should differ.

### A2. Double-click on Login sends two login requests

Safe to run: it uses a made-up email, so no real account can be locked.

1. Open `https://practicesoftwaretesting.com/auth/login` in a fresh tab, signed out.
2. Press F12, open the **Network** tab and type `login` in its filter box. Click the bin icon
   (Clear) so the list is empty.
3. Type `nobody-123@example.com` in **Email address** and `NotARealPass1!` in **Password**.
4. **Single-click** "Login". Count the `login` rows in the Network list.
5. Reload the page (F5), clear the list again and fill the same two fields.
6. **Double-click** "Login" (two quick clicks). Count the `login` rows again.

| Action       | `POST /users/login` requests | Status | On the page                 |
| ------------ | ---------------------------- | ------ | --------------------------- |
| Single click | 1                            | 401    | "Invalid email or password" |
| Double-click | **2**                        | 401    | "Invalid email or password" |

- Expected: one request for one login attempt, however fast the user clicks.
- Seen: two requests (run 2026-11-23: 1 request, then 3 in total after the double-click, so 2
  for the double-click). The page shows a single error message either way, so the user cannot
  tell.
- Why it matters: the site locks an account after 3 failed logins (423 on the 4th). A user who
  mistypes a password and double-clicks uses two attempts at once. **Do not try this with a real
  account.**
- Not framework-specific: the app is Angular, and any button that stays clickable while its
  request is in flight behaves this way; the usual fix is to disable it until the response
  arrives.
- Full report: [login-double-click.md](bug-reports/login-double-click.md).

### A3. Sorting changes the result set

1. Open `https://practicesoftwaretesting.com` in a fresh tab, signed out. Leave the **Sort**
   dropdown on its empty first option.
2. In the **Search** box type `hammer` and press **Search** (or Enter).
3. Read the line under "Searched for: hammer" and count the tiles. Write the names down.
4. Open the **Sort** dropdown and choose **Name (A - Z)**.
5. Read the line again, count the tiles and compare the names with step 3.
6. Optional: choose **Price (Low - High)** and **Name (Z - A)**; the count stays at 7.

| Step | Count line                      | Tiles                                                                                                                                                      |
| ---- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3    | `6 products found for 'hammer'` | Claw Hammer with Shock Reduction Grip, Hammer, Claw Hammer, Thor Hammer, Claw Hammer with Fiberglass Handle, Court Hammer                                  |
| 5    | `7 products found for 'hammer'` | Claw Hammer, Claw Hammer with Fiberglass Handle, Claw Hammer with Shock Reduction Grip, Court Hammer, Hammer, **Sledgehammer**, Thor Hammer (A to Z order) |

- Expected: the same six products in a different order (sorting should not change which
  products match).
- Seen: **6** becomes **7**; "Sledgehammer" appears only after sorting.
- Why (Network tab, filter `products`): the search sends `QUERY /products/search` and matches
  whole words ("Sledgehammer" is not the word "hammer"). The sort sends `QUERY /products` with
  the same text and matches part of a word, so it finds "Sledgehammer".
- If you see 7 tiles at step 3, the data or the site has changed: tell me the names you see and
  I will update the plan.
- Which list is "right" is a product decision. The finding is that the same search gives two
  different answers depending on whether you sorted.

### A4. Back loses the search

1. Search for `drill`; four cordless drills are listed.
2. Click one product to open it.
3. Press the browser's **Back** button.

- Expected: the `drill` results are still there.
- Seen: the unfiltered home page; the search is gone. The address stays `/` the whole time.
- A UX defect rather than a crash: nothing is broken, but a shopper comparing products must
  retype the search each time.

### A5. Unknown product id: blank page

1. Open any product, then in the address bar change the last character of the id
   (`/product/01M84…` becomes `/product/01M84…X`) and press Enter. This is what an old
   bookmark or a mistyped link does; a shopper cannot reach it by clicking.
2. Look at the page and at the Network tab (filter `products`).

- Expected: a clear "product not found" message.
- Seen: a blank page with only an empty "Related products" heading. `GET /products/does-not-exist`
  is **404** and `GET /products/does-not-exist/related` is **500**.
- Real-life case: product ids change when the site reseeds its data, so an old bookmark ends
  here.

### A6. A token issued before an account lock still works

Needs a terminal (Git Bash; PowerShell users: use `curl.exe`). **Use a throwaway account.**

1. Register a throwaway account in the browser (note its email and password).
2. Log in through the API and keep the token from the response (`access_token`):
   `curl -s -X POST https://api.practicesoftwaretesting.com/users/login -H "Content-Type: application/json" -d '{"email":"<email>","password":"<password>"}'`
3. Lock it: send the same request with a **wrong** password four times. The 4th answers
   **423** "Account locked, too many failed attempts. Please contact the administrator."
4. Confirm the lock: the **correct** password now also answers 423.
5. Use the old token:
   `curl -s -o /dev/null -w "%{http_code}" https://api.practicesoftwaretesting.com/users/me -H "Authorization: Bearer <token>"`

- Expected: 401 or 403, as the account is locked.
- Seen: **200**. A locked account's existing session keeps working.
- Result 2026-11-23, run by Claude on a throwaway user: register 201, login 200, `/users/me` 200;
  wrong-password attempts 1 to 3 gave 401 and attempt **4** gave **423**; the correct password then
  also gave 423; `/users/me` with the old token still gave **200**. Reproduces.
- Note: the lock itself is by design (upstream issue #843); the open question is whether it
  should also end existing sessions.

## B. Gaps and observations (judgement calls)

| #   | Finding                                                             | Plan             | Verified |
| --- | ------------------------------------------------------------------- | ---------------- | -------- |
| B1  | The home page hides 5 of 50 products (over $100) by default         | product-search   | [ ]      |
| B2  | Search results ignore the price slider that still shows 1 to 100    | product-search   | [ ]      |
| B3  | Searches under 3 characters and empty searches do nothing, silently | product-search   | [ ]      |
| B4  | The search box empties itself after each search                     | product-search   | [ ]      |
| B5  | A search is lost on reload; the address never changes               | product-search   | [ ]      |
| B6  | The cart lives in the tab: a new tab starts empty                   | product-page     | [ ]      |
| B7  | Compare shows no feedback at all                                    | product-page     | [ ]      |
| B8  | After login you land on `/account`, not where you were              | login            | [ ]      |
| B9  | Validation errors return 422; the OpenAPI document says 400         | api-users        | [ ]      |
| B10 | Login documents only 200 (401 and 423 happen)                       | api-users        | [ ]      |
| B11 | Register form needs house number and state; the API says optional   | login, api-users | [ ]      |
| B12 | Accessibility names: "X", "ngx-slider", unnamed delete-favourite    | both             | [ ]      |

### B1 and B2. Hidden expensive products, slider mismatch

1. Open the home page. The **Price Range** slider reads 1 to 100.
2. Count the products across all pages (9 per page). Sort by "Price (High - Low)": the top
   product is under $100, but the shop has products above that (e.g. "Cordless Drill 20V"
   $125.23).
3. Search for `drill`. The results include $125.23 and $119.24 while the slider still shows
   1 to 100.

- Question: is the preset range intended, and should a search honour it?

### B3, B4, B5. Search usability

1. Type `sa` and press Search: no request in the Network tab, no message.
2. Press Search with an empty box: nothing happens; any earlier results stay.
3. Search for `drill`: the box is empty afterwards, so refining means retyping.
4. With results showing, reload (F5): the search is gone and the address is still `/`.

### B6. Cart per tab

1. Add any product to the cart in one tab (count 1).
2. Open the shop in a **new tab**: the cart link shows no count and `/checkout` has no items.
3. Back in the first tab the cart is still there. Reload there: it stays.

(The cart id is kept in the tab's session storage: DevTools → Application → Session storage →
`cart_id`.)

### B7. Compare

1. Open any product and click "Compare". Watch the page and the Network tab.

- Seen: no message, no visible change.

### B8. No return to the page you were on

1. Signed out, open `https://practicesoftwaretesting.com/account/favorites`. You are sent to
   the login page.
2. Log in with a valid account.

- Seen: you land on `/account`, not on `/account/favorites`.

### B9 and B10. Contract differences (needs the API docs)

The contract is at `https://api.practicesoftwaretesting.com/docs`.

1. B9: send an invalid registration, e.g.
   `curl -s -i -X POST https://api.practicesoftwaretesting.com/users/register -H "Content-Type: application/json" -d '{}'`.
   Seen: **422**. In the docs, the register endpoint lists 400 for invalid input.
2. B10: in the docs, `POST /users/login` lists only 200. In practice it also answers 401
   (wrong password) and 423 (locked).

### B11. Register form versus API

1. Open `/auth/register`, fill only the personal details and the account details, leave the
   address blank, and submit: the form insists on house number and state.
2. In the API docs, the address fields on `POST /users/register` are not marked required.

### B12. Accessibility names

Use Chrome DevTools → Elements → Accessibility tab, or tab through the page with a screen
reader.

1. Home page: the search reset button is named just "X"; the two price handles are named
   "ngx-slider" and "ngx-slider-max".
2. Signed in, add a product to favourites, open `/account/favorites`: the delete button has no
   name at all (icon only).

## C. Seen, probably by design (no action unless you disagree)

- A customer cannot delete their own account: `DELETE /users/<id>` answers **403**
  `{"message":"Forbidden"}`.
- `GET /users/register` answers 401 (a wrong method on a public endpoint).
- Favourites signed out: the toast reads "Unauthorized, can not add product to your favorite
  list." (blunt, but works; nothing is saved).
- Quantity box: 0, negative and text become 1; 99999 becomes 99; 2.5 becomes 2. Sensible, but the
  limit of 99 is not documented anywhere.

## After you have checked

- Tell me which boxes you ticked and which items you reject; I update the plans and the known
  defect tests accordingly (an unconfirmed defect stays a question, not a `test.fail()`).
- Items you confirm and want to report upstream: I draft the bug report; you file it at
  [testsmith-io/practice-software-testing](https://github.com/testsmith-io/practice-software-testing/issues)
  after checking that nobody reported it yet.
