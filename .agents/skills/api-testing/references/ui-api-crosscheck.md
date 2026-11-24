# UI against API cross-check

Open when a UI test can prove "the page shows what the backend holds" by reading the same record
through the API.

Use it on pages that render a record: a product page, an invoice, a profile.

1. **GIVEN** read the record through the API with `apiRequest` (`GET /products/{id}`); the id comes from
   the page address or the UI action, never from a hardcoded value.
2. Validate the body with the strict schema (`expect(Schema.parse(body)).toBeTruthy();`).
3. **Guard the optional fields.** A contract with no `required` makes every field optional, so assert
   that each compared field exists first; otherwise a missing field compares equal to an empty page.
4. **THEN** compare each UI value with the API value, formatted the way the page formats it (price
   `toFixed(appConfig.priceDecimals)`); compare lists as arrays so the order is checked too.

Notes:

- It proves the UI is faithful to the backend. It does not prove the backend is right, because both read
  the same source.
- **Mutation check:** change one expected value once (a wrong price), confirm the test goes red, restore.
- Undocumented live fields are in the schema marked `// OBSERVED` (`type-safety`), never ignored.
