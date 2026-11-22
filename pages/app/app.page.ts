import { expect, Locator, Page } from '@playwright/test';
import { ApiEndpoints, AppRoutes, Messages } from '../../enums/app/app';
import { NavigationComponent } from '../components/navigation.component';

/**
 * Page Object for the main application page.
 * Contains locators and methods for interacting with the application.
 *
 * This example demonstrates the recommended locator priority:
 * 1. getByRole() - Accessibility-based (most recommended)
 * 2. getByLabel() - Form labels
 * 3. getByPlaceholder() - Placeholder text
 * 4. getByText() - Text content
 * 5. getByTestId() - Test IDs (fallback when semantic locators aren't possible)
 *
 * This also demonstrates the component composition pattern where reusable
 * UI components (like NavigationComponent) are composed into page objects.
 */
export class AppPage {
    /** Navigation component for header/nav interactions */
    readonly nav: NavigationComponent;

    constructor(private readonly page: Page) {
        this.nav = new NavigationComponent(page);
    }

    // ==================== Locators ====================

    get loginHeading(): Locator {
        return this.page.getByRole('heading', { name: 'Login' });
    }

    get username(): Locator {
        return this.page.getByTestId('nav-menu');
    }

    get emailInput(): Locator {
        return this.page.getByLabel('Email address *');
    }

    get passwordInput(): Locator {
        return this.page.getByLabel('Password *');
    }

    get loginButton(): Locator {
        return this.page.getByRole('button', { name: 'Login' });
    }

    get errorMessage(): Locator {
        return this.page.getByText(Messages.LOGIN_ERROR);
    }

    get emailRequiredError(): Locator {
        return this.page.getByText(Messages.EMAIL_REQUIRED);
    }

    get passwordRequiredError(): Locator {
        return this.page.getByText(Messages.PASSWORD_REQUIRED);
    }

    get emailFormatError(): Locator {
        return this.page.getByText(Messages.EMAIL_FORMAT_INVALID);
    }

    // Title of the account page a successful login lands on.
    get accountHeading(): Locator {
        return this.page.getByRole('heading', { name: 'My account', level: 1 });
    }

    // ==================== Actions ====================

    /**
     * Navigates to the application home page using the configured APP_URL.
     * Waits for the page to reach DOM content loaded state.
     *
     * @returns {Promise<void>} Resolves when navigation is complete.
     */
    async openHomePage(): Promise<void> {
        await this.page.goto(process.env.APP_URL!, {
            waitUntil: 'domcontentloaded',
        });
    }

    /**
     * Navigates to the login page using the configured APP_URL and the
     * LOGIN route. Waits for the page to reach DOM content loaded state.
     *
     * @returns {Promise<void>} Resolves when navigation is complete.
     */
    async openLoginPage(): Promise<void> {
        await this.page.goto(`${process.env.APP_URL!}${AppRoutes.LOGIN}`, {
            waitUntil: 'domcontentloaded',
        });
    }

    /**
     * Performs login with the provided credentials.
     * Fills in the email and password fields and clicks the login button.
     *
     * Note: no response wait here — invalid input can be rejected by
     * client-side validation without any request being sent. Callers assert
     * the outcome with web-first assertions, which wait automatically.
     *
     * @param {string} email - The user's email address.
     * @param {string} password - The user's password.
     * @returns {Promise<void>} Resolves when the form has been submitted.
     *
     * @example
     * ```ts
     * await appPage.login('user@example.com', 'password123');
     * await expect(appPage.username).toBeVisible();
     * ```
     */
    async login(email: string, password: string): Promise<void> {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);

        await this.loginButton.click();
    }

    /**
     * Fills in the credentials, submits the form and waits for the login API
     * to answer. Use it only when the input passes client-side validation;
     * otherwise no request is sent and the wait never resolves.
     *
     * @param {string} email - The user's email address.
     * @param {string} password - The user's password.
     * @returns {Promise<number>} The HTTP status of the login API response.
     */
    async loginAndWaitForResponse(
        email: string,
        password: string
    ): Promise<number> {
        const responsePromise = this.page.waitForResponse(
            (response) =>
                response.url().endsWith(ApiEndpoints.LOGIN) &&
                response.request().method() === 'POST'
        );
        await this.login(email, password);
        const response = await responsePromise;
        return response.status();
    }

    /**
     * Clicks the Login button without filling anything in.
     *
     * @returns {Promise<void>} Resolves when the button has been clicked.
     */
    async submit(): Promise<void> {
        await this.loginButton.click();
    }

    /**
     * Performs login and verifies successful login by checking username visibility.
     * Use this method when you expect the login to succeed.
     *
     * @param {string} email - The user's email address.
     * @param {string} password - The user's password.
     * @returns {Promise<void>} Resolves when login is verified successful.
     */
    async loginAndVerify(email: string, password: string): Promise<void> {
        await this.login(email, password);
        await expect(this.username).toBeVisible();
    }
}
