import { ApiEndpoints } from '../../../enums/app/app';
import {
    CurrentUser,
    CurrentUserSchema,
} from '../../../fixtures/api/schemas/app/currentUserSchema';
import {
    UserResponse,
    UserResponseSchema,
} from '../../../fixtures/api/schemas/app/userSchema';
import { expect, test } from '../../../fixtures/pom/test-options';
import { getRunUser } from '../../../helpers/app/createStorageState';

/*
 * Users API, P1 (plans/api-users.md): API-02 and API-03.
 * Uses the run user from the setup-api project, so it creates no account.
 */
test.describe('GET /users/me', () => {
    test(
        'should return the logged-in user’s own data',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const runUser = getRunUser();
            let accessToken = '';

            await test.step('WHEN the run user logs in (POST /users/login)', async () => {
                const { status, body } = await apiRequest<UserResponse>({
                    method: 'POST',
                    url: ApiEndpoints.LOGIN,
                    baseUrl: process.env.API_URL,
                    body: { email: runUser.email, password: runUser.password },
                });

                expect(status).toBe(200);
                expect(UserResponseSchema.parse(body)).toBeTruthy();
                accessToken = UserResponseSchema.parse(body).access_token;
            });

            await test.step('THEN GET /users/me returns exactly that user', async () => {
                const { status, body } = await apiRequest<CurrentUser>({
                    method: 'GET',
                    url: ApiEndpoints.CURRENT_USER,
                    baseUrl: process.env.API_URL,
                    headers: accessToken,
                });

                expect(status).toBe(200);
                expect(CurrentUserSchema.parse(body)).toBeTruthy();

                const currentUser = CurrentUserSchema.parse(body);
                expect(currentUser.email).toBe(runUser.email);
                expect(currentUser.first_name).toBe(runUser.first_name);
                expect(currentUser.last_name).toBe(runUser.last_name);
            });
        }
    );
});
