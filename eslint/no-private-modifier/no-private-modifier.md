# `no-private-modifier`

Class members must use the ECMAScript `#private` syntax instead of the
TypeScript `private` accessibility modifier.

Native `#private` fields are enforced at runtime and are truly inaccessible from
outside the class, whereas TypeScript's `private` is a compile-time-only
annotation that disappears in the emitted JavaScript. Standardizing on `#`
removes that ambiguity.

## What it checks

Every form of the `private` modifier on a class member is reported:

- Instance and `static` fields, including `accessor` properties.
- Instance and `static` methods, getters, and setters.
- Constructors (`private constructor() {}`).

`public` and `protected` members, and members with no modifier, are left alone —
this rule is only concerned with replacing `private`.

**Constructor parameter properties are allowed.** `constructor(private foo: T)`
is a concise, readable shorthand that declares and assigns the field in one
place, and `#private` has no equivalent. Flagging it would force the verbose
field-plus-assignment form for no real benefit, so the rule permits it.

## Autofix

None. Converting `private` to `#` requires renaming every reference
(`this.foo` → `this.#foo`), and parameter properties additionally need a field
declaration plus a constructor-body assignment. These transforms are not safe to
apply automatically, so violations are reported without a fix.

## Rule details

Examples of **incorrect** code:

```ts
class Counter {
  private count = 0;
  private static total = 0;
  private accessor label = '';

  private increment(): void {}

  private constructor() {}
}
```

Examples of **correct** code:

```ts
class Counter {
  #count = 0;
  static #total = 0;
  accessor #label = '';

  #increment(): void {}
}

class Service {
  // Parameter properties are allowed.
  constructor(private readonly client: Client) {}
}
```

## When not to use it

Disable it if you need TypeScript `private` semantics specifically — for
example, when a member must remain reflectively accessible at runtime, or when
interoperating with code that reaches into instances in ways true `#private`
fields would break.
