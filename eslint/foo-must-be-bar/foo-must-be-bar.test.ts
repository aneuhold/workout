import { RuleTester } from '@typescript-eslint/rule-tester';
import { setupEslintRuleTester } from '../eslintTestSetup';
import { fooMustBeBar } from './foo-must-be-bar';

setupEslintRuleTester();

const ruleTester = new RuleTester();

ruleTester.run('foo-must-be-bar', fooMustBeBar, {
  valid: [
    // `foo` assigned exactly "bar".
    { code: `const foo = 'bar';` },
    // Other names are unaffected, regardless of value.
    { code: `const baz = 'bar';` },
    { code: `const notFoo = 'anything';` },
    // `let`/`var` named `foo` are out of scope for this rule.
    { code: `let foo = 'baz';` },
    // A `foo` inside a multi-declarator statement, still "bar".
    { code: `const a = 1, foo = 'bar';` }
  ],
  invalid: [
    // Wrong string value.
    {
      code: `const foo = 'baz';`,
      errors: [{ messageId: 'fooMustBeBar' }]
    },
    // Non-string value.
    {
      code: `const foo = 42;`,
      errors: [{ messageId: 'fooMustBeBar' }]
    },
    // One bad `foo` among several declarators.
    {
      code: `const a = 1, foo = 'nope';`,
      errors: [{ messageId: 'fooMustBeBar' }]
    }
  ]
});
