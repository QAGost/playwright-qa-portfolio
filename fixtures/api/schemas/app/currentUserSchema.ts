import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';

/*
 * Contract: OpenAPI 3.2.0 document served at `${API_URL}/docs` (API version 5.0.0),
 * `GET /users/me` → 200 → `#/components/schemas/UserResponse`.
 *
 * Named `CurrentUserSchema` because `UserResponseSchema` in `userSchema.ts` is
 * already the login token response. The contract lists no `required` fields,
 * so every field is optional; `["string","null"]` and `["integer","null"]`
 * types are nullable. Formats are not declared, so strings stay `z.string()`.
 */
export const CurrentUserAddressSchema = z.strictObject({
    street: z.string().optional(),
    house_number: z.string().nullable().optional(),
    city: z.string().optional(),
    state: z.string().nullable().optional(),
    country: z.string().optional(),
    postal_code: z.string().nullable().optional(),
});

export const CurrentUserSchema = z.strictObject({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    address: CurrentUserAddressSchema.optional(),
    phone: z.string().nullable().optional(),
    dob: z.string().optional(),
    email: z.string().optional(),
    id: z.string().optional(),
    provider: z.string().nullable().optional(),
    totp_enabled: z.boolean().optional(),
    enabled: z.boolean().optional(),
    failed_login_attempts: z.int().nullable().optional(),
    created_at: z.string().optional(),
});

export type CurrentUserAddress = zOutput<typeof CurrentUserAddressSchema>;
export type CurrentUser = zOutput<typeof CurrentUserSchema>;
