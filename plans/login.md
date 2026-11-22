# Test plan: Login

- Route: `/auth/login` (exists as `AppRoutes.LOGIN`)
- Auth: both. Logged out is the page's normal state; logged in was explored with the suite's
  storage state (`npx playwright test --project setup-ui`, then `state-load
.auth/app/appStorageState.json`).
- Explored: 2026-11-22 with playwright-cli, viewport 1920x1080
- Test account: a dedicated account registered for this repo (fake data), credentials only in
  `env/.env.dev` (gitignored). The public demo account used at first was locked on 2026-11-22
  (`423 Locked`); see "Account lockout" below. Next step: the setup registers its own fresh
  user per run, so the suite needs no stored credentials at all.
- Status: Revised 2026-11-22 around users and workflows; findings checked against upstream
  issues. Implemented: LOGIN-01 to LOGIN-05 (green, 23/23 in the full suite on 2026-11-22).

## Users and what they need

Priorities come from these users and how much it hurts them when a workflow breaks, not from
what is easiest to automate.

| User                                              | Goal                                     | Must work                                                           |
| ------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Returning customer                                | Sign in to shop, see orders and invoices | Sign in, stay signed in across reloads and tabs                     |
| Customer who mistypes                             | Get in after a typo                      | A clear error, then a successful retry                              |
| Customer on a shared computer                     | Leave nobody a way into their account    | Sign out; Back must not reopen the account                          |
| Anyone opening an account link while signed out   | Not see someone else's data              | Protected pages send them to login                                  |
| Keyboard and assistive-tech user                  | Sign in without a mouse                  | Sensible Tab order; Enter submits; labelled fields                  |
| Customer pasting from a password manager or email | Sign in with what they pasted            | Capitals and surrounding spaces don't break login                   |
| New visitor / forgetful customer                  | Create an account / reset a password     | The links get them there (the flows themselves are their own plans) |

## Critical workflows (explored live 2026-11-22)

| Workflow                                   | Observed                                                              | Verdict                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------- |
| Sign in with valid credentials             | Lands on `/account`, nav shows the user's name                        | Works (LOGIN-01)                              |
| Reload `/account`; open it in a new tab    | Still signed in both times                                            | Works (LOGIN-18)                              |
| Sign out, then press Back                  | Sent to `/auth/login`, nav shows "Sign in"                            | Works (LOGIN-20)                              |
| Open `/account/favorites` while signed out | Sent to `/auth/login`                                                 | Works (LOGIN-21)                              |
| ...then sign in                            | Lands on `/account`, **not** back on Favorites                        | Gap, see Open question 8 (LOGIN-26)           |
| Keyboard only                              | Tab order: email → password → show/hide button → Login; Enter submits | Works (LOGIN-22)                              |
| Double-click Login                         | **Two** `POST /users/login` requests                                  | Likely defect, see Open question 7 (LOGIN-25) |
| Email in capitals (API)                    | 200                                                                   | Works (LOGIN-23)                              |
| Email with spaces around it (API)          | 401; the form shows no field error and sends the request              | Unknown whether the UI trims (LOGIN-24)       |
| `/checkout` while signed out               | Opens; sign-in happens inside checkout                                | Out of scope: an E2E journey                  |

## Findings and upstream status (checked 2026-11-22)

Checked against the app's public issue tracker, github.com/testsmith-io/practice-software-testing,
open and closed issues. Facts are separated from inferences; only facts go into a bug report.

| Finding                                                | Observed (fact)                                                                       | Inferred, not yet verified                              | Upstream                                                                              | Next step                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Double-click on Login sends two `POST /users/login`    | Yes, live                                                                             | The button is not disabled while the request is pending | Not reported                                                                          | Verify the button state with a delayed (mocked) response, then file as a bug with the lockout impact |
| Email pasted with spaces                               | Form shows no field error and sends the request; the API rejects a padded email (401) | Whether the form trims before sending                   | Not reported                                                                          | Implement LOGIN-24; report only if it fails                                                          |
| No return to the originally requested page after login | Yes, live (`/account/favorites` → login → `/account`)                                 |                                                         | Not reported                                                                          | File as an enhancement, not a bug (Open question 8)                                                  |
| Account lockout                                        | `423 Locked` on the demo account, live                                                |                                                         | By design: issue #843 (closed) locks an account after **3 consecutive failed logins** | Never fail a login on the test account; see LOGIN-19, LOGIN-25                                       |

**Why the double-click matters:** with the 3-attempt lockout, one double-click with a mistyped
password uses up two of the three attempts. That user impact, not test flakiness, is the
argument for the bug report. (A normal Playwright click fires once; the suite is not affected.)

Report format when filing upstream: follow #843 (`[Bug][Login] <title>`; Context, Steps to
Reproduce, Expected/Actual, Environment, Impact). Reports are filed by the repo owner from their
own GitHub account.

