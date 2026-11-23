import { Locator, Page } from '@playwright/test';
import { appConfig } from '../../config/app';
import { Messages } from '../../enums/app/app';

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

    // ==================== Locators (steps 2 to 4) ====================

    // Shown on every step; only one is on screen at a time.
    get proceedButton(): Locator {
        return this.page.getByRole('button', { name: 'Proceed to checkout' });
    }

    get alreadyLoggedInNotice(): Locator {
        return this.page.getByText(Messages.ALREADY_LOGGED_IN);
    }

    get billingStreet(): Locator {
        return this.page.getByLabel('Street');
    }

    get paymentMethod(): Locator {
        return this.page.getByLabel('Payment Method');
    }

    // Disabled until a payment method is chosen.
    get checkPaymentButton(): Locator {
        return this.page.getByRole('button', { name: 'Check payment' });
    }

    get paymentSuccessMessage(): Locator {
        return this.page.getByText(Messages.PAYMENT_SUCCESSFUL);
    }

    get confirmButton(): Locator {
        return this.page.getByRole('button', { name: 'Confirm' });
    }

    get orderConfirmation(): Locator {
        return this.page.getByText(Messages.ORDER_THANKS_PREFIX);
    }

    // ==================== Actions ====================

    /**
     * Reads the invoice number out of the order confirmation.
     *
     * @returns {Promise<string>} The invoice number, e.g. "INV-2026000007".
     */
    async invoiceNumber(): Promise<string> {
        const text = await this.orderConfirmation.innerText();
        return text
            .replace(Messages.ORDER_THANKS_PREFIX, '')
            .replace(/\.$/, '')
            .trim();
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
