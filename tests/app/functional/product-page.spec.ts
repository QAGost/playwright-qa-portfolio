import { appConfig } from '../../../config/app';
import { ApiEndpoints, AppRoutes } from '../../../enums/app/app';
import {
    Product,
    ProductSchema,
} from '../../../fixtures/api/schemas/app/productSchema';
import { expect, test } from '../../../fixtures/pom/test-options';
import { PRODUCT_TO_BUY } from '../../../test-data/static/app/search-terms';

/**
 * Product page (plans/product-page.md). Each test reaches the product the way
 * a shopper does, by searching for its name, and starts signed out with an
 * empty cart. Carts are anonymous: nothing to clean up.
 */
test.describe('functional product page', () => {
    test.beforeEach(async ({ resetStorageState, homePage }) => {
        await resetStorageState();
        await homePage.open();
        await homePage.search(PRODUCT_TO_BUY);
        await homePage.openProduct(PRODUCT_TO_BUY);
    });

    // PP-01
    test(
        'should show the product details',
        { tag: '@smoke' },
        async ({ page, productPage }) => {
            await test.step('GIVEN the shopper opened the product from the search results', async () => {
                await expect(page).toHaveURL(
                    new RegExp(`${AppRoutes.PRODUCT}/\\w+$`)
                );
            });

            await test.step('THEN the name, price, category, brand and description are shown', async () => {
                await expect(productPage.productName).toHaveText(
                    PRODUCT_TO_BUY
                );
                await expect(productPage.unitPrice).toHaveText(/^\d+\.\d{2}$/);
                await expect(productPage.category).toHaveText(/\S/);
                await expect(productPage.brand).toHaveText(/\S/);
                await expect(productPage.description).toHaveText(/\S/);
            });

            await test.step('AND the specifications and the three action buttons are shown', async () => {
                await expect(productPage.specificationRows).not.toHaveCount(0);
                await expect(productPage.addToCartButton).toBeVisible();
                await expect(productPage.addToFavouritesButton).toBeVisible();
                await expect(productPage.compareButton).toBeVisible();
                await test.info().attach('product page', {
                    body: await page.screenshot(),
                    contentType: 'image/png',
                });
            });
        }
    );

    // PP-18
    test(
        'should show the same details as the API',
        { tag: '@smoke' },
        async ({ productPage, apiRequest }) => {
            let product: Product = {};

            await test.step('GIVEN the API holds this product (GET /products/<id>)', async () => {
                const { status, body } = await apiRequest<Product>({
                    method: 'GET',
                    url: `${ApiEndpoints.PRODUCTS}/${productPage.productId()}`,
                    baseUrl: process.env.API_URL,
                });

                expect(status).toBe(200);
                expect(ProductSchema.parse(body)).toBeTruthy();
                product = ProductSchema.parse(body);
                // Every field is optional in the contract: make sure the ones compared exist.
                expect(product.name).toBeTruthy();
                expect(product.price).toBeGreaterThan(0);
                expect(product.category?.name).toBeTruthy();
                expect(product.brand?.name).toBeTruthy();
                expect(product.description).toBeTruthy();
            });

            await test.step('THEN the page shows the same name, price, category, brand and description', async () => {
                await expect(productPage.productName).toHaveText(
                    product.name ?? ''
                );
                await expect(productPage.unitPrice).toHaveText(
                    (product.price ?? 0).toFixed(appConfig.priceDecimals)
                );
                await expect(productPage.category).toHaveText(
                    product.category?.name ?? ''
                );
                await expect(productPage.brand).toHaveText(
                    product.brand?.name ?? ''
                );
                await expect(productPage.description).toHaveText(
                    product.description ?? ''
                );
            });

            await test.step('AND lists the same specifications, in the same order', async () => {
                const specNames = (product.specs ?? []).map(
                    (spec) => spec.spec_name ?? ''
                );
                expect(specNames.length).toBeGreaterThan(0);
                await expect(productPage.specificationNames).toHaveText(
                    specNames
                );
            });
        }
    );

    // PP-02
    test(
        'should add the product to the cart and show it there',
        { tag: '@smoke' },
        async ({ page, appPage, productPage, checkoutPage }) => {
            const quantity = String(appConfig.defaultQuantity);
            let unitPrice = '';

            await test.step('GIVEN the cart is empty and the shopper knows the unit price', async () => {
                await expect(appPage.nav.cartQuantity).toBeHidden();
                unitPrice = (await productPage.unitPrice.innerText()).trim();
            });

            await test.step('WHEN they press "Add to cart"', async () => {
                await productPage.addToCart();
            });

            await test.step('THEN the toast shows and the cart count is the quantity added', async () => {
                await expect(productPage.addedToCartToast).toBeVisible();
                await test.info().attach('added to cart', {
                    body: await page.screenshot(),
                    contentType: 'image/png',
                });
                await expect(appPage.nav.cartQuantity).toHaveText(quantity);
            });

            await test.step('AND the cart lists this product once, at the unit price', async () => {
                await appPage.nav.openCart();
                await expect(page).toHaveURL(
                    new RegExp(`${AppRoutes.CHECKOUT}$`)
                );
                await expect(checkoutPage.productTitles).toHaveText([
                    PRODUCT_TO_BUY,
                ]);
                await expect(checkoutPage.lineQuantities).toHaveValue(quantity);
                await expect(checkoutPage.linePrices).toHaveText(
                    checkoutPage.priceText(unitPrice)
                );
                await expect(checkoutPage.cartTotal).toHaveText(
                    checkoutPage.priceText(unitPrice)
                );
                await test.info().attach('cart', {
                    body: await page.screenshot(),
                    contentType: 'image/png',
                });
            });
        }
    );
});
