import { ApiEndpoints } from '../../../enums/app/app';
import {
    CurrentUser,
    CurrentUserSchema,
} from '../../../fixtures/api/schemas/app/currentUserSchema';
import {
    ForbiddenResponse,
    ForbiddenResponseSchema,
} from '../../../fixtures/api/schemas/util/errorResponseSchema';
import { expect, test } from '../../../fixtures/pom/test-options';

/*
 * Users API, P1 (plans/api-users.md): API-00.
 * A customer must not be able to delete its own account (403, documented).
 * Uses the run user's token, so it creates no account. If the API ever
 * allowed this, the run user would be gone and the next run's setup would
 * register a new one; the failing test is the signal.
 */
test.describe('DELETE /users/{userId}', () => {
    test(
        'should forbid a customer from deleting their own account',
        { tag: '@api' },
        async ({ apiRequest }) => {
            let userId = '';

            await test.step('GIVEN the run user’s id (GET /users/me)', async () => {
                const { status, body } = await apiRequest<CurrentUser>({
                    method: 'GET',
                    url: ApiEndpoints.CURRENT_USER,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                });

                expect(status).toBe(200);
                expect(CurrentUserSchema.parse(body)).toBeTruthy();
                userId = CurrentUserSchema.parse(body).id ?? '';
                expect(userId).not.toBe('');
            });

            await test.step('WHEN the run user deletes its own account, THEN the API answers 403', async () => {
                const { status, body } = await apiRequest<ForbiddenResponse>({
                    method: 'DELETE',
                    url: `${ApiEndpoints.USERS}/${userId}`,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                });

                expect(status).toBe(403);
                expect(ForbiddenResponseSchema.parse(body)).toBeTruthy();
            });
        }
    );
});
