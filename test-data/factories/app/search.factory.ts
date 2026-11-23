import { faker } from '@faker-js/faker';

/** Length of a random no-match term: long enough that no product name contains it. */
const NO_MATCH_TERM_LENGTH = 10;

/**
 * Generates a random lower-case search term that matches no product.
 *
 * @returns {string} Ten random letters.
 */
export const generateNoMatchTerm = (): string =>
    faker.string.alpha({ length: NO_MATCH_TERM_LENGTH, casing: 'lower' });
