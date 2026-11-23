/**
 * Application-specific constants.
 * Add your application's repeated string values here.
 *
 * @example
 * ```ts
 * import { Messages, ApiEndpoints } from '../../enums/app/app';
 *
 * await expect(page.getByText(Messages.LOGIN_ERROR)).toBeVisible();
 * ```
 */

/** Common UI messages — every value verified against the live demo app */
export enum Messages {
    LOGIN_ERROR = 'Invalid email or password',
    EMAIL_REQUIRED = 'Email is required',
    PASSWORD_REQUIRED = 'Password is required',
    EMAIL_FORMAT_INVALID = 'Email format is invalid',
    /** Heading above search results; the term follows the prefix */
    SEARCH_CAPTION_PREFIX = 'Searched for: ',
    /** Result count under the caption; `{count}` and `{term}` are filled in */
    NO_PRODUCTS_FOUND = 'There are no products found.',
    /** Toast after pressing Add to cart */
    PRODUCT_ADDED_TO_CART = 'Product added to shopping cart.',
    SEARCH_RESULT_COUNT = "{count} products found for '{term}'",
}

/** UI route paths */
export enum AppRoutes {
    LOGIN = '/auth/login',
    ACCOUNT = '/account',
    HOME = '/',
    /** Cart and checkout steps (the cart is the first step) */
    CHECKOUT = '/checkout',
    /** Product detail pages: `/product/<generated id>` */
    PRODUCT = '/product',
}

/** API endpoint paths */
export enum ApiEndpoints {
    LOGIN = '/users/login',
    LOGOUT = '/users/logout',
    CURRENT_USER = '/users/me',
    REGISTER = '/users/register',
    USERS = '/users',
    PRODUCTS = '/products',
    PRODUCTS_SEARCH = '/products/search',
}

/**
 * Auth state files written by the setup projects
 * (`tests/app/auth-api.setup.ts` and `tests/app/auth.setup.ts`).
 */
export enum StorageStatePaths {
    APP = '.auth/app/appStorageState.json',
    API_ACCESS_TOKEN = '.auth/app/apiAccessToken.json',
    RUN_USER = '.auth/app/runUser.json',
}
