import { RuleTester } from '@typescript-eslint/rule-tester';
import { setupEslintRuleTester } from '../eslintTestSetup';
import { noPrivateModifier } from './no-private-modifier';

setupEslintRuleTester();

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module' }
  }
});

ruleTester.run('no-private-modifier', noPrivateModifier, {
  valid: [
    // `#private` field and method.
    { code: `class Foo { #count = 0; }` },
    { code: `class Foo { #helper(): void {} }` },
    // Static `#private` field and method.
    { code: `class Foo { static #count = 0; }` },
    { code: `class Foo { static #helper(): void {} }` },
    // `#private` accessor and getter.
    { code: `class Foo { accessor #x = 1; }` },
    { code: `class Foo { get #x(): number { return 1; } }` },
    { code: `class Foo { constructor(foo: string) {} }` },
    // Constructor parameter properties are allowed (no `#` shorthand exists).
    { code: `class Foo { constructor(private foo: string) {} }` },
    { code: `class Foo { constructor(private readonly foo: string) {} }` },
    // `public`/`protected`/no-modifier members are out of scope.
    { code: `class Foo { public count = 0; }` },
    { code: `class Foo { protected helper(): void {} }` },
    { code: `class Foo { count = 0; }` },
    { code: `class Foo { static value = 1; }` }
  ],
  invalid: [
    // Private instance field.
    {
      code: `class Foo { private count = 0; }`,
      errors: [{ messageId: 'privateField' }]
    },
    // Private static field.
    {
      code: `class Foo { private static count = 0; }`,
      errors: [{ messageId: 'privateField' }]
    },
    // Private accessor field.
    {
      code: `class Foo { private accessor x = 1; }`,
      errors: [{ messageId: 'privateField' }]
    },
    // Private instance method.
    {
      code: `class Foo { private helper(): void {} }`,
      errors: [{ messageId: 'privateMethod' }]
    },
    // Private static method.
    {
      code: `class Foo { private static helper(): void {} }`,
      errors: [{ messageId: 'privateMethod' }]
    },
    // Private getter is reported as a method.
    {
      code: `class Foo { private get x(): number { return 1; } }`,
      errors: [{ messageId: 'privateMethod' }]
    },
    // Private constructor.
    {
      code: `class Foo { private constructor() {} }`,
      errors: [{ messageId: 'privateConstructor' }]
    },
    // Multiple private members are each reported.
    {
      code: `class Foo { private count = 0; private helper(): void {} }`,
      errors: [{ messageId: 'privateField' }, { messageId: 'privateMethod' }]
    }
  ]
});
