import { AppRoutes, Messages } from '../../../enums/app/app';
import { expect, test } from '../../../fixtures/pom/test-options';
import { PRODUCT_NAME_TERMS } from '../../../test-data/static/app/search-terms';

/**
 * Product search on the home page (plans/product-search.md).
 * Read-only and signed out: no state to clean up.
 */
test.describe('functional product search', () => {
    test.beforeEach(async ({ resetStorageState, homePage }) => {
        await resetStorageState();
        await homePage.open();
    });

    // PS-01
    for (const term of PRODUCT_NAME_TERMS) {
        test(
            `should list only products matching "${term}"`,
            { tag: '@smoke' },
            async ({ page, homePage }) => {
                await test.step('GIVEN the shopper is on the home page', async () => {
                    await expect(homePage.searchInput).toBeVisible();
                });

                await test.step(`WHEN they search for "${term}"`, async () => {
                    await homePage.search(term);
                });

                await test.step('THEN the caption shows the term', async () => {
                    await expect(homePage.searchCaption).toHaveText(
                        `${Messages.SEARCH_CAPTION_PREFIX}${term}`
                    );
                });

                await test.step('AND every listed product matches the term', async () => {
                    const names = await homePage.productNames.allInnerTexts();
                    expect(names.length).toBeGreaterThan(0);
                    for (const name of names) {
                        expect(name.toLowerCase()).toContain(
                            term.toLowerCase()
                        );
                    }
                });

                await test.step('AND the count message matches the products listed', async () => {
                    const listed = await homePage.productNames.count();
                    await expect(homePage.searchResultCount).toHaveText(
                        homePage.resultCountText(listed, term)
                    );
                    await test.info().attach('search results', {
                        body: await page.screenshot(),
                        contentType: 'image/png',
                    });
                });
            }
        );
    }

    // PS-02
    test(
        'should open a search result on its product page',
        { tag: '@smoke' },
        async ({ page, homePage, productPage }) => {
            const [term] = PRODUCT_NAME_TERMS;
            let name = '';
            let cardPrice = '';

            await test.step(`GIVEN the shopper searched for "${term}"`, async () => {
                await homePage.search(term);
                const [firstName] = await homePage.productNames.allInnerTexts();
                expect(firstName).toBeTruthy();
                name = firstName.trim();
                cardPrice = (
                    await homePage.productCardPrice(name).innerText()
                ).trim();
            });

            await test.step('WHEN they open the first result', async () => {
                await homePage.openProduct(name);
            });

            await test.step('THEN the product page shows that product, name and price', async () => {
                await expect(page).toHaveURL(
                    new RegExp(`${AppRoutes.PRODUCT}/\\w+$`)
                );
                await expect(productPage.productName).toHaveText(name);
                // The card shows "$66.54"; the product page's price element holds "66.54".
                await expect(productPage.unitPrice).toHaveText(
                    cardPrice.replace(/^\$/, '')
                );
                await test.info().attach('product page', {
                    body: await page.screenshot(),
                    contentType: 'image/png',
                });
            });
        }
    );
});
