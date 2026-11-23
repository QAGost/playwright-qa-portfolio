import { Locator, Page } from '@playwright/test';
import { Messages } from '../../enums/app/app';

/**
 * Page Object for a product detail page (`/product/<generated id>`).
 * Locators verified live with playwright-cli on 2026-11-23
 * (plans/product-page.md, element inventory).
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

    // Badge with an aria-label of "category".
    get category(): Locator {
        return this.page.getByLabel('category');
    }

    // Badge with an aria-label of "brand".
    get brand(): Locator {
        return this.page.getByLabel('brand');
    }

    // A paragraph with no role or label.
    get description(): Locator {
        return this.page.getByTestId('product-description');
    }

    get specificationRows(): Locator {
        return this.page.getByRole('table').getByRole('row');
    }

    // Names of the specification rows, in display order.
    get specificationNames(): Locator {
        return this.page.getByTestId('spec-name');
    }

    get addToCartButton(): Locator {
        return this.page.getByRole('button', { name: 'Add to cart' });
    }

    get addToFavouritesButton(): Locator {
        return this.page.getByRole('button', { name: 'Add to favourites' });
    }

    get compareButton(): Locator {
        return this.page.getByRole('button', { name: 'Compare' });
    }

    // Toast, no role; it disappears after about two seconds.
    get addedToCartToast(): Locator {
        return this.page.getByText(Messages.PRODUCT_ADDED_TO_CART);
    }

    // ==================== Actions ====================

    /**
     * Reads the product id from the address (`/product/<id>`), so a test can
     * look the same product up through the API.
     *
     * @returns {string} The generated id of the product on screen.
     */
    productId(): string {
        const id = new URL(this.page.url()).pathname.split('/').pop();
        if (!id) {
            throw new Error('The address holds no product id');
        }
        return id;
    }

    /**
     * Presses "Add to cart" once.
     *
     * @returns {Promise<void>} Resolves when the button has been clicked.
     */
    async addToCart(): Promise<void> {
        await this.addToCartButton.click();
    }
}
