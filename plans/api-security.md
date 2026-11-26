# Test plan: API security (OWASP API Security Top 10, 2023)

- Layer: API (`tests/app/api/`, every test tagged `@api`). Priorities set the build order.
- Contract: OpenAPI 3.2.0 document at `${API_URL}/docs?api-docs.json` (API version 5.0.0), read
  2026-11-26. Where the contract is silent on a security property (who may call an endpoint,
  response headers), the expectation is the OWASP baseline and the test says so with an
  `// OWASP <id>:` line; a code the contract does not list is marked `// OBSERVED`.
- Explored: 2026-11-26, read-only probes with `curl` and `fetch`, using the run user and
  throwaway users registered for the purpose (`pw-autotest-probe-*@example.com`, removed by the
  site's hourly wipe). No other user's data was stored; counts only.
- Status: Draft, awaiting review. Choices settled with the repo owner before writing: likely
  defects are verified by hand first (`docs/manual-verification.md` A7 to A10), then become
  `test.fail()` with a `// BUG:` line and an `/issue` draft; security headers are in scope;
  the catalog-write check is in scope in its safe form.

## Ground rules

These tests run against a public demo site that we do not own.

1. **Only accounts the tests create.** Never another user's id, never the shared demo accounts,
   never the publicly listed admin account. Ids of other users come from users the test itself
   registered.
2. **No load, no fuzzing.** One request per case; curated payload lists, not generated floods.
   API4 (resource consumption) belongs to the k6 repository, if anywhere.
3. **Nothing shared is changed.** Write checks against the catalog use an id that does not exist
   or a body that validation rejects, so a missing check shows up as 404 or 422 without creating
   or changing anything.
4. **No failed logins on an account we keep.** Failed-login cases use a fresh random email
   (3 failures lock an account).
5. **No personal data in assertions or reports.** A test that finds other users' data asserts on
   counts and ids, never prints names or emails.

## Users and what they need

| User                            | Goal                                         | Must work                                                       |
| ------------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| A customer                      | Their profile, orders and favourites private | No other customer can read or change them                       |
| A customer                      | Can't become an admin by editing a request   | Role is set by the server, never by a request field             |
| The shop                        | Catalog changed only by staff                | Writes to products, brands, categories need an admin token      |
| Anyone with a forged token      | Gets nothing                                 | A tampered or unsigned token is rejected (401)                  |
| An attacker probing for details | Learns nothing about the stack               | Generic error bodies; no versions, stack traces or SQL in reply |

## What the probes found (2026-11-26)

| OWASP API 2023                       | Check                                                                                    | Result                                                                                                                                                     | Verdict           |
| ------------------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| API5 Broken Function Level Authz     | Customer token → `GET /users`                                                            | 403                                                                                                                                                        | works             |
| API5                                 | Customer token → `GET /reports/total-sales-per-country`, `/reports/customers-by-country` | 403                                                                                                                                                        | works             |
| API5 + API3 (data exposure)          | Customer token → `GET /users/search?q=a`                                                 | **200: 25 other users with first and last name, email, phone, date of birth and address** (15 per page). `GET /users` refuses the same customer with 403   | **likely defect** |
| API5                                 | No token → `POST /brands`, `POST /categories`, `POST /products` with `{}`                | **422** (field validation): the request passed authentication                                                                                              | **likely defect** |
| API5                                 | No token → `PUT`/`PATCH /products/{missing id}`, `PUT /brands/{missing id}` with `{}`    | **404**: the request passed authentication and reached the record lookup                                                                                   | **likely defect** |
| API5                                 | No token → `DELETE /products/{missing id}`                                               | 401                                                                                                                                                        | works             |
| API1 Broken Object Level Authz       | User A → `GET /users/{B}`                                                                | 404 "You are not authorized to view this user."                                                                                                            | works             |
| API1                                 | User A → `PATCH /users/{B}`                                                              | 403 "You can only update your own data."                                                                                                                   | works             |
| API1                                 | User A → `GET /favorites/{B's favourite}`                                                | **200, with B's `user_id` and `product_id`**                                                                                                               | **likely defect** |
| API1                                 | User A → `DELETE /favorites/{B's favourite}`                                             | 204, but B's favourite is still there. `DELETE` answers 204 for an id that does not exist too                                                              | works; gap (B13)  |
| API1                                 | User A → `GET /favorites`                                                                | 200, `[]` (only A's own)                                                                                                                                   | works             |
| API2 Broken Authentication           | `GET /users/me` with no token, `Bearer not-a-token`, `alg: none`, an altered signature   | 401 each                                                                                                                                                   | works             |
| API2                                 | Token with the payload changed to `"role":"admin"`, original signature, on `GET /users`  | 401                                                                                                                                                        | works             |
| API3 Broken Object Property Authz    | Register with an extra `"role": "admin"`                                                 | 201; the token's `role` claim is `user`                                                                                                                    | works             |
| API3                                 | `PATCH /users/{own id}` with `{"role": "admin"}`                                         | 200 `{"success":true}`, but after a new login the role is still `user` and `GET /users` is still 403: the field is silently ignored                        | works; note (C)   |
| Injection                            | `GET /products/search?q=' OR 1=1--`; `GET /products/'`                                   | 200 with 0 results; 404 "Requested item not found"                                                                                                         | works             |
| API8 Security Misconfiguration       | Headers on `GET /products`                                                               | **No `Strict-Transport-Security`, no `X-Content-Type-Options`; `Server: Apache/2.4.52 (Ubuntu)`** discloses the server version and OS                      | **likely defect** |
| API8                                 | CORS with `Origin: https://evil.example` on `GET /users/me`                              | `Access-Control-Allow-Origin: *`, no `Access-Control-Allow-Credentials`. Acceptable for a bearer-token API: a browser sends no credentials to a `*` origin | works             |
| Not in the contract, seen in the JWT | Claims                                                                                   | `iss, iat, exp, nbf, jti, sub, prv, role`; token lifetime 300 s                                                                                            | recorded          |

The contract matters for two of the likely defects:

- **Catalog writes:** the OpenAPI document lists no security requirement for `POST /brands`,
  `POST /categories`, `POST /products`, `PUT`/`PATCH /products/{id}` and `PUT`/`PATCH
/brands/{id}`, while it does for their `DELETE`. The open writes are therefore documented, and
  may be deliberate on a practice site. OWASP still expects authentication for writes to shared
  data; the plan tests the OWASP expectation and records the contract position (A10).
- **User search:** the contract requires a token for `GET /users/search` but does not say which
  role. `GET /users` (same data, no filter) refuses a customer, so the search endpoint is
  inconsistent with its own sibling, whatever the intent (A7).

## Scenarios

Every scenario is `@api`. **Known-defect rows** (SEC-02, SEC-07, SEC-09, SEC-17) are written with
the correct expectation. They become `test.fail()` with a `// BUG: ..., see plans/api-security.md
<ID>` line only after the repo owner ticks the matching A-row in `docs/manual-verification.md`;
until then `/codetest` reports them as failing and stops there.

### P1: authorization (API1 and API5)

| ID     | OWASP | Endpoint                                                                          | Scenario                                                       | Expected                                               | Notes                                                                                                        |
| ------ | ----- | --------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| SEC-01 | API5  | GET /users                                                                        | Customer calls an admin list                                   | 403                                                    | `// OBSERVED`: the contract lists 200, 400, 401                                                              |
| SEC-02 | API5  | GET /users/search                                                                 | Customer searches all users                                    | 403, as `GET /users`                                   | **Known defect A7** (live 200 with other users' personal data). Asserts the status only; never logs the body |
| SEC-03 | API5  | GET /reports/\* (7 endpoints)                                                     | Customer calls each admin report                               | 403 each, one `for...of` over the report paths         | `// OBSERVED`: the contract lists 200, 401, 404                                                              |
| SEC-04 | API1  | GET /users/{userId}                                                               | User A reads user B's profile                                  | 404 (the contract's code for this case)                | A and B both registered by the test                                                                          |
| SEC-05 | API1  | PATCH /users/{userId}                                                             | User A changes user B's first name                             | 403; B's `GET /users/me` still shows the original name | Two calls, one `test.step()` each                                                                            |
| SEC-06 | API1  | GET /favorites                                                                    | User A lists favourites while B has one                        | 200, A's list does not contain B's favourite id        |                                                                                                              |
| SEC-07 | API1  | GET /favorites/{favoriteId}                                                       | User A reads B's favourite by id                               | 404 (the contract lists no 403)                        | **Known defect A8** (live 200 with B's `user_id`)                                                            |
| SEC-08 | API1  | DELETE /favorites/{favoriteId}                                                    | User A deletes B's favourite                                   | B's `GET /favorites` still contains it                 | Asserts the state, the security property. The status (204 for any id) is gap B13, not asserted here          |
| SEC-09 | API5  | POST /brands, /categories, /products; PUT, PATCH /products/{id}; PUT /brands/{id} | No token, safe form (empty body, or an id that does not exist) | 401 each, one `for...of` over method + path            | **Known defect A10** (live 422 and 404). `// OWASP API5:` the contract documents these as open               |
| SEC-10 | API5  | DELETE /products/{productId}                                                      | No token, id that does not exist                               | 401                                                    | Guards the one catalog write that is protected today                                                         |

### P2: authentication and property-level authorization (API2 and API3)

| ID     | OWASP | Endpoint                                               | Scenario                                                                                           | Expected                                                                                         | Notes                                                                                                                            |
| ------ | ----- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| SEC-11 | API2  | GET /users/me                                          | Rejected tokens: none, `Bearer not-a-token`, `alg: none` unsigned, one signature character changed | 401 each, `UnauthorizedResponseSchema`                                                           | Variants built at run time from the run user's real token by a helper (below); no token is ever stored in test data              |
| SEC-12 | API2  | GET /users                                             | Forged claim: payload `role` set to `admin`, original signature                                    | 401                                                                                              | Same helper                                                                                                                      |
| SEC-13 | API3  | POST /users/register                                   | Register with an extra `"role": "admin"`                                                           | 201; the new token's `role` claim is `user`; that token gets 403 on `GET /users`                 | Three calls (register, login, `/users`), one `test.step()` each                                                                  |
| SEC-14 | API3  | PATCH /users/{userId}                                  | Customer sets `"role": "admin"` on their own profile                                               | After a new login, the `role` claim is still `user` and `GET /users` is 403                      | The 200 `{"success":true}` for an ignored field is note C (below), not asserted as a failure                                     |
| SEC-15 | API3  | POST /users/register, POST /users/login, GET /users/me | Responses carry no secrets                                                                         | No `password`, `password_hash`, `totp_secret` or `remember_token` key in any of the three bodies | The strict schemas already reject unknown keys; this states the security intent explicitly. API-01 covers `password` on register |

`GET /users/logout` → token dead (API2) is API-08 in `plans/api-users.md`; not repeated here.

### P3: injection and error handling

| ID     | OWASP     | Endpoint                         | Scenario                                                 | Expected                                                                                                         | Notes                                                                                                                                                               |
| ------ | --------- | -------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-16 | Injection | GET /products/search             | SQL, NoSQL and script payloads as `q`                    | 200 each, the search schema, and no database or framework error text in the body                                 | Payloads in `test-data/static/app/injection-payloads.ts` (`as const`); the error markers (`SQLSTATE`, `syntax error`, `Illuminate`, `Stack trace`) in the same file |
| SEC-17 | API8      | GET /products (any response)     | Security headers                                         | `X-Content-Type-Options: nosniff`; `Strict-Transport-Security` present; `Server` header without a version number | **Known defect A9.** Header names from a new `SecurityHeaders` enum in `enums/util/`                                                                                |
| SEC-18 | Injection | POST /users/login                | The same payloads as `email`, with a random password     | 401 or 422, never 5xx                                                                                            | Each payload is a new, non-existent account, so nothing can lock                                                                                                    |
| SEC-19 | API8      | GET /products/{id}, /brands/{id} | Invalid id formats (the `INVALID_UUID_VALUES` path loop) | 404 with the `{ message }` schema and no stack trace, file path or SQL                                           | Path-parameter loop from `test-data/static/util/invalid-values.ts`                                                                                                  |

### P4: CORS

| ID     | OWASP | Endpoint      | Scenario                                    | Expected                                                                                                                     | Notes                                     |
| ------ | ----- | ------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| SEC-20 | API8  | GET /users/me | Request with `Origin: https://evil.example` | The origin is not reflected together with `Access-Control-Allow-Credentials: true` (a `*` origin without credentials passes) | The foreign origin is a constant in enums |

## Out of scope

Each is recorded in the specs as `// SCOPE: <reason>, cut by repo owner, plan review 2026-11-26`.

- **BOLA on invoices** (`GET /invoices/{id}`, `PUT /invoices/{id}`): each user needs a full
  checkout first (cart, postcode lookup, payment). The highest-value BOLA case for a shop; P5,
  after the checkout E2E work makes the setup reusable.
- **API4 Unrestricted Resource Consumption:** a load test; k6 repository, if at all.
- **API6 Sensitive Business Flows, API9 Inventory, API10 Unsafe Consumption:** nothing to test
  from a client on this API.
- **API7 SSRF:** no endpoint takes a URL.
- **Web app response headers** (CSP, `X-Frame-Options`, `nosniff` on
  `practicesoftwaretesting.com`): seen missing on 2026-11-26, recorded in A9; the site sits
  behind Cloudflare, which challenges CI runners, so it stays a manual finding.
- **The rest of the catalog writes** (`PATCH /brands/{id}`, categories `PUT`/`PATCH`): the
  SEC-09 sample proves the pattern; listing every route adds requests, not information.

## Code

- **Helper fixture `registeredUser`** in `fixtures/helper/helper-fixture.ts`: registers a user
  from `generateRegistration()`, logs in, hands over `{ id, email, token }`. SEC-04 to SEC-08,
  SEC-13 and SEC-14 need fresh users in three spec files, past the `api-testing` threshold for a
  helper fixture. No teardown: a customer cannot delete itself (API-00) and the site wipes users
  hourly.
- **Helper `helpers/util/jwt.ts`:** pure functions that return tampered variants of a given token
  (`unsigned`, `withAlteredSignature`, `withClaim`). Run-time only; nothing secret-shaped is
  written to the repo.
- **Enums:** `ApiEndpoints` gains `USERS_SEARCH`, `REPORTS_*` (7), `BRANDS` and `CATEGORIES`
  (`FAVORITES`, `USERS` and `PRODUCTS` exist); `enums/util/` gains `SecurityHeaders` and
  `ForeignOrigin`.
- **Schemas:** `FavoriteSchema` (contract `FavoriteResponse`), the search-result page schema for
  products (contract), `UnauthorizedResponseSchema` and the `{ message }` 404 schema already in
  `fixtures/api/schemas/util/errorResponseSchema.ts`.
- **Static data:** `test-data/static/app/injection-payloads.ts` (payloads and error markers,
  `as const`).
- **Specs** (`.creates-accounts` where the test registers users):
    - `tests/app/api/security-authorization.creates-accounts.spec.ts`: SEC-01 to SEC-10
    - `tests/app/api/security-authentication.creates-accounts.spec.ts`: SEC-11 to SEC-15
    - `tests/app/api/security-injection.spec.ts`: SEC-16, SEC-18, SEC-19
    - `tests/app/api/security-headers.spec.ts`: SEC-17, SEC-20
- **README:** an "OWASP API Top 10 coverage" table (category → scenarios → status), linked from
  the security section, once P1 is in.

## Findings for manual verification

Added to `docs/manual-verification.md` with steps to reproduce:

- **A7** `GET /users/search` exposes other users' personal data to any customer (SEC-02).
- **A8** A customer can read another customer's favourite by id (SEC-07).
- **A9** API responses lack HSTS and `nosniff` and disclose the server version (SEC-17).
- **A10** Catalog writes are accepted without a token (SEC-09).
- **B13** `DELETE /favorites/{id}` answers 204 for any id, own, someone else's or non-existent.
- **C** `PATCH /users/{id}` with `role` answers `{"success":true}` and ignores the field.

## Open questions

- **E. Report upstream?** A7 is a privacy defect on a public practice site. Once verified, draft
  it with `/issue` as usual, or report it privately to the maintainers first (their security
  contact) because it exposes real visitors' data? Recommended: privately first, then the public
  draft refers to it.
- **F. Known defects before verification.** Recommended: implement P1 now and let SEC-02, SEC-07
  and SEC-09 fail until you tick A7, A8 and A10; the `test.fail()` markers follow your ticks.
  Alternative: implement them only after you have verified.

## Proposal

- Scope: `plans/api-security.md` and the A7 to A10, B13 and C entries in
  `docs/manual-verification.md`; code follows after review, one priority per `/codetest`.
- Confidence: 8 (high)
- Rationale:
    - +: every row was probed live on 2026-11-26 and read against the contract.
    - +: reuses the run user, the factory, the error schemas and the `apiRequest` fixture.
    - +: the ground rules keep every check off other people's data and off the shared catalog.
    - -: four expectations go beyond the contract (OWASP baselines), and four rows fail today
      until the owner verifies them.
- Unknowns: E and F above.
