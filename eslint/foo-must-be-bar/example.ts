/**
 * Sample source file demonstrating what the `foo-must-be-bar` rule does. The
 * rule is not enabled in the project's `eslint.config.js`, so this file is just
 * an illustration — the test file drives the actual assertions.
 */

// ✅ Valid: a `const` named `foo` assigned the string "bar".
export const foo = 'bar';

export function demo(): string {
  // ❌ Invalid: a `const` named `foo` assigned something other than "bar".
  // The rule would report this declaration.
  const foo = 'baz';
  return foo;
}
