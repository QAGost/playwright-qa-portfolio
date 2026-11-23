import { appConfig } from '../../../config/app';
import { PaymentMethods } from '../../../enums/app/app';
import { expect, test } from '../../../fixtures/pom/test-options';
import { PRODUCT_TO_BUY } from '../../../test-data/static/app/search-terms';

/**
 * Checkout journey (plans/checkout.md). The shopper is the signed-in run
 * user from the setup project. The order is the user's own data, which the
 * site wipes every hour, so nothing is reverted.
 */
test.describe('e2e checkout', () => {
    // CO-01
    test(
        'should buy a product by search and find the invoice in the account',
        { tag: '@e2e' },
        async ({
            page,
            appPage,
            homePage,
            productPage,
            checkoutPage,
            invoicesPage,
        }) => {
            let unitPrice = '';
            let invoiceNumber = '';

            await test.step('GIVEN the signed-in shopper finds the product by search and adds it to the cart', async () => {
                await homePage.open();
                await homePage.search(PRODUCT_TO_BUY);
                await homePage.openProduct(PRODUCT_TO_BUY);
                unitPrice = (await productPage.unitPrice.innerText()).trim();
                await productPage.addToCart();
                await expect(productPage.addedToCartToast).toBeVisible();
                await appPage.nav.openCart();
                await expect(checkoutPage.cartTotal).toHaveText(
                    checkoutPage.priceText(unitPrice)
                );
                await test.info().attach('cart', {
                    body: await page.screenshot(),
                    contentType: 'image/png',
                });
            });

            await test.step('WHEN they go through sign-in, billing address and payment, and confirm', async () => {
                await checkoutPage.proceedButton.click();
                await expect(checkoutPage.alreadyLoggedInNotice).toBeVisible();
                await checkoutPage.proceedButton.click();
                await expect(checkoutPage.billingStreet).not.toHaveValue('');
                await checkoutPage.proceedButton.click();
                await checkoutPage.paymentMethod.selectOption(
                    PaymentMethods.CASH_ON_DELIVERY
                );
                await checkoutPage.checkPaymentButton.click();
                await expect(checkoutPage.paymentSuccessMessage).toBeVisible();
                await checkoutPage.confirmButton.click();
            });

            await test.step('THEN the order is confirmed with an invoice number', async () => {
                await expect(checkoutPage.orderConfirmation).toHaveText(
                    /INV-\d+/
                );
                invoiceNumber = await checkoutPage.invoiceNumber();
                await test.info().attach('order confirmed', {
                    body: await page.screenshot(),
                    contentType: 'image/png',
                });
            });

            await test.step('AND the invoice is in the account with the cart total', async () => {
                await invoicesPage.open();
                await expect(invoicesPage.heading).toBeVisible();
                await expect(
                    invoicesPage.invoiceRow(invoiceNumber)
                ).toContainText(`${appConfig.currencySymbol}${unitPrice}`);
                await test.info().attach('invoice list', {
                    body: await page.screenshot(),
                    contentType: 'image/png',
                });
            });
        }
    );
});
