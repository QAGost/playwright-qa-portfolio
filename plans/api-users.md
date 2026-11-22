# Test plan: Users API and self-provisioned test user

- Layer: API (`tests/app/api/`, every test tagged `@api`). Priorities below set the build order;
  API tests all carry the one `@api` tag.
- Contract: OpenAPI 3.2.0 document at `${API_URL}/docs` (API version 5.0.0), read 2026-11-22.
  Schemas and expected codes come from this document; live behaviour is evidence, not contract.
- Endpoints in scope: `POST /users/register`, `POST /users/login`, `GET /users/me`,
  `GET /users/logout`. Out of scope for now: the admin endpoints (`GET /users`,
  `/users/{userId}`, `/users/search`), `forgot-password`, `change-password`, `refresh`.
- Status: Reviewed 2026-11-22; open questions A to D resolved. Implemented 2026-11-22:
  self-provisioned run user (reused across runs, verified), API-00 (`users-delete.spec.ts`,
  uses the run user, creates nothing), API-02 + API-03 (`users-me.spec.ts`), API-01
  (`users-register.creates-accounts.spec.ts`, runs only with `RUN_ACCOUNT_CREATING_TESTS=1`).
  Full suite 25/25 green without creating accounts. Next: P2.

## Why this layer, and why now

