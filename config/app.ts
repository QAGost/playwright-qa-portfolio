/**
 * Application configuration object.
 * Contains URL configuration for the main application.
 *
 * For route paths and API endpoints, use enums from `enums/app/app.ts`.
 */
export const appConfig = {
    /** Frontend application URL loaded from the APP_URL env variable */
    appUrl: process.env.APP_URL!,
    /** Backend API URL loaded from the API_URL env variable */
    apiUrl: process.env.API_URL!,
    /** Products per page in the home page grid (verified live 2026-11-23) */
    homeGridPageSize: 9,
    /** Currency symbol the shop puts before prices in the cart */
    currencySymbol: '$',
    /** Quantity the product page starts with, and what one press of Add to cart adds */
    defaultQuantity: 1,
    /** A quantity above one that tests buy in a single add (PP-03) */
    severalQuantity: 3,
    /** HTTP status of an unauthenticated request */
    unauthorizedStatus: 401,
    /** Decimal places the shop shows in prices */
    priceDecimals: 2,
};
