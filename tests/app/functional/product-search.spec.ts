import { AppRoutes, Messages } from '../../../enums/app/app';
import { appConfig } from '../../../config/app';
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateNoMatchTerm } from '../../../test-data/factories/app/search.factory';
import {
    MARKUP_PROBES,
    PRODUCT_NAME_TERMS,
    RESET_TERM,
} from '../../../test-data/static/app/search-terms';

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

    // PS-03
    test(
        'should tell the shopper when nothing matches',
        { tag: '@sanity' },
        async ({ homePage }) => {
            const term = generateNoMatchTerm();

            await test.step(`WHEN the shopper searches for "${term}"`, async () => {
                await homePage.search(term);
            });

            await test.step('THEN the count is zero, the no-results message shows and no products are listed', async () => {
                await expect(homePage.searchResultCount).toHaveText(
                    homePage.resultCountText(0, term)
                );
                await expect(homePage.noResultsMessage).toBeVisible();
                await expect(homePage.productNames).toHaveCount(0);
            });
        }
    );

    // PS-04
    test(
        'should bring the full catalogue back when the search is reset',
        { tag: '@sanity' },
        async ({ homePage }) => {
            await test.step(`GIVEN a search for "${RESET_TERM}" is showing`, async () => {
                await homePage.search(RESET_TERM);
                await expect(homePage.searchCaption).toBeVisible();
            });

            await test.step('WHEN the shopper clicks the reset button', async () => {
                await homePage.resetSearch();
            });

            await test.step('THEN the box is empty, the caption and count are gone and the default grid is back', async () => {
                await expect(homePage.searchInput).toBeEmpty();
                await expect(homePage.searchCaption).toBeHidden();
                await expect(homePage.searchResultCount).toBeHidden();
                await expect(homePage.productNames).toHaveCount(
                    appConfig.homeGridPageSize
                );
                await expect(homePage.nextPageButton).toBeVisible();
            });
        }
    );

    // PS-05
    test(
        'should find the same products despite capitals and spaces',
        { tag: '@sanity' },
        async ({ homePage }) => {
            const [term] = PRODUCT_NAME_TERMS;
            let expectedNames: string[] = [];

            await test.step(`GIVEN a search for "${term}" lists its products`, async () => {
                await homePage.search(term);
                await expect(homePage.productNames).not.toHaveCount(0);
                expectedNames = await homePage.productNames.allInnerTexts();
            });

            for (const variant of [term.toUpperCase(), ` ${term} `]) {
                await test.step(`WHEN the shopper searches for "${variant}"`, async () => {
                    await homePage.resetSearch();
                    await homePage.search(variant);
                });

                await test.step('THEN the same products are listed in the same order', async () => {
                    await expect(homePage.productNames).toHaveText(
                        expectedNames
                    );
                });
            }
        }
    );

    // PS-06
    test(
        'should search when the keyboard user presses Enter',
        { tag: '@sanity' },
        async ({ homePage }) => {
            const [term] = PRODUCT_NAME_TERMS;

            await test.step(`WHEN the shopper types "${term}" and presses Enter`, async () => {
                await homePage.searchWithEnter(term);
            });

            await test.step('THEN the results appear as with the button', async () => {
                await expect(homePage.searchCaption).toHaveText(
                    `${Messages.SEARCH_CAPTION_PREFIX}${term}`
                );
                const listed = await homePage.productNames.count();
                expect(listed).toBeGreaterThan(0);
                await expect(homePage.searchResultCount).toHaveText(
                    homePage.resultCountText(listed, term)
                );
            });
        }
    );

    // PS-07
    test(
        'should keep the results when the shopper comes back from a product',
        { tag: '@sanity' },
        async ({ page, homePage }) => {
            // BUG: Back from a product page shows the unfiltered home page; the search is lost, observed 2026-11-22, see plans/product-search.md PS-07
            test.fail();
            const [term] = PRODUCT_NAME_TERMS;
            let name = '';
            let names: string[] = [];

            await test.step(`GIVEN the shopper searched for "${term}" and opened a result`, async () => {
                await homePage.search(term);
                names = await homePage.productNames.allInnerTexts();
                expect(names.length).toBeGreaterThan(0);
                name = names[0].trim();
                await homePage.openProduct(name);
                await expect(page).toHaveURL(
                    new RegExp(`${AppRoutes.PRODUCT}/\\w+$`)
                );
            });

            await test.step('WHEN they press Back', async () => {
                await page.goBack();
            });

            await test.step('THEN the same search results are still shown', async () => {
                await expect(homePage.searchCaption).toHaveText(
                    `${Messages.SEARCH_CAPTION_PREFIX}${term}`
                );
                await expect(homePage.productNames).toHaveText(names);
            });
        }
    );

    // PS-16
    for (const probe of MARKUP_PROBES) {
        test(
            `should show "${probe}" as text, not as markup`,
            { tag: '@sanity' },
            async ({ homePage }) => {
                await test.step(`WHEN the shopper searches for "${probe}"`, async () => {
                    await homePage.search(probe);
                });

                await test.step('THEN the caption and count show the literal text', async () => {
                    // Parsed as markup, the caption would read "Searched for: bold".
                    await expect(homePage.searchCaption).toHaveText(
                        `${Messages.SEARCH_CAPTION_PREFIX}${probe}`
                    );
                    await expect(homePage.searchResultCount).toHaveText(
                        homePage.resultCountText(0, probe)
                    );
                });
            }
        );
    }
});
