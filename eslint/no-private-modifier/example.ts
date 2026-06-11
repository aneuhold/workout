/**
 * Sample source file demonstrating what the `no-private-modifier` rule does.
 * The local rules ignore the `eslint/` folder, so this file is just an
 * illustration — the test file drives the actual assertions.
 */

export class Counter {
  // ❌ Invalid: TypeScript `private` modifier on a field. The rule reports this.
  private count = 0;

  // ✅ Valid: native `#private` field.
  #step = 1;

  // ❌ Invalid: `private` method. Use `#increment()` instead.
  private increment(): void {
    this.count += this.#step;
  }

  // ✅ Valid: `private` constructor parameter properties are allowed.
  constructor(private readonly initial: number) {
    this.count = initial;
  }
}