**Site versions:** the app also runs as `with-bugs.practicesoftwaretesting.com` (API
`api-with-bugs.practicesoftwaretesting.com`), a Sprint 5 build with a known-bug list in the
upstream repo (`sprint5-with-bugs/testSessions/listOfBugs.md`, not yet read). Idea for later:
run this suite against it to measure which planted bugs the tests catch ("test the tests").
The upstream README does not state that the main site is bug-free.

## Page summary

The login page shows a "Login" heading, a "Sign in with Google" button, and an email and
password form with a show/hide-password button. Validation runs as the user types (no submit
needed), and a wrong email/password pair shows a server-side error below the form. Links lead to
registration and password reset. A user who is already signed in can still open the page; they
are not redirected.

## Element inventory

| Element                         | Proposed locator (verified live)                                                     | Notes                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Heading                         | `getByRole('heading', { name: 'Login' })`                                            | Exists as `AppPage.loginHeading`. Level 3.                                                                                                                                                                                                                                                                                                                       |
| Email field                     | `getByLabel('Email address *')`                                                      | Exists as `AppPage.emailInput`. `type="email"`, placeholder "Your email", `data-test="email"`.                                                                                                                                                                                                                                                                   |
| Password field                  | `getByLabel('Password *')`                                                           | Exists as `AppPage.passwordInput`. `type="password"`, placeholder "Your password", `data-test="password"`.                                                                                                                                                                                                                                                       |
| Show/hide password button       | `getByTestId('login-form').locator('button[type="button"]')`                         | **Approved CSS exception (2026-11-22):** no accessible name, no `data-test`, and the app can't get one. Scoped to the form, where it is the only `button[type="button"]` (Login is an `input type="submit"`, the Google button is outside the form). Needs the `eslint-disable-next-line playwright/no-raw-locators -- <reason>` line per the `selectors` skill. |
| Login button                    | `getByRole('button', { name: 'Login' })`                                             | Exists as `AppPage.loginButton`. An `input type="submit"`, `data-test="login-submit"`.                                                                                                                                                                                                                                                                           |
| Sign in with Google             | `getByRole('button', { name: 'Sign in with Google' })`                               | No `data-test`.                                                                                                                                                                                                                                                                                                                                                  |
| Login form                      | `getByTestId('login-form')`                                                          | The `<form>` has no accessible name, so no `form` role. Used as the visual-check target.                                                                                                                                                                                                                                                                         |
| Email field error               | `getByText(Messages.EMAIL_REQUIRED)` / `getByText(Messages.EMAIL_FORMAT_INVALID)`    | Exist. Rendered in `data-test="email-error"` (`alert alert-danger`).                                                                                                                                                                                                                                                                                             |
| Password field error            | `getByText(Messages.PASSWORD_REQUIRED)` / `getByText(<new PASSWORD_LENGTH_INVALID>)` | Required exists; length is new. Rendered in `data-test="password-error"`.                                                                                                                                                                                                                                                                                        |
| Login error                     | `getByText(Messages.LOGIN_ERROR)`                                                    | Exists as `AppPage.errorMessage`. Container `data-test="login-error"`, `aria-live="assertive"`, below the links.                                                                                                                                                                                                                                                 |
| Register link                   | `getByRole('link', { name: 'Register your account' })`                               | `data-test="register-link"`, goes to `/auth/register`.                                                                                                                                                                                                                                                                                                           |
| Forgot password link            | `getByRole('link', { name: 'Forgot your Password?' })`                               | `data-test="forgot-password-link"`, goes to `/auth/forgot-password`.                                                                                                                                                                                                                                                                                             |
| User menu (signed in)           | `NavigationComponent.userMenu` (`getByTestId('nav-menu')`)                           | Exists. Shows the user's name.                                                                                                                                                                                                                                                                                                                                   |
| Sign out (signed in)            | `NavigationComponent.signOutLink` (`getByTestId('nav-sign-out')`)                    | Exists. A menu item, not a link role.                                                                                                                                                                                                                                                                                                                            |
| Nav "Sign in" link (signed out) | `NavigationComponent.signInLink`                                                     | Exists. `data-test="nav-sign-in"`.                                                                                                                                                                                                                                                                                                                               |

## Messages observed

| Trigger                                                              | Exact text                   | Where it appears                            |
| -------------------------------------------------------------------- | ---------------------------- | ------------------------------------------- |
| Submit with email empty                                              | `Email is required`          | Under the email field (`email-error`)       |
| Submit with password empty                                           | `Password is required`       | Under the password field (`password-error`) |
| Email without a valid format (`not-an-email`), shown while typing    | `Email format is invalid`    | `email-error`                               |
| Password of 2 characters (`ab`), shown while typing                  | `Password length is invalid` | `password-error`                            |
| Well-formed email that has no account, any password of 3+ characters | `Invalid email or password`  | `login-error` alert below the links         |

