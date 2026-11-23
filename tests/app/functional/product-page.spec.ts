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

    // PP-03
    test(
        'should add several at once and price the line at that many times the unit price',
        { tag: '@sanity' },
        async ({ appPage, productPage, checkoutPage }) => {
            const quantity = appConfig.severalQuantity;
            let unitPrice = '';

            await test.step('WHEN the shopper raises the quantity and adds to cart', async () => {
                unitPrice = (await productPage.unitPrice.innerText()).trim();
                await productPage.increaseQuantity(quantity - 1);
                await expect(productPage.quantityBox).toHaveValue(
                    String(quantity)
                );
                await productPage.addToCart();
            });

            await test.step('THEN the cart count and the line show that quantity at that many times the price', async () => {
                await expect(appPage.nav.cartQuantity).toHaveText(
                    String(quantity)
                );
                await appPage.nav.openCart();
                await expect(checkoutPage.lineQuantities).toHaveValue(
                    String(quantity)
                );
                const lineTotal = (Number(unitPrice) * quantity).toFixed(
                    appConfig.priceDecimals
                );
                await expect(checkoutPage.linePrices).toHaveText(
                    checkoutPage.priceText(lineTotal)
                );
            });
        }
    );

    // PP-04
    test(
        'should add to the same line when the product is added again',
        { tag: '@sanity' },
        async ({ appPage, productPage, checkoutPage }) => {
            const twice = appConfig.defaultQuantity * 2;

            await test.step('GIVEN one unit is in the cart', async () => {
                await productPage.addToCart();
                await expect(appPage.nav.cartQuantity).toHaveText(
                    String(appConfig.defaultQuantity)
                );
            });

            await test.step('WHEN the shopper adds it again', async () => {
                await productPage.addToCart();
                await expect(appPage.nav.cartQuantity).toHaveText(
                    String(twice)
                );
            });

            await test.step('THEN the cart has one line with the summed quantity', async () => {
                await appPage.nav.openCart();
                await expect(checkoutPage.productTitles).toHaveText([
                    PRODUCT_TO_BUY,
                ]);
                await expect(checkoutPage.lineQuantities).toHaveValue(
                    String(twice)
                );
            });
        }
    );

    // PP-05
    test(
        'should keep the cart when the page is reloaded',
        { tag: '@sanity' },
        async ({ page, appPage, productPage, checkoutPage }) => {
            await test.step('GIVEN a product is in the cart', async () => {
                await productPage.addToCart();
                await expect(appPage.nav.cartQuantity).toHaveText(
                    String(appConfig.defaultQuantity)
                );
            });

            await test.step('WHEN the shopper reloads the page', async () => {
                await page.reload();
            });

            await test.step('THEN the cart still holds the same product and count', async () => {
                await expect(appPage.nav.cartQuantity).toHaveText(
                    String(appConfig.defaultQuantity)
                );
                await appPage.nav.openCart();
                await expect(checkoutPage.productTitles).toHaveText([
                    PRODUCT_TO_BUY,
                ]);
            });
        }
    );

    // PP-06
    test(
        'should leave the cart matching the badge after a double-click on Add to cart',
        { tag: '@sanity' },
        async ({ appPage, productPage, checkoutPage }) => {
            // BUG: the badge counts both clicks but the cart holds one, observed 2026-11-23, see plans/product-page.md PP-06
            test.fail();

            let badge = '';

            await test.step('WHEN the shopper double-clicks "Add to cart"', async () => {
                await productPage.doubleClickAddToCart();
                await expect(appPage.nav.cartQuantity).toBeVisible();
                badge = (await appPage.nav.cartQuantity.innerText()).trim();
            });

            await test.step('THEN the cart line holds the quantity the badge shows', async () => {
                await appPage.nav.openCart();
                await expect(checkoutPage.lineQuantities).toHaveValue(badge);
            });
        }
    );

    // PP-07
    test(
        'should tell a signed-out visitor they cannot add a favourite',
        { tag: '@sanity' },
        async ({ productPage }) => {
            let status = 0;

            await test.step('WHEN the signed-out visitor presses "Add to favourites"', async () => {
                status = await productPage.addToFavourites();
            });

            await test.step('THEN the API refuses and the shopper is told why', async () => {
                expect(status).toBe(appConfig.unauthorizedStatus);
                await expect(
                    productPage.favouriteUnauthorizedToast
                ).toBeVisible();
            });
        }
    );
});
