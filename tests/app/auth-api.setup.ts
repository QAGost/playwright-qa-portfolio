/**
 * auth-api.setup.ts
 * Playwright setup script for the API access token (`setup-api` project).
 *
 * Signs in over HTTP only, so the `api` project never needs a browser or
 * the UI storage state: it passes on fresh environments and in CI where the
 * UI may be unreachable. The browser storage state is `auth.setup.ts`.
 */

import { expect, test } from '../../fixtures/pom/test-options';
import {
    ensureRunUser,
    setUserAccessToken,
} from '../../helpers/app/createStorageState';

test.describe('auth setup - API', () => {
    test('setup authentication - API token', async ({ apiRequest }) => {
        await test.step('GIVEN a private run user exists (reused, or registered)', async () => {
            await ensureRunUser(apiRequest);
        });

        await test.step('WHEN the run user logs in over the API', async () => {
            await setUserAccessToken(apiRequest);
        });

        await test.step('THEN an access token is available', async () => {
            expect(process.env['ACCESS_TOKEN']).toBeDefined();
        });
    });
});
