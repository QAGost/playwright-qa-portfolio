/**
 * Curated search terms for the product search tests (plans/product-search.md).
 *
 * These are catalogue words, not test-created content: each one names products
 * that the demo shop seeds on every data reset. Tests never hardcode how many
 * products a term finds, because the catalogue can change; they check that the
 * count message matches the products listed.
 *
 * Format: `.ts` with `as const` (data-strategy skill, static-data tiers).
 */

/** Terms that appear in the names of several products (verified live 2026-11-23). */
export const PRODUCT_NAME_TERMS = ['drill', 'hammer'] as const;

/** A product the shop seeds on every data reset, bought in the product page tests (verified live 2026-11-23). */
export const PRODUCT_TO_BUY = 'Combination Pliers';

/** A term for the search-then-reset scenario (PS-04). */
export const RESET_TERM = 'pliers';

/** Harmless markup the search must show as text, never render (PS-16). */
export const MARKUP_PROBES = ['<b>bold</b>'] as const;
