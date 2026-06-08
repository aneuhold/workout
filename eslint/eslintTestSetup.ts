import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

/**
 * Wires `@typescript-eslint/rule-tester`'s `RuleTester` up to Vitest's test
 * hooks. `RuleTester` calls `describe`/`it`/`afterAll` to register its
 * generated cases, but it only reads them off its own static properties — and
 * Vitest does not expose these as globals unless `globals: true` is set. So
 * they have to be assigned explicitly before any `RuleTester` is constructed.
 *
 * See the "Vitest" section of the rule-tester docs:
 * https://typescript-eslint.io/packages/rule-tester/#vitest
 */
export const setupEslintRuleTester = (): void => {
  RuleTester.afterAll = afterAll;
  RuleTester.describe = describe;
  RuleTester.it = it;
  RuleTester.itOnly = it.only;
};
