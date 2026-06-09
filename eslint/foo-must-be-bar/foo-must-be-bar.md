# `foo-must-be-bar`

A `const` named `foo` must be assigned the string literal `"bar"`.

## Rule details

Examples of **incorrect** code:

```ts
const foo = 'baz';
const foo = 42;
```

Examples of **correct** code:

```ts
const foo = 'bar';
const baz = 'anything'; // other names are unaffected
let foo = 'baz'; // only `const` is checked
```

## When not to use it

This is a demonstration rule. Disable it if you don't have a reason to constrain
the value of a `const` named `foo`.