Field validation messages appear as soon as the field holds an invalid value; clicking Login is not
needed. Passwords of 3 and 4 characters showed no length error, and the inputs have no
`minlength` or `maxlength` attribute, so the minimum is 3 and no maximum was found.

## API calls observed

| Action                                         | Method + endpoint   | Status                                                                        |
| ---------------------------------------------- | ------------------- | ----------------------------------------------------------------------------- |
| Page load, signed out                          | `GET /users/me`     | 401 (twice; also logged as console errors, expected when signed out)          |
| Page load, signed in                           | `GET /users/me`     | 200                                                                           |
| Login with wrong credentials (button or Enter) | `POST /users/login` | 401                                                                           |
| Empty or invalid-format submit                 | none                | No request; validation is client-side                                         |
| Successful login                               | `POST /users/login` | Not observed directly; the suite's `setup-ui` login passed during exploration |

## Scenarios

Ordered by user impact. IDs are stable: implemented scenarios keep theirs, new ones are numbered
from LOGIN-18.

| ID           | Priority | Tag           | User workflow                                                                 | Visual check          | Status                         |
| ------------ | -------- | ------------- | ----------------------------------------------------------------------------- | --------------------- | ------------------------------ |
| LOGIN-01     | P1       | `@smoke`      | Returning customer signs in and sees their own account                        | none                  | implemented                    |
| LOGIN-18     | P1       | `@smoke`      | Signed-in customer stays signed in after a reload and in a new tab            | none                  | new                            |
| LOGIN-02     | P1       | `@smoke`      | Login page loads with its form (fast-fail canary for everything below)        | none                  | implemented                    |
| LOGIN-03     | P2       | `@sanity`     | Customer with a wrong email or password gets a clear error                    | none                  | implemented                    |
| LOGIN-19     | P2       | `@sanity`     | Customer who mistyped the email corrects it and gets in                       | none                  | new                            |
| LOGIN-04     | P2       | `@sanity`     | Customer who submits too early sees what is missing                           | none                  | implemented                    |
| LOGIN-05     | P2       | `@sanity`     | Customer signs out                                                            | none                  | implemented                    |
| LOGIN-20     | P2       | `@sanity`     | After sign-out, Back does not reopen the account (shared computer)            | none                  | new                            |
| LOGIN-21     | P2       | `@sanity`     | Signed-out visitor opening an account page is sent to login                   | none                  | new                            |
| LOGIN-22     | P3       | `@regression` | Keyboard-only customer signs in (Tab order, Enter submits); replaces LOGIN-08 | none                  | new                            |
| LOGIN-23     | P3       | `@regression` | Customer who types the email in capitals gets in                              | none                  | new                            |
| LOGIN-24     | P3       | `@regression` | Email pasted with spaces around it is sent trimmed                            | none                  | new                            |
| LOGIN-06     | P3       | `@regression` | Invalid email format shows the format error                                   | none                  | planned                        |
| LOGIN-07     | P3       | `@regression` | Too-short password shows the length error                                     | none                  | planned                        |
| LOGIN-09     | P3       | `@regression` | New visitor follows "Register your account"                                   | none                  | planned                        |
| LOGIN-10     | P3       | `@regression` | Forgetful customer follows "Forgot your Password?"                            | none                  | planned                        |
| LOGIN-25     | P4       | `@regression` | Impatient double-click sends one login request                                | none                  | new, likely defect             |
| LOGIN-26     | P4       | `@regression` | After being sent to login from an account page, customer returns there        | none                  | new, blocked (Open question 8) |
| LOGIN-11     | P4       | `@regression` | Password length boundary: 3 accepted, 2 rejected                              | none                  | planned                        |
| LOGIN-12     | P4       | `@regression` | Show/hide button reveals and hides the password                               | none                  | planned                        |
| LOGIN-13     | P4       | `@regression` | Signed-in user opening the login page is not redirected                       | none                  | planned                        |
| LOGIN-14     | P5       | `@regression` | Login form, default state                                                     | `toHaveScreenshot`    | planned                        |
| LOGIN-15     | P5       | `@regression` | Login form, required errors shown                                             | `toHaveScreenshot`    | planned                        |
| LOGIN-16     | P5       | `@regression` | Login error alert                                                             | `toHaveScreenshot`    | planned                        |
| LOGIN-17     | P5       | `@regression` | Login form accessibility structure                                            | `toMatchAriaSnapshot` | planned                        |
| ~~LOGIN-08~~ |          |               | Merged into LOGIN-22                                                          |                       | dropped                        |

Unless stated otherwise, every scenario starts signed out: `resetStorageState()` and
`appPage.openLoginPage()` in `beforeEach`, as in the existing `tests/app/functional/login.spec.ts`.

