import type { Locator } from '@playwright/test';
import { ApiEndpoints, AppRoutes } from '../../../enums/app/app';
import {
    CurrentUser,
    CurrentUserSchema,
} from '../../../fixtures/api/schemas/app/currentUserSchema';
import { expect, test } from '../../../fixtures/pom/test-options';
import { AppPage } from '../../../pages/app/app.page';
import { generateLoginCredentials } from '../../../test-data/factories/app/user.factory';
import { INVALID_LOGIN_ATTEMPTS } from '../../../test-data/static/app/invalidCredentials';

/** Maps an expected-error kind from the static data to its page-object locator. */
const errorLocator = (
    appPage: AppPage,
    kind: (typeof INVALID_LOGIN_ATTEMPTS)[number]['expectedErrors'][number]
): Locator => {
    switch (kind) {
        case 'invalid-credentials':
            return appPage.errorMessage;
        case 'email-format':
            return appPage.emailFormatError;
        case 'email-required':
            return appPage.emailRequiredError;
        case 'password-required':
            return appPage.passwordRequiredError;
    }
};

/**
 * Example functional test suite for login functionality.
 * Replace this with your actual login tests.
 */
test.describe('functional login', () => {
    test.beforeEach(async ({ resetStorageState, appPage }) => {
        await resetStorageState();
        await appPage.openLoginPage();
    });

    test(
        'should show the login form',
        { tag: '@smoke' },
        async ({ page, appPage }) => {
            await test.step('GIVEN the user is signed out on the login page', async () => {
                await expect(page).toHaveURL(
                    `${process.env.APP_URL!}${AppRoutes.LOGIN}`
                );
            });

            await test.step('THEN the heading, both fields and the Login button are visible', async () => {
                await expect(appPage.loginHeading).toBeVisible();
                await expect(appPage.emailInput).toBeVisible();
                await expect(appPage.passwordInput).toBeVisible();
                await expect(appPage.loginButton).toBeVisible();
            });
        }
    );

    test(
        'should login successfully with valid credentials',
        { tag: '@smoke' },
        async ({ page, appPage, apiRequest }) => {
            await test.step('WHEN user enters valid credentials', async () => {
                await appPage.login(
                    process.env.APP_EMAIL!,
                    process.env.APP_PASSWORD!
                );
            });

            await test.step('THEN the account page opens and the user is signed in', async () => {
                await expect(page).toHaveURL(
                    `${process.env.APP_URL!}${AppRoutes.ACCOUNT}`
                );
                await expect(appPage.accountHeading).toBeVisible();
                await expect(appPage.username).toBeVisible();
                await expect(appPage.nav.signInLink).toBeHidden();
                await test.info().attach('after login', {
                    body: await page.screenshot(),
                    contentType: 'image/png',
                });
            });

            await test.step('AND the nav shows the name of the signed-in user from GET /users/me', async () => {
                const { status, body } = await apiRequest<CurrentUser>({
                    method: 'GET',
                    url: ApiEndpoints.CURRENT_USER,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                });

                expect(status).toBe(200);
                expect(CurrentUserSchema.parse(body)).toBeTruthy();

                const { first_name, last_name } = CurrentUserSchema.parse(body);
                await expect(appPage.nav.userMenu).toHaveText(
                    `${first_name ?? ''} ${last_name ?? ''}`
                );
            });
        }
    );

    test(
        'should show the login error for wrong credentials',
        { tag: '@sanity' },
        async ({ page, appPage }) => {
            const { email, password } = generateLoginCredentials();

            await test.step('WHEN user logs in with an email that has no account', async () => {
                const status = await appPage.loginAndWaitForResponse(
                    email,
                    password
                );
                expect(status).toBe(401);
            });

            await test.step('THEN the login error is shown and the user stays signed out', async () => {
                await expect(appPage.errorMessage).toBeVisible();
                await expect(page).toHaveURL(
                    `${process.env.APP_URL!}${AppRoutes.LOGIN}`
                );
                await expect(appPage.nav.signInLink).toBeVisible();
                await test.info().attach('login error shown', {
                    body: await page.screenshot(),
                    contentType: 'image/png',
                });
            });
        }
    );

    test(
        'should show both required errors on an empty submit',
        { tag: '@sanity' },
        async ({ page, appPage }) => {
            const loginRequests: string[] = [];
            page.on('request', (request) => {
                if (request.url().endsWith(ApiEndpoints.LOGIN)) {
                    loginRequests.push(request.url());
                }
            });

            await test.step('WHEN user clicks Login with both fields empty', async () => {
                await appPage.submit();
            });

            await test.step('THEN both required errors are shown and the fields are marked invalid', async () => {
                await expect(appPage.emailRequiredError).toBeVisible();
                await expect(appPage.passwordRequiredError).toBeVisible();
                await expect(appPage.emailInput).toHaveAttribute(
                    'aria-invalid',
                    'true'
                );
                await expect(appPage.passwordInput).toHaveAttribute(
                    'aria-invalid',
                    'true'
                );
            });

            await test.step('AND no login request is sent', async () => {
                expect(loginRequests).toHaveLength(0);
            });
        }
    );

    test(
        'should return to the login page after signing out',
        { tag: '@sanity' },
        async ({ page, appPage }) => {
            await test.step('GIVEN the user has logged in with a session of their own', async () => {
                await appPage.loginAndVerify(
                    process.env.APP_EMAIL!,
                    process.env.APP_PASSWORD!
                );
            });

            await test.step('WHEN the user signs out from the user menu', async () => {
                await appPage.nav.signOut();
            });

            await test.step('THEN the login page is shown and the nav offers Sign in again', async () => {
                await expect(page).toHaveURL(
                    `${process.env.APP_URL!}${AppRoutes.LOGIN}`
                );
                await expect(appPage.nav.signInLink).toBeVisible();
                await expect(appPage.nav.userMenu).toBeHidden();
                await test.info().attach('after sign out', {
                    body: await page.screenshot(),
                    contentType: 'image/png',
                });
            });
        }
    );

    for (const {
        description,
        email,
        password,
        expectedErrors,
    } of INVALID_LOGIN_ATTEMPTS) {
        test(
            `should show error for invalid credentials - ${description}`,
            { tag: '@regression' },
            async ({ appPage }) => {
                await test.step(`WHEN user enters invalid credentials - email: ${email}`, async () => {
                    await appPage.login(email, password);
                });

                await test.step('THEN the expected error messages should be displayed', async () => {
                    for (const kind of expectedErrors) {
                        await expect(errorLocator(appPage, kind)).toBeVisible();
                    }
                });
            }
        );
    }
});
