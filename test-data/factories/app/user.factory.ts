import { faker } from '@faker-js/faker';
import {
    RegisterRequest,
    RegisterRequestSchema,
} from '../../../fixtures/api/schemas/app/registerSchema';
import {
    UserResponse,
    UserResponseSchema,
} from '../../../fixtures/api/schemas/app/userSchema';

/** Prefix that marks every account the suite registers, so it is easy to spot. */
const TEST_USER_EMAIL_PREFIX = 'pw-autotest-';
/** Reserved domain (RFC 2606): never delivers mail, never a real inbox. */
const TEST_USER_EMAIL_DOMAIN = 'example.com';

/**
 * Generates a password that meets every character class by construction:
 * upper and lower case letters, digits and symbols, 12 characters in total.
 *
 * @returns {string} A policy-compliant password.
 */
const generateStrongPassword = (): string =>
    faker.string.alpha({ length: 4, casing: 'upper' }) +
    faker.string.alpha({ length: 4, casing: 'lower' }) +
    faker.string.numeric(2) +
    faker.helpers.arrayElement(['!', '#', '$', '%']) +
    faker.helpers.arrayElement(['!', '#', '$', '%']);

/**
 * Generates a valid registration payload for `POST /users/register`.
 * Every account is recognisable as a test account (email prefix
 * `pw-autotest-`, reserved domain `example.com`, name "PW Autotest") and
 * holds no personal data. The email is unique per call, so parallel
 * workers never collide (409).
 *
 * @param {Partial<RegisterRequest>} overrides - Optional fields to override.
 * @returns {RegisterRequest} A payload that satisfies `RegisterRequestSchema`.
 *
 * @example
 * const registration = generateRegistration();
 */
export const generateRegistration = (
    overrides?: Partial<RegisterRequest>
): RegisterRequest => {
    const defaultRegistration: RegisterRequest = {
        first_name: 'PW',
        last_name: 'Autotest',
        email: `${TEST_USER_EMAIL_PREFIX}${faker.string.alphanumeric({ length: 12, casing: 'lower' })}@${TEST_USER_EMAIL_DOMAIN}`,
        password: generateStrongPassword(),
        dob: faker.date
            .birthdate({ mode: 'age', min: 18, max: 80 })
            .toISOString()
            .slice(0, 10),
        phone: faker.string.numeric(10),
        address: {
            street: faker.location.street(),
            house_number: faker.string.numeric(2),
            city: faker.location.city(),
            state: faker.location.state(),
            country: 'NL',
            postal_code: '1011 AB',
        },
    };

    return RegisterRequestSchema.parse({
        ...defaultRegistration,
        ...overrides,
    });
};

/**
 * Generates a valid user object with randomized data using Faker.
 * The generated data conforms to the UserResponseSchema structure.
 *
 * This factory ensures test isolation by creating unique data for each test run,
 * preventing data collision in parallel execution.
 *
 * @param {Partial<UserResponse>} overrides - Optional partial user object to override default values.
 * @returns {UserResponse} A valid user object matching the UserResponseSchema.
 *
 * @example
 * // Generate a random user
 * const user = generateUser();
 *
 * @example
 * // Generate a user with specific email
 * const adminUser = generateUser({ email: 'admin@test.com' });
 */
export const generateUser = (
    overrides?: Partial<UserResponse>
): UserResponse => {
    const defaultUser: UserResponse = {
        access_token: faker.string.alphanumeric(64),
        token_type: 'bearer',
        expires_in: faker.number.int({ min: 60, max: 3600 }),
    };

    const mergedUser = { ...defaultUser, ...overrides };

    // Validate against schema to ensure type safety
    return UserResponseSchema.parse(mergedUser);
};

/**
 * Generates login credentials for testing purposes.
 * Creates a unique email and password combination.
 *
 * @param {object} overrides - Optional overrides for email and/or password.
 * @param {string} overrides.email - Override the generated email.
 * @param {string} overrides.password - Override the generated password.
 * @returns {{ email: string; password: string }} Valid login credentials.
 *
 * @example
 * // Generate random credentials
 * const creds = generateLoginCredentials();
 *
 * @example
 * // Generate credentials with specific email
 * const creds = generateLoginCredentials({ email: 'specific@test.com' });
 */
export const generateLoginCredentials = (
    overrides?: Partial<{ email: string; password: string }>
): { email: string; password: string } => {
    return {
        email: overrides?.email ?? faker.internet.email(),
        password:
            overrides?.password ??
            faker.internet.password({
                length: 12,
                memorable: false,
                pattern: /[A-Za-z0-9!@#$%]/,
            }),
    };
};
