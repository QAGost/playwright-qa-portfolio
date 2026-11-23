import { Locator, Page } from '@playwright/test';

/**
 * Page Object for a product detail page (`/product/<generated id>`).
 * Only the locators the product search tests need, verified live with
 * playwright-cli on 2026-11-23; the product page's own plan adds the rest.
 */
export class ProductPage {
    constructor(private readonly page: Page) {}

    // ==================== Locators ====================

    get productName(): Locator {
        return this.page.getByRole('heading', { level: 1 });
    }

    // The number only ("66.54"); the currency sign sits outside this element.
    get unitPrice(): Locator {
        return this.page.getByTestId('unit-price');
    }
}
