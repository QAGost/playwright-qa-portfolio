# [Bug][Login] Double-clicking the Login button sends two login requests

| | |
| --- | --- |
| Status | Drafted 2026-11-22; not yet filed upstream |
| Upstream issue | _to be added once filed at github.com/testsmith-io/practice-software-testing_ |
| Found by | Test plan [`plans/login.md`](../../plans/login.md), scenario LOGIN-25 |
| Severity (my assessment) | Minor; higher if each request counts toward the account lockout |

## Context

On the login page, the Login button stays clickable after the first click. A double-click
sends two `POST /users/login` requests for a single login attempt.

Because an account is locked after 3 consecutive failed logins (see upstream #843), this can
shorten a user's remaining attempts: a user who mistypes their password and double-clicks
may use two of their three attempts at once.

## Steps to Reproduce

1. Open https://practicesoftwaretesting.com/auth/login (signed out).
2. Open the browser's developer tools, Network tab.
3. Enter a well-formed email address that has no account, e.g. `nobody@example.com`,
   and any password of at least 3 characters.
4. Double-click the **Login** button.

Automated reproduction (Playwright):

```ts
await page.goto('https://practicesoftwaretesting.com/auth/login');
await page.getByLabel('Email address *').fill('nobody@example.com');
await page.getByLabel('Password *').fill('WrongPass123!');
const logins: string[] = [];
page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().endsWith('/users/login')) logins.push(r.url());
});
await page.getByRole('button', { name: 'Login' }).dblclick();
await expect(page.getByText('Invalid email or password')).toBeVisible();
console.log(logins.length); // 2
```

## Expected

One login attempt sends one `POST /users/login` request. Further clicks are ignored while
that request is pending (for example, the button is disabled until the response arrives).

## Actual

Two `POST /users/login` requests are sent. The page then shows "Invalid email or password"
as usual.

## Environment

- Site: https://practicesoftwaretesting.com (footer: v2.5 | Built 2026-10-11 | Angular 20.0.5)
- API: https://api.practicesoftwaretesting.com
- Browser: Chromium (Chrome for Testing 158), Windows 10, viewport 1920x1080
- Observed: 2026-11-22

## Impact

- A double-click may count as two failed login attempts for an existing account. With the
  3-attempt lockout from #843, a user could lock their account after two double-clicks. This
  was reproduced only with an email that has no account, to avoid locking a real one, so
  whether the server counts both requests is still to be confirmed.
- Every double-click sends an extra request to the API.

## Not verified

- Whether the button is disabled at any point while the request is pending. The two requests
  suggest it is not, but the button state was not inspected mid-request.
