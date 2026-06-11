/**
 * Sample source file demonstrating the `service-file-structure` rule. The rule
 * applies to files the project treats as services (name ending in `service.ts`
 * / `service.svelte.ts`), and additionally requires the file to be named with
 * the `<name>.service.ts` convention — so a real subject would live in a file
 * like `example.service.ts`. This illustration file is not enabled, so the test
 * file drives the actual assertions.
 */

// ❌ Invalid: a top-level function lives outside the class.
function helper(): string {
  return 'nope';
}

// ❌ Invalid: a constant declared outside the class — make it a field instead.
const MAX_RETRIES = 3;

// ✅ Valid: a single class holds all state and behavior.
class ExampleService {
  // ✅ Constants belong here, as private (instance or static) fields.
  private readonly maxRetries = MAX_RETRIES;

  greeting(): string {
    return this.build();
  }

  // Helpers belong inside the class, ideally private.
  private build(): string {
    return helper();
  }
}

// ✅ Valid trailing shape: a `const`-bound instance, conventionally named
// (camelCase of the class), exported as default.
// ❌ The shorthand `export default new ExampleService();` is auto-fixed to this.
// (Exporting the class itself — `export default class ExampleService {}` — is
// also allowed, for cases where the service is meant to be extended.)
const exampleService = new ExampleService();
export default exampleService;