1. **It removes the shared-account problem for good.** Today the suite logs in as one account
   whose credentials live in `env/.env.dev`. That account can be locked (3 failed logins,
   upstream #843; it happened on 2026-11-22), and anyone who clones the repo or runs CI needs
   their own credentials. If the setup registers a fresh user on every run, nobody needs stored
   credentials, nothing can lock the suite, and CI needs no secrets.
2. **It is the API showcase.** Contract-first schemas, every documented status code, negative
   loops and token lifecycle, at API speed (no browser).
3. **It makes later work cheaper.** E2E checkout and the lockout scenario both need a user that
   no one else touches.

## Users of this layer and what they need

| User | Need | Must work |
| --- | --- | --- |
| A new customer (through the UI or any client) | Create an account and be recognised | Register → log in → `/users/me` returns their data |
| A returning customer | Sessions that end when they sign out | Logout invalidates the token |
| Anyone with a stolen or missing token | Gets nothing | Protected endpoints answer 401 |
| The test suite itself | A private, disposable user per run | Self-provisioning setup; no stored credentials |
| A reviewer cloning the repo | Run it with zero setup | `npm install && npm test`, no account needed |

## Self-provisioning design

```
setup-api  ── POST /users/register (factory user) ── POST /users/login ──► .auth/app/runUser.json
   │                                                                      .auth/app/apiAccessToken.json
   ▼
setup-ui   ── UI login with the run user (AppPage.loginAndVerify) ──────► .auth/app/appStorageState.json
   │
   ├──► api       (token loaded per worker, as today)
   └──► chromium  (storage state, as today)
```

- **Reuse first, register only when needed.** `setup-api` first tries to log in as the user saved
  in `.auth/app/runUser.json` from an earlier run. Only if the file is missing or that login fails
  does it register a new user with data from a new factory (`generateRegistration()` in
  `test-data/factories/app/user.factory.ts`), validate the 201 body with the user schema, and save
  email and password to `runUser.json` (gitignored with the rest of `.auth/`). CI caches the same
  file between runs (`actions/cache`), so the run user is created about once a week, not per run.
- **Recognisable and harmless test users.** Emails `pw-autotest-<random>@example.com`
  (`example.com` is reserved and never delivers mail), names "PW Autotest", no personal data, so
  the site's maintainers can identify and bulk-delete them.
- **Workers read the run user** the same way they read the token today: a worker fixture loads
  `runUser.json` and sets `process.env.APP_EMAIL` / `APP_PASSWORD`. Existing tests keep using
  `process.env.APP_EMAIL!` unchanged.
- **`setup-ui` depends on `setup-api`** (one line in `playwright.config.ts`), because it needs the
  user `setup-api` creates.
- **Tests that change their user** (lockout, future change-password) get their **own** user from a
  `registeredUser` helper fixture (`fixtures/helper/helper-fixture.ts`): register before the
  test, hand it over, teardown per Open question B.
- **Factory rules:** unique email per call (faker plus a random suffix, so parallel workers never
  hit 409); a password that satisfies the policy by construction (at least one lower, upper,
  digit and symbol, length 12), never by chance; names within the contract's max lengths
  (first 40, last 20); an adult `dob`; a full address, since the UI form requires house number
  and state even though the API marks the address optional.
- **`env/.env.example`:** `APP_EMAIL` / `APP_PASSWORD` become optional (only for manual
  exploration with a personal account). `APP_URL` and `API_URL` get the real public demo URLs,
  so a fresh clone runs as-is (Open question A).

## Scenarios

Every row of the coverage matrix (`api-testing` skill) is listed; rows that cannot apply say why,
rows to cut need your decision (Open question D).

| ID | P | Endpoint | Scenario | Expected (contract) | Notes |
| --- | --- | --- | --- | --- | --- |
| API-00 | P1 | DELETE /users/{userId} | Can a customer delete their own account? | Contract lists 204 and 403 | **First implementation step**, one throwaway user. If 204: every test that registers a user deletes it in teardown, and no users are left behind. If 403: recorded as `// OBSERVED`, and the volume limits below apply |
| API-01 | P1 | POST /users/register | Happy path | 201, user schema; `first_name`, `last_name`, `email` equal what was sent; no password in the body | Asserted on the registration the setup performs when it creates a run user, plus a standalone test in the nightly set |
| API-02 | P1 | POST /users/login | Newly registered user logs in | 200, `UserResponseSchema` (token) | Existing scaffold spec covers the shared user; this uses a fresh one |
| API-03 | P1 | GET /users/me | Token of the new user returns that user | 200, user schema; email and names match the registration | One test, three calls, one `test.step()` per call |
| API-04 | P2 | POST /users/register | Email already registered | 409, conflict schema | Register the same factory payload twice |
| API-05 | P2 | GET /users/me | No token | 401, `UnauthorizedResponseSchema` | |
| API-06 | P2 | GET /users/me | Malformed or invalid token | 401 | `Bearer not-a-token` |
| API-07 | P2 | GET /users/logout | Logout with a valid token | 200, new `LogoutResponseSchema` (`{ message }`) | |
| API-08 | P2 | GET /users/logout → GET /users/me | Token is dead after logout | `/me` answers 401 | Security: the "shared computer" case at API level |
| API-09 | P2 | POST /users/login | Lockout after repeated failures | 3 failed logins, then 423 | **Not in the contract** (login documents only 200); expected code and body captured live, marked `// OBSERVED`. Uses its own `registeredUser`, never the run user |
| API-10 | P3 | POST /users/register | Empty body `{}` | 400 per contract | Likely 422 live: Open question C |
| API-11 | P3 | POST /users/register | Each required field omitted (`first_name`, `last_name`, `email`, `password`) | 400 per contract | One test per field (omission loop) |
| API-12 | P3 | POST /users/register | Malformed emails | 400 per contract | `INVALID_EMAILS` from `test-data/static/app/invalidCredentials.ts` |
| API-13 | P3 | POST /users/register | Password shorter than 8 | 400 per contract | 7 characters, otherwise policy-compliant |
| API-14 | P4 | POST /users/register | Wrong types per field (strings, `address` object, `dob` date) | 400 per contract | `for...of` over the universal `INVALID_*` arrays; `undefined` dropped for optional fields |
| API-15 | P4 | POST /users/register | Max lengths exceeded (first 41, last 21, phone 25, email 257) | 400 per contract | Inline range values |
| API-16 | P4 | POST /users/register | Unsupported method (`GET /users/register`) | 405, `MethodNotAllowedResponseSchema` | 405 is not documented for this path: captured live, `// OBSERVED` |
| API-17 | P4 | POST /users/login | Wrong password / unknown email (existing scaffold loop) | 401 | Existing tests; contract documents only 200, so they get `// OBSERVED` lines |

**Tests that create users** (API-01 standalone, API-04 duplicate email, API-09 lockout) run in a
nightly or on-demand CI job, not on every push: about 3 accounts a day at most, none if API-00
shows a user can delete itself. A typical push creates 0 to 1 users (the run user, about weekly).
Validation tests create nothing (the API rejects them).

**Not applicable:** path-parameter and query-parameter loops (none of these endpoints has
either); 404 (no resource id); 204 (no DELETE in scope).

**Documented but not producible from a client** (need your cut, Open question D):
- `POST /users/register` → 401 and 403: the endpoint needs no authentication, so no client
  input should produce them.
- `POST /users/register` and `GET /users/logout` → 400 "Bad Request, no body": with JSON
  bodies the validation answer is the 400/422 question; a raw malformed body would need a
  test outside the `apiRequest` fixture.

## Schemas and code

- **User schema:** the contract's `UserResponse` component is the body of both
  `GET /users/me` and `POST /users/register` 201, so `CurrentUserSchema` is reused for both
  (no duplicate). Its fields are all optional per the contract.
- **New request schema:** `RegisterRequestSchema` (`z.strictObject`, required fields per the
  contract, max lengths, `z.email()`, `z.iso.date()` for `dob`); the factory returns
  `RegisterRequestSchema.parse(...)`.
- **New response schemas** in `fixtures/api/schemas/`: `LogoutResponseSchema` (app);
  `ConflictResponseSchema` (409: field-level message map **or** `{ message }`, per the
  contract's `oneOf`) and `MethodNotAllowedResponseSchema` (`{ message }`) in
  `util/errorResponseSchema.ts`; a 423 lock schema captured live.
- **Enums:** `ApiEndpoints.LOGOUT`, `CURRENT_USER`, `REGISTER` exist. `StorageStatePaths.RUN_USER`
  is new.
- **Specs:** `tests/app/api/users-register.spec.ts`, `users-me.spec.ts`, `users-logout.spec.ts`;
  lockout added to the existing `tests/app/api/login.spec.ts`.
- **Setup:** `helpers/app/createStorageState.ts` gains `registerRunUser()`;
  `tests/app/auth-api.setup.ts` calls it before minting the token.

## Live results, API-00 run (2026-11-22, one throwaway user)

| Question | Answer | Consequence |
| --- | --- | --- |
| Can a customer delete itself? (API-00) | **No: `DELETE /users/{id}` with its own token → 403 `{"message":"Forbidden"}`** | No cleanup possible; the volume limits apply. API-00 becomes a test asserting the 403 (`// OBSERVED` not needed: 403 is documented) |
| Register | 201; body keys `first_name, last_name, email, dob, phone, id, created_at, address`, all within `CurrentUserSchema` | Reuse confirmed |
| Lockout | Failed logins 1-3 → 401 `{"error":"Unauthorized"}`; **attempt 4 → 423** `{"error":"Account locked, too many failed attempts. Please contact the administrator."}`; the correct password then also gets 423 | API-09 expects exactly this, `// OBSERVED` |
| Token issued before the lock | **Still valid: `GET /users/me` → 200 after the account locked** | **Security finding**: locking an account does not end its sessions. Candidate bug report; new scenario API-18 (known defect, `test.fail()` + `// BUG:` if confirmed by the owner) |
| Validation errors | **422** with a field → messages map (empty body: all four required fields named) | Question C settled: the contract's 400 is stale for validation; tests assert 422 with `// OBSERVED: contract documents 400` and the docs gap is a candidate upstream issue |
| `GET /users/register` (API-16) | **401** `{"message":"Unauthorized"}`, not 405: the path is routed as `GET /users/{userId}` | API-16 asserts 401 with `// OBSERVED`; a 405 for this path cannot be produced by changing the method |

The throwaway user `pw-autotest-cprpvfu3@example.com` remains on the site, locked (deletion is
forbidden).

## Contract findings (from reading the document)

| Finding | Contract | Live evidence | Handling |
| --- | --- | --- | --- |
| Login documents only 200 | `POST /users/login`: 200 | 401 and 423 seen 2026-11-22 | Tests mark the codes `// OBSERVED`; candidate docs issue upstream |
| Validation errors | 400, no body | The repo's 422 schema was captured live (field → messages) | Open question C |
| Address optional in the API, required in the UI | address not in `required` | UI register form required house number and state (2026-11-22) | Recorded; a candidate for a register UI plan |
| State accepted as free text | no enum or pattern | UI accepted "Undefined" | Recorded only |

## Out of scope

- **Admin endpoints** (`GET /users`, `/users/{userId}`, `/users/search`): need an admin token,
  that is a stored credential again. Later, if at all.
- **Deleting users we created**: `DELETE /users/{userId}` needs authorisation the run user
  probably lacks (a customer deleting itself is expected to be 403; not yet verified). See
  Open question B.
- **Forgot/change password, token refresh**: their own plan.
- **Load**: k6, separate repo.

## Open questions

**A to D resolved 2026-11-22: the repo owner accepted all four recommendations**, with the
volume limits and the self-delete check (API-00) added. The original questions follow for the
record.

- **A. Always self-provision?** Recommended: yes. Every run registers its own user,
  `APP_EMAIL` / `APP_PASSWORD` become optional (personal exploration only), and
  `env/.env.example` gets the real public URLs so a clone runs with zero setup. Alternative:
  keep the stored account as the default and provision only in CI.
- **B. Leftover users.** If a customer cannot delete itself (API-00), what we register stays on
  the public practice site. Recommended: accept it within the volume limits above (reuse the run
  user, user-creating tests nightly only, recognisable fake users). Rejected alternative: the
  site's publicly listed admin account for cleanup. It means using admin rights on a shared public
  system, where a bug in our cleanup could delete other people's data, and it is a stored,
  lockable credential again.
- **C. 400 or 422 for validation errors?** The contract says 400; the scaffold's schema says the
  API answers 422. Per the `api-testing` rules, only you can declare the contract stale. Proposal:
  confirm live during implementation; if every validation error is 422, treat the contract as
  stale for that code, assert 422 with an `// OBSERVED: contract documents 400` line, and report
  the documentation gap upstream. If it is inconsistent, the tests keep 400 and are marked as a
  known defect (`test.fail()` + `// BUG:`, the rule you approved for the login plan).
- **D. Cuts.** Register 401 and 403, and the raw-malformed-body 400 for register and logout,
  cannot be produced by a normal client. Recommended: cut them with a
  `// SCOPE: ... cut by repo owner, plan review 2026-11-22` line. Your call; I can't cut rows
  myself.

## Proposal

- Scope: `plans/api-users.md` only; code follows after review.
- Confidence: 7 (medium)
- Rationale:
  - +: every endpoint, field rule and status code comes from the OpenAPI document.
  - +: reuses the schema, fixtures and token loading that already exist; existing UI tests need
    no changes.
  - +: removes the stored-credential and lockout risk for the whole suite.
  - -: the 400/422 question and the undocumented 405/423 bodies need live capture.
  - -: the password policy beyond "min 8" is undocumented; the factory guarantees every
    character class to stay safe, and the first registration confirms it.
- Unknowns: whether a customer can delete itself (API-00), the 400/422 answer (C), the 405 and
  423 bodies. All are settled by live checks during implementation.
