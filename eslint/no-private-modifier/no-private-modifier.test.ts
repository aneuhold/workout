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
    // Private instance field, rewritten with its `this` reference.
    {
      code: `class Foo { private count = 0; read() { return this.count; } }`,
      errors: [{ messageId: 'privateField' }],
      output: `class Foo { #count = 0; read() { return this.#count; } }`
    },
    // Field with no references is still converted.
    {
      code: `class Foo { private count = 0; }`,
      errors: [{ messageId: 'privateField' }],
      output: `class Foo { #count = 0; }`
    },
    // Private method, rewritten along with its call site.
    {
      code: `class Foo { private helper() {} run() { this.helper(); } }`,
      errors: [{ messageId: 'privateMethod' }],
      output: `class Foo { #helper() {} run() { this.#helper(); } }`
    },
    // Static field referenced via both `Foo.x` and `this.x`.
    {
      code: `class Foo { private static total = 0; static bump() { Foo.total++; this.total++; } }`,
      errors: [{ messageId: 'privateField' }],
      output: `class Foo { static #total = 0; static bump() { Foo.#total++; this.#total++; } }`
    },
    // Accessor property.
    {
      code: `class Foo { private accessor label = ''; show() { return this.label; } }`,
      errors: [{ messageId: 'privateField' }],
      output: `class Foo { accessor #label = ''; show() { return this.#label; } }`
    },
    // Getter/setter pair sharing a name: both declarations convert, the shared
    // reference is rewritten exactly once.
    {
      code: `class Foo { private get x() { return 1; } private set x(v: number) {} use() { return this.x; } }`,
      errors: [{ messageId: 'privateMethod' }, { messageId: 'privateMethod' }],
      output: `class Foo { get #x() { return 1; } set #x(v: number) {} use() { return this.#x; } }`
    },
    // Two distinct members in one class.
    {
      code: `class Foo { private count = 0; private helper() { return this.count; } }`,
      errors: [{ messageId: 'privateField' }, { messageId: 'privateMethod' }],
      output: `class Foo { #count = 0; #helper() { return this.#count; } }`
    },
    // Private constructor: reported, never fixed.
    {
      code: `class Foo { private constructor() {} }`,
      errors: [{ messageId: 'privateConstructor' }],
      output: null
    },
    // Possible cross-instance access (`other.id`) is ambiguous, so no fix.
    {
      code: `class Foo { private id = 1; eq(other: Foo): boolean { return this.id === other.id; } }`,
      errors: [{ messageId: 'privateField' }],
      output: null
    },
    // Computed access can't be expressed as `#`, so no fix.
    {
      code: `class Foo { private val = 1; read() { return this['val']; } }`,
      errors: [{ messageId: 'privateField' }],
      output: null
    },
    // Destructuring a private member off `this` has no `#` form, so no fix.
    {
      code: `class Foo { private val = 1; read() { const { val } = this; return val; } }`,
      errors: [{ messageId: 'privateField' }],
      output: null
    },
    // A colliding `#count` already exists, so the rename is unsafe — report only.
    {
      code: `class Foo { #count = 1; private count = 2; }`,
      errors: [{ messageId: 'privateField' }],
      output: null
    }
  ]
});
