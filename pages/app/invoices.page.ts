import { Locator, Page } from '@playwright/test';
import { AppRoutes } from '../../enums/app/app';

/**
 * Page Object for the signed-in shopper's invoice list
 * (`/account/invoices`). Locators verified live with playwright-cli on
 * 2026-11-23 (plans/checkout.md, element inventory).
 */
export class InvoicesPage {
    constructor(private readonly page: Page) {}

    // ==================== Locators ====================

    get heading(): Locator {
        return this.page.getByRole('heading', { name: 'Invoices', level: 1 });
    }

    // The row for one invoice number; cells are number, street, date, total.
    invoiceRow(invoiceNumber: string): Locator {
        return this.page.getByRole('row').filter({
            has: this.page.getByRole('cell', { name: invoiceNumber }),
        });
    }

    // ==================== Actions ====================

    /**
     * Opens the invoice list.
     *
     * @returns {Promise<void>} Resolves when the page has loaded.
     */
    async open(): Promise<void> {
        await this.page.goto(`${process.env.APP_URL!}${AppRoutes.INVOICES}`, {
            waitUntil: 'domcontentloaded',
        });
    }
}