### LOGIN-01: Valid credentials sign the user in (P1, `@smoke`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN the login page is open
    2. WHEN the user logs in with the test account
    3. THEN the account page opens, the user menu is visible and the nav "Sign in" link is gone
- Expected: URL ends with new `AppRoutes.ACCOUNT` (`/account`, confirmed by the user
  2026-11-22; /codetest re-checks it live); the account page's "My account" title visible
  (reported by the user; /codetest confirms its role and exact text live, and adds it to
  `enums/app/`); `nav.userMenu` visible; `nav.signInLink` hidden; `nav.userMenu` shows the
  signed-in user's name, `first_name last_name` from `GET /users/me`. The name is **never
  hardcoded**: it belongs to whichever account `APP_EMAIL` points to.
- Name check (approved 2026-11-22): one `apiRequest` call to `ApiEndpoints.CURRENT_USER` with
  the `setup-api` token (`process.env.ACCESS_TOKEN`, the same `APP_EMAIL` account), in its own
  `test.step()`. Validate the body with a new `CurrentUserSchema` (`z.strictObject`, built from
  the API's OpenAPI document, in `fixtures/api/schemas/app/`), using exactly
  `expect(CurrentUserSchema.parse(body)).toBeTruthy();`, then
  `expect(nav.userMenu).toHaveText(...)` with the parsed names. `UserResponseSchema` is the login
  token response and does not fit.
- Data: `process.env.APP_EMAIL`, `process.env.APP_PASSWORD`.
- Cleanup: none. The test's own fresh session; shared storage state is untouched.
- Visual: none.
- Evidence screenshots: after login.
- Note: **already covered** by `should login successfully with valid credentials` in
  `tests/app/functional/login.spec.ts` (asserts the user menu only). /codetest should extend that
  test with the URL and sign-in-link checks rather than add a duplicate.

### LOGIN-02: Login page shows the form (P1, `@smoke`)

- Preconditions: signed out.
- Steps (Given / When / Then):
    1. GIVEN the user is signed out
    2. WHEN the user opens the login page
    3. THEN the heading, both fields and the Login button are visible
- Expected: `loginHeading`, `emailInput`, `passwordInput`, `loginButton` visible; URL ends with
  `AppRoutes.LOGIN`.
- Data: none.
- Cleanup: none: read-only.
- Visual: none (see LOGIN-14).
- Evidence screenshots: none.

### LOGIN-03: Wrong credentials show the login error (P2, `@sanity`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN the login page is open
    2. WHEN the user logs in with an email that has no account and a well-formed password
    3. THEN "Invalid email or password" is shown and the user stays signed out
- Expected: `errorMessage` (`Messages.LOGIN_ERROR`) visible; URL still `AppRoutes.LOGIN`;
  `nav.signInLink` visible. The page object can wait for `POST /users/login` to answer 401.
- Data: `generateLoginCredentials()` from `test-data/factories/app/user.factory.ts` (random
  email, so the shared test account never collects failed attempts).
- Cleanup: none: no account touched.
- Visual: none (see LOGIN-16).
- Evidence screenshots: after the error appears.
- Note: the existing data-driven loop covers this at `@regression` with fixed emails. This is the
  single fast sanity check.

### LOGIN-04: Empty submit shows both required errors (P2, `@sanity`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN the login page is open with both fields empty
    2. WHEN the user clicks Login
    3. THEN both required errors are shown and no login request is sent
- Expected: `emailRequiredError` and `passwordRequiredError` visible; both fields have
  `aria-invalid="true"` (`toHaveAttribute`).
- Data: none.
- Cleanup: none: read-only.
- Visual: none (see LOGIN-15).
- Evidence screenshots: none.
- Note: the existing loop has an "empty email and password" case at `@regression`; this one adds
  the `aria-invalid` check and runs at sanity level.

### LOGIN-05: Signing out returns to the login page (P2, `@sanity`)

- Preconditions: signed out at the start; the test logs in itself.
- Steps (Given / When / Then):
    1. GIVEN the user has logged in on the login page (own fresh session)
    2. WHEN the user opens the user menu and clicks Sign out
    3. THEN the login page is shown and the nav shows "Sign in" again
- Expected: URL ends with `AppRoutes.LOGIN`; `nav.signInLink` visible; `nav.userMenu` hidden.
- Data: `process.env.APP_EMAIL`, `process.env.APP_PASSWORD`.
- Cleanup: none. The test signs out its **own** session. It must not sign out the shared storage
  state, which other tests reuse; logging in first keeps it off `@destructive`.
- Visual: none.
- Evidence screenshots: after sign out.

### LOGIN-06: Invalid email format shows the format error (P3, `@regression`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN the login page is open
    2. WHEN the user types `not-an-email` into the email field
    3. THEN "Email format is invalid" is shown, before any submit
- Expected: `emailFormatError` visible without clicking Login.
- Data: the observed value comes from `INVALID_EMAILS` (`plaintext` is the same shape) in
  `test-data/static/util/invalid-values.ts` or `test-data/static/app/invalidCredentials.ts`. See
  Open questions on looping the full set.
- Cleanup: none: read-only.
- Visual: none.
- Evidence screenshots: none.

### LOGIN-07: Too-short password shows the length error (P3, `@regression`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN the login page is open
    2. WHEN the user types a 2-character password
    3. THEN "Password length is invalid" is shown
- Expected: new `passwordLengthError` locator visible.
- Data: a 2-character value in a static boundary set (see LOGIN-11).
- Cleanup: none: read-only.
- Visual: none.
- Evidence screenshots: none.

### ~~LOGIN-08: Enter in the password field submits the form~~ (merged into LOGIN-22)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN valid-format wrong credentials are filled in
    2. WHEN the user presses Enter in the password field
    3. THEN a login request is sent and the login error is shown
- Expected: `POST /users/login` answers 401 (`waitForResponse` in the page-object action);
  `errorMessage` visible.
- Data: `generateLoginCredentials()`.
- Cleanup: none.
- Visual: none.
- Evidence screenshots: none.

### LOGIN-09: Register link opens registration (P3, `@regression`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN the login page is open
    2. WHEN the user clicks "Register your account"
    3. THEN the registration page opens
- Expected: URL ends with new `AppRoutes.REGISTER` (`/auth/register`).
- Data: none.
- Cleanup: none: read-only.
- Visual: none.
- Evidence screenshots: none.

### LOGIN-10: Forgot-password link opens password reset (P3, `@regression`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN the login page is open
    2. WHEN the user clicks "Forgot your Password?"
    3. THEN the password reset page opens
- Expected: URL ends with new `AppRoutes.FORGOT_PASSWORD` (`/auth/forgot-password`).
- Data: none.
- Cleanup: none: read-only.
- Visual: none.
- Evidence screenshots: none.

### LOGIN-11: Password length boundary (P4, `@regression`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN the login page is open
    2. WHEN the user types a password of each boundary length
    3. THEN 2 characters show the length error; 3 characters do not
- Expected: 2 chars: `passwordLengthError` visible. 3 chars: `passwordLengthError` hidden.
- Data: new static boundary set in `test-data/static/app/` (`as const`), with the minimum length
  as a named constant, not an inline number.
- Cleanup: none: read-only.
- Visual: none.
- Evidence screenshots: none.

### LOGIN-12: Show/hide button reveals and hides the password (P4, `@regression`)

- Preconditions: signed out, on the login page. Uses the approved scoped CSS locator from the
  element inventory.
- Steps (Given / When / Then):
    1. GIVEN a password is typed in
    2. WHEN the user clicks the show/hide button, then clicks it again
    3. THEN the field shows the text, then hides it again
- Expected: `passwordInput` has `type="text"` after the first click and `type="password"`
  after the second (observed live).
- Data: `generateLoginCredentials().password`.
- Cleanup: none: read-only.
- Visual: none.
- Evidence screenshots: none.

### LOGIN-13: Signed-in user opening the login page is not redirected (P4, `@regression`)

- Preconditions: signed in (the `chromium` project's default storage state; no
  `resetStorageState()` for this test).
- Steps (Given / When / Then):
    1. GIVEN the user is signed in
    2. WHEN the user opens the login page
    3. THEN the login form shows, and the nav shows the user menu
- Expected: URL ends with `AppRoutes.LOGIN`; `loginButton` and `nav.userMenu` visible.
- Data: storage state.
- Cleanup: none: read-only.
- Visual: none.
- Evidence screenshots: on load.
- Note: this pins observed behaviour. See Open questions on whether it is intended.

> **Visual baselines (decided 2026-11-22):** LOGIN-14 to LOGIN-16 baselines are created on
> Windows only for now (`*-chromium-win32.png`, Playwright's default per-OS naming). Linux
> baselines are added side by side once the dev container works; until then the visual tests
> are not expected to pass in a Linux CI run.

### LOGIN-14: Login form, default state (P5, `@regression`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN the login page is open with empty fields
    2. WHEN nothing is typed
    3. THEN the form matches its baseline
- Expected: `expect(getByTestId('login-form')).toHaveScreenshot('login-form-default.png')`.
- Data: none.
- Cleanup: none: read-only.
- Visual: element screenshot of the form. No masks needed: the form holds no dynamic content.
  Not full page: the footer shows a build date (`Built 2026-10-11`) and floating chat and
  activity buttons.
- Evidence screenshots: none (the baseline is the evidence).

### LOGIN-15: Login form, required errors shown (P5, `@regression`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN the login page is open with empty fields
    2. WHEN the user clicks Login
    3. THEN the form with both required errors matches its baseline
- Expected: wait for both errors to be visible, then
  `toHaveScreenshot('login-form-required-errors.png')` on the form.
- Data: none.
- Cleanup: none: read-only.
- Visual: element screenshot of the form, no masks.
- Evidence screenshots: none.

### LOGIN-16: Login error alert (P5, `@regression`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN wrong credentials were submitted
    2. WHEN the login error appears
    3. THEN the alert matches its baseline
- Expected: `toHaveScreenshot('login-error-alert.png')` on the `login-error` container
  (`getByTestId('login-error')`), after `errorMessage` is visible.
- Data: `generateLoginCredentials()`. The alert does not show the email, so random data does not
  change the image.
- Cleanup: none.
- Visual: element screenshot of the alert, no masks.
- Evidence screenshots: none.

### LOGIN-17: Login form accessibility structure (P5, `@regression`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN the login page is open with empty fields
    2. WHEN nothing is typed
    3. THEN the form's accessibility tree matches its stored snapshot
- Expected: `expect(getByTestId('login-form')).toMatchAriaSnapshot({ name: 'login-form.aria.yml' })`.
  Observed live: textbox "Email address _", textbox "Password _", the unnamed show/hide button,
  button "Login". The stored snapshot is generated from the live app, never hand-written.
- Data: none.
- Cleanup: none: read-only.
- Visual: structural, not pixels. OS-independent, so it runs on Windows and Linux CI alike
  (added 2026-11-22 as the cross-platform complement to LOGIN-14).
- Evidence screenshots: none.
- Note: the snapshot will record that the show/hide button has no accessible name. That is an
  accessibility gap in the app; the snapshot pins today's state, and if the app ever adds a
  name, the snapshot fails and is updated deliberately.

### LOGIN-18: Signed-in customer stays signed in after a reload and in a new tab (P1, `@smoke`)

- Preconditions: signed in (the `chromium` project's storage state; no `resetStorageState()`).
- Steps (Given / When / Then):
    1. GIVEN the customer is on `/account`
    2. WHEN they reload the page, and when they open `/account` in a new tab of the same context
    3. THEN both times the "My account" heading and the user menu are visible
- Expected: `accountHeading` and `nav.userMenu` visible after `page.reload()` and in
  `context.newPage()`; URL ends with `AppRoutes.ACCOUNT` both times.
- Data: storage state.
- Cleanup: none: read-only; the new tab is closed.
- Visual: none.
- Evidence screenshots: none.
- Note: needs an `openAccountPage()` action and the account heading reachable from a second
  page; /codetest decides whether that means an `AccountPage` object (see Open question 5).

### LOGIN-19: Customer who mistyped the email corrects it and gets in (P2, `@sanity`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN the customer logged in with a wrong email (random, from the factory) and the real
       password, and sees "Invalid email or password"
    2. WHEN they correct the email to the real one and submit again
    3. THEN they land on `/account` signed in, and the login error is gone
- Expected: first attempt `POST /users/login` 401 and `errorMessage` visible; second attempt
  lands on `AppRoutes.ACCOUNT`, `nav.userMenu` visible, `errorMessage` hidden.
- Data: `generateLoginCredentials().email` for the typo; `APP_EMAIL` / `APP_PASSWORD` for the fix.
- Cleanup: none.
- Visual: none.
- Evidence screenshots: after the error, after the successful retry.
- Note: the typo is in the **email** on purpose: a wrong password would count a failed attempt
  against the shared account and risk locking it. The password-typo variant needs a dedicated
  account (Out of scope).

### LOGIN-20: After sign-out, Back does not reopen the account (P2, `@sanity`)

- Preconditions: signed out at the start; the test logs in with its own session (as LOGIN-05).
- Steps (Given / When / Then):
    1. GIVEN the customer logged in, landed on `/account`, and signed out
    2. WHEN they press the browser Back button
    3. THEN they see the login page, not the account page
- Expected: after `page.goBack()`: URL ends with `AppRoutes.LOGIN`; `loginHeading` visible;
  `accountHeading` hidden; `nav.signInLink` visible. (Observed live: Back briefly targets
  `/account`, then the app redirects to `/auth/login`.)
- Data: `APP_EMAIL`, `APP_PASSWORD`.
- Cleanup: none: only the test's own session is signed out.
- Visual: none.
- Evidence screenshots: after Back.

### LOGIN-21: Signed-out visitor opening an account page is sent to login (P2, `@sanity`)

- Preconditions: signed out.
- Steps (Given / When / Then):
    1. GIVEN the visitor is signed out
    2. WHEN they open `/account` directly
    3. THEN they are sent to the login page and no account content is shown
- Expected: URL ends with `AppRoutes.LOGIN`; `loginHeading` visible; `accountHeading` hidden.
  (Observed live for `/account` and `/account/favorites`.)
- Data: none.
- Cleanup: none: read-only.
- Visual: none.
- Evidence screenshots: none.

### LOGIN-22: Keyboard-only customer signs in (P3, `@regression`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN focus is in the email field
    2. WHEN the customer presses Tab through the form, types the credentials, and presses Enter in
       the password field
    3. THEN focus moves email → password → show/hide button → Login, and Enter signs them in
- Expected: `toBeFocused()` on `emailInput`, `passwordInput`, the show/hide button, `loginButton`
  in that order (observed live); after Enter, URL ends with `AppRoutes.ACCOUNT`.
- Data: `APP_EMAIL`, `APP_PASSWORD`.
- Cleanup: none.
- Visual: none.
- Evidence screenshots: none.

### LOGIN-23: Customer who types the email in capitals gets in (P3, `@regression`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN the login page is open
    2. WHEN the customer logs in with `APP_EMAIL` in upper case and the right password
    3. THEN they land on `/account` signed in
- Expected: URL ends with `AppRoutes.ACCOUNT`; `nav.userMenu` visible. (The API accepted an
  upper-case email with 200 during exploration.)
- Data: `process.env.APP_EMAIL!.toUpperCase()`, `APP_PASSWORD`.
- Cleanup: none.
- Visual: none.
- Evidence screenshots: none.

### LOGIN-24: Email pasted with spaces around it is sent trimmed (P3, `@regression`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN the login page is open
    2. WHEN the customer submits an email with two spaces before and after it
    3. THEN the login request carries the email without the spaces
- Expected: the `POST /users/login` request body's `email` equals the trimmed value
  (`request.postDataJSON()` in a page-object action that waits for the request).
- Data: `generateLoginCredentials()` (random email, so the shared account is never touched; the
  response is a 401 either way, so only the request body proves trimming).
- Cleanup: none.
- Visual: none.
- Evidence screenshots: none.
- Note: observed live, the form shows no field error for the padded email and sends the request,
  and the API rejects a padded email (401). If the UI does not trim, a real user who pastes
  their email with a trailing space cannot sign in and sees "Invalid email or password": the test
  then fails and is reported as a likely defect (Open question 7).

### LOGIN-25: Impatient double-click sends one login request (P4, `@regression`)

- Preconditions: signed out, on the login page.
- Steps (Given / When / Then):
    1. GIVEN valid-format credentials for an email with no account are filled in
    2. WHEN the customer double-clicks Login
    3. THEN exactly one login request is sent
- Expected: one `POST /users/login`. **Observed live: two.** The app locks an account after 3
  consecutive failed logins (upstream #843), so one double-click with a mistyped password uses
  two of the three attempts.
- Data: `generateLoginCredentials()`.
- Cleanup: none.
- Visual: none.
- Evidence screenshots: none.
- Note: a known defect (Open question 7, option c): written with the correct expectation and
  marked `test.fail()` with a `// BUG:` line. Upstream status: not reported yet (see Findings).

### LOGIN-26: After being sent to login from an account page, customer returns there (P4, `@regression`)

- **Blocked** until Open question 8 is answered.
- Observed live: opening `/account/favorites` signed out leads to `/auth/login` (no return
  parameter in the URL); after signing in, the customer lands on `/account`, not Favorites.
- If it is a requirement: expected URL after login ends with the Favorites route. If not: drop
  this scenario and record the behaviour under Out of scope.

## Code this plan will need

- Page object / component: login locators stay in `pages/app/app.page.ts` (`AppPage`). New
  members: `passwordLengthError`, `loginForm`, `loginErrorAlert`, `googleSignInButton`,
  `registerLink`, `forgotPasswordLink`, `passwordToggle` (approved scoped CSS), plus actions
  such as `submitWithEnter` and `togglePasswordVisibility`. New `pages/app/account.page.ts`
  (`AccountPage`: heading, `openAccountPage()`) takes over `accountHeading` (Open question 5).
  `NavigationComponent` already has the sign-in, user-menu and sign-out locators.
- Fixture registration: exists (`appPage`, `resetStorageState`); add `accountPage`.
- Enums (`enums/app/app.ts`): `Messages.PASSWORD_LENGTH_INVALID = 'Password length is invalid'`;
  `AppRoutes.REGISTER = '/auth/register'`; `AppRoutes.FORGOT_PASSWORD = '/auth/forgot-password'`;
  `AppRoutes.ACCOUNT = '/account'`.
  These are additions; no existing value changes.
- Schemas: new `CurrentUserSchema` for `GET /users/me` in `fixtures/api/schemas/app/`, built from
  the OpenAPI document (`api-testing` + `type-safety` skills). If the live response disagrees
  with the document, follow the `api-testing` protocol and report it; never loosen the schema.
- Factories / static data: `generateLoginCredentials()` exists. Add a password-length boundary
  set under `test-data/static/app/`.
- Config constants: minimum password length (3); a screenshot diff tolerance in `config/` only
  if the first baselines prove flaky, starting from Playwright's default.
- Specs: extend `tests/app/functional/login.spec.ts`.

## Out of scope

- **Sign in with Google**: a third-party OAuth flow; it can't be automated reliably and isn't this
  app's code. LOGIN-02 could assert the button is visible if wanted.
- **Account lockout after repeated failures**: by design, 3 consecutive failed logins lock an
  account (upstream #843; the lock message there is "Account locked, too many failed attempts.
  Please contact the administrator.", not yet seen live). Not tested: it would lock the test
  account. Testable once the setup registers a throwaway user per run, or with a mocked `423`.
- **Registration and password-reset pages themselves**: their own `/page` runs.
- **Nav bar, footer, chat and live-activity widgets**: shared across pages, not login behaviour.
- **Localisation** (language switcher): changes shared state; a separate plan.
- **Console errors on load** (`GET /users/me` 401 twice when signed out): expected for an
  anonymous visitor, so no test.
- **Password-typo recovery on the real account**: each wrong password counts against the shared
  account; LOGIN-19 covers recovery with an email typo instead. Needs a dedicated account.
- **Sign-in inside checkout**: `/checkout` opens signed out and handles sign-in in its own flow;
  that belongs to the checkout E2E journey.

## Open questions

1. ~~Show/hide password button locator.~~ **Resolved 2026-11-22:** no `data-test` can be
   added; a scoped CSS selector is approved (see the element inventory).
2. ~~Where does a successful login land?~~ **Resolved 2026-11-22:** `/account` (user
   confirmed); LOGIN-01 asserts it.
3. **Is a signed-in user meant to see the login page?** No redirect happens today. If that's a
   bug, LOGIN-13 would pin the wrong behaviour; tell me to drop it or flip it to expect a
   redirect.
4. **Resolved 2026-11-22:** LOGIN-06 uses the value observed live (`not-an-email`); looping
   all of `INVALID_EMAILS` is deferred. Original question:
   **Existing static data not re-verified.** `INVALID_LOGIN_ATTEMPTS` includes
   `missing@domain` + `short`, expecting the server error. I didn't re-check that case or loop
   the full `INVALID_EMAILS` set. Should LOGIN-06 loop all of `INVALID_EMAILS` (each value
   verified live during /codetest), or stay with the observed value?
5. ~~Page-object layout.~~ **Resolved 2026-11-22:** login locators stay in `AppPage`; a new
   `AccountPage` (`pages/app/account.page.ts`: heading, `openAccountPage()`) takes over
   `accountHeading` from `AppPage`, registered as a fixture.
6. ~~Check the signed-in user's name?~~ **Resolved 2026-11-22:** yes, from `GET /users/me`
   with a new `CurrentUserSchema` (see LOGIN-01).
7. **Resolved 2026-11-22: option (c).** A test for a confirmed likely defect is marked
   `test.fail()` with a `// BUG:` line describing the defect and its evidence; nothing else may
   use `test.fail()`. Original question kept for the record:
   **How do we handle tests that document a likely defect?** LOGIN-25 (double-click sends two
   requests) fails today, and LOGIN-24 may. `/codetest` forbids `test.fail` and skips, so the
   choices are: (a) keep them red in the suite (honest, but `npm test` is never green);
   (b) don't automate yet, and record each defect in a `BUGS.md` with steps and evidence,
   automating once fixed; (c) allow `test.fail()` with a `// BUG:` link for known defects
   only, which keeps the suite green and flips to red when the app is fixed. I recommend (c) for
   a portfolio: it shows the defect, keeps CI green and is self-updating. It needs your explicit
   rule change, because `/codetest` currently forbids it.
8. **Is "return to where you were" a requirement?** After being sent to login from
   `/account/favorites`, the customer lands on `/account`. If returning there is expected,
   LOGIN-26 is a test (and a defect); if not, I drop LOGIN-26.

## Proposal

- Scope: `plans/login.md` only; code in the section above is for /codetest
- Confidence: 7 (medium)
- Rationale:
    - +: every locator and message was seen live; most locators already exist in `AppPage` and
      the nav component.
    - +: no shared state is mutated in any planned scenario.
    - +: the show/hide button's CSS exception is approved.
    - +: the post-login landing URL is confirmed (`/account`).
    - +: revised 2026-11-22 from user workflows; every new workflow was checked live.
    - -: whether the no-redirect behaviour is intended is unconfirmed.
    - -: one likely defect found (double-click), one possible (email spaces), one gap (return-to);
      their handling depends on Open questions 7 and 8.
- Unknowns: open questions 3 (affects LOGIN-13, P4) and 8 (affects LOGIN-26, P4). P1 to P3
  are unblocked.
