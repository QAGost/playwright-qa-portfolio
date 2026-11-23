import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';

/*
 * Contract: OpenAPI 3.2.0 document served at `${API_URL}/docs` (API version 5.0.0),
 * `GET /products/{productId}` → 200 → `#/components/schemas/ProductResponse`.
 *
 * The contract lists no `required` fields, so every field is optional;
 * `["string","null"]` types are nullable. Formats are not declared, so strings
 * stay `z.string()`.
 *
 * OBSERVED (2026-11-23, live response, not in the contract): the product
 * carries its `specs` array (the contract documents them only at
 * `GET /products/{productId}/specs`). The shape of each entry is the contract's
 * `ProductSpecResponse`. A live `brand` has no `slug` and a live `category` has
 * `parent_id` and no `sub_categories`; all of those are optional in the contract.
 */
export const ProductBrandSchema = z.strictObject({
    id: z.string().optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
});

export const ProductCategorySchema = z.strictObject({
    id: z.string().optional(),
    parent_id: z.string().nullable().optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
    get sub_categories() {
        return z.array(ProductCategorySchema).optional();
    },
});

export const ProductImageSchema = z.strictObject({
    by_name: z.string().optional(),
    by_url: z.string().optional(),
    source_name: z.string().optional(),
    source_url: z.string().optional(),
    file_name: z.string().optional(),
    title: z.string().optional(),
    id: z.string().optional(),
});

export const ProductSpecSchema = z.strictObject({
    id: z.string().optional(),
    product_id: z.string().optional(),
    spec_name: z.string().optional(),
    spec_value: z.string().optional(),
    spec_unit: z.string().nullable().optional(),
});

export const ProductSchema = z.strictObject({
    id: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    is_location_offer: z.boolean().optional(),
    is_rental: z.boolean().optional(),
    in_stock: z.boolean().optional(),
    co2_rating: z.string().optional(),
    is_eco_friendly: z.boolean().optional(),
    brand: ProductBrandSchema.optional(),
    category: ProductCategorySchema.optional(),
    product_image: ProductImageSchema.optional(),
    specs: z.array(ProductSpecSchema).optional(),
});

export type Product = zOutput<typeof ProductSchema>;
