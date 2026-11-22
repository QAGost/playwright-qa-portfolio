import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';
import { CurrentUserAddressSchema } from './currentUserSchema';

/*
 * Contract: OpenAPI 3.2.0 document served at `${API_URL}/docs` (API version 5.0.0),
 * `POST /users/register` request body. Required: first_name, last_name, email,
 * password. Lengths from the document: first_name ≤ 40, last_name ≤ 20,
 * phone ≤ 24, email ≤ 256, password ≥ 8; dob is a date. The address object has
 * the same fields as the `UserResponse` address, so its schema is reused.
 * The 201 response is `UserResponse`: validate it with `CurrentUserSchema`.
 */
export const RegisterRequestSchema = z.strictObject({
    first_name: z.string().max(40),
    last_name: z.string().max(20),
    email: z.email().max(256),
    password: z.string().min(8),
    dob: z.iso.date().optional(),
    phone: z.string().max(24).optional(),
    address: CurrentUserAddressSchema.optional(),
});

/*
 * The run user saved by the `setup-api` project to `StorageStatePaths.RUN_USER`
 * and loaded by every worker. Local file only (gitignored `.auth/`), not an API
 * response.
 */
export const RunUserSchema = z.strictObject({
    email: z.email(),
    password: z.string().min(8),
    first_name: z.string(),
    last_name: z.string(),
});

export type RegisterRequest = zOutput<typeof RegisterRequestSchema>;
export type RunUser = zOutput<typeof RunUserSchema>;
