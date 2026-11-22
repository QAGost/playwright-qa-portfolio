import { ApiEndpoints } from '../../../enums/app/app';
import {
    CurrentUser,
    CurrentUserSchema,
} from '../../../fixtures/api/schemas/app/currentUserSchema';
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateRegistration } from '../../../test-data/factories/app/user.factory';

/*
 * Users API, P1 (plans/api-users.md): API-01.
 * CREATES AN ACCOUNT on the target site that cannot be deleted (a customer
 * cannot delete itself, API-00). Accounts are labelled "PW Autotest" with
 * pw-autotest-*@example.com emails. Belongs to the nightly / on-demand set,
 * not to every push.
 */
test.describe('POST /users/register', () => {
    test(
        'should register a new customer and return their data without the password',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const registration = generateRegistration();

            const { status, body } = await apiRequest<CurrentUser>({
                method: 'POST',
                url: ApiEndpoints.REGISTER,
                baseUrl: process.env.API_URL,
                body: registration,
            });

            expect(status).toBe(201);
            expect(CurrentUserSchema.parse(body)).toBeTruthy();

            const createdUser = CurrentUserSchema.parse(body);
            expect(createdUser.email).toBe(registration.email);
            expect(createdUser.first_name).toBe(registration.first_name);
            expect(createdUser.last_name).toBe(registration.last_name);
            expect(createdUser.id).toBeTruthy();
            expect(body).not.toHaveProperty('password');
        }
    );
});
