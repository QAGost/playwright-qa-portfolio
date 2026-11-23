import { Locator, Page } from '@playwright/test';
import { AppRoutes, Messages } from '../../enums/app/app';

/**
 * Page Object for the home page (`/`): product search, sort, filters and the
 * product grid. Locators verified live with playwright-cli on 2026-11-23
 * (plans/product-search.md, element inventory).
 */
export class HomePage {
    constructor(private readonly page: Page) {}

    // ==================== Locators ====================

    get searchInput(): Locator {
        return this.page.getByRole('textbox', { name: 'Search' });
    }

    get searchButton(): Locator {
        return this.page.getByRole('button', { name: 'Search', exact: true });
    }

    get searchCaption(): Locator {
        return this.page.getByRole('heading', {
            name: new RegExp(`^${Messages.SEARCH_CAPTION_PREFIX}`),
        });
    }

    // No role or label: the count is a plain element with a test id.
    get searchResultCount(): Locator {
        return this.page.getByTestId('search-result-count');
    }

    // Set by the app once a search has finished rendering.
    get searchCompleted(): Locator {
        return this.page.getByTestId('search_completed');
    }

    get productNames(): Locator {
        return this.page.getByTestId('product-name');
    }

    // Cards are links; ids are generated per data reset, so a card is found by its name.
    productCard(name: string): Locator {
        return this.page.getByRole('link').filter({
            has: this.page.getByRole('heading', { name, exact: true }),
        });
    }

    productCardPrice(name: string): Locator {
        return this.productCard(name).getByTestId('product-price');
    }

    // ==================== Actions ====================

    /**
     * Opens the home page.
     *
     * @returns {Promise<void>} Resolves when the page has loaded.
     */
    async open(): Promise<void> {
        await this.page.goto(`${process.env.APP_URL!}${AppRoutes.HOME}`, {
            waitUntil: 'domcontentloaded',
        });
    }

    /**
     * Searches with the Search button and waits until the app marks the
     * search as finished.
     *
     * @param {string} term - The text to search for.
     * @returns {Promise<void>} Resolves when the results are rendered.
     */
    async search(term: string): Promise<void> {
        await this.searchInput.fill(term);
        await this.searchButton.click();
        await this.searchCompleted.waitFor();
    }

    /**
     * Opens a product from the grid by clicking its name (the card's image
     * area also holds a Compare button, so the name is the safe target).
     *
     * @param {string} name - The exact product name shown on the card.
     * @returns {Promise<void>} Resolves when the click has been made.
     */
    async openProduct(name: string): Promise<void> {
        await this.productCard(name)
            .getByRole('heading', { name, exact: true })
            .click();
    }

    /**
     * Builds the expected result-count text for a search.
     *
     * @param {number} count - The number of products listed.
     * @param {string} term - The term as typed.
     * @returns {string} The text the count element should show.
     */
    resultCountText(count: number, term: string): string {
        return Messages.SEARCH_RESULT_COUNT.replace(
            '{count}',
            String(count)
        ).replace('{term}', term);
    }
}
