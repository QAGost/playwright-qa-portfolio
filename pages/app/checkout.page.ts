import { Locator, Page } from '@playwright/test';
import { appConfig } from '../../config/app';

/**
 * Page Object for the checkout wizard (`/checkout`). Only the cart step, its
 * first screen, is covered so far; the checkout plan adds the sign-in,
 * billing address and payment steps. Locators verified live with
 * playwright-cli on 2026-11-23 (plans/product-page.md, element inventory).
 */
export class CheckoutPage {
    constructor(private readonly page: Page) {}

    // ==================== Locators (cart step) ====================

    get productTitles(): Locator {
        return this.page.getByTestId('product-title');
    }

    // The quantity of a line is an input: assert with toHaveValue.
    get lineQuantities(): Locator {
        return this.page.getByTestId('product-quantity');
    }

    get linePrices(): Locator {
        return this.page.getByTestId('line-price');
    }

    get cartTotal(): Locator {
        return this.page.getByTestId('cart-total');
    }

    // ==================== Helpers ====================

    /**
     * Builds the text the cart shows for a price read from a product page,
     * which holds the number only ("14.15").
     *
     * @param {string} unitPrice - The number as shown on the product page.
     * @returns {string} The same price with the shop's currency symbol.
     */
    priceText(unitPrice: string): string {
        return `${appConfig.currencySymbol}${unitPrice}`;
    }
}
