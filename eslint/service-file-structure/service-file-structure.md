# `service-file-structure`

Enforces the singleton-service file shape for any file the project treats as a
service.

## Which files are checked

A file is treated as a service when its basename ends in `service.ts` or
`service.svelte.ts`, where only the leading `S` is case-insensitive — so
`WakeLockService.ts`, `wakeLock.service.ts`, and `setMapService.svelte.ts` all
qualify. The gate is intentionally broad so that mis-named services are still
caught and reported (rule 1). Test, spec, and mock variants (`*.test.*`,
`*.spec.*`, `*.mock.*`) are excluded. All other files are ignored entirely.

## What it enforces

1. **The file name follows the convention** — `<name>.service.ts` or
   `<name>.service.svelte.ts`.
2. **Exactly one class**, and it is named.
3. **No functions outside the class** — neither `function` declarations nor
   exported ones. Move them in as (private) methods.
4. **No variables outside the class** — top-level `const`/`let`/`var` (including
   `export const`) are forbidden; make them private instance or static fields.
   The only exception is the singleton binding (rule 6).
5. **The singleton is conventionally named** — `const xService = new XService()`
   must use the class name with a lowercased first letter.
6. **A freshly-constructed default export uses the `const`-bound form** —
   `export default new XService();` is rewritten to
   `const xService = new XService();` + `export default xService;`.

Exporting the **class itself** as the default (`export default class XService {}`
or `export default XService`) is allowed and not rewritten, since such a class
may be intended for extension.

## Autofix

- `export default new XService();` (with or without constructor arguments) is
  rewritten to the two-line `const` + `export default` form.
- The other violations (a non-conforming file name, extra classes, stray
  declarations, a mis-named singleton) are reported without a fix.

## Rule details

Examples of **incorrect** code (in a `foo.service.ts` file):

```ts
// Function and constant outside the class.
function helper() {}
const MAX = 3;

class FooService {}
const fooService = new FooService();
export default fooService;
```

```ts
// Inline default export (auto-fixed).
class FooService {}
export default new FooService();
```

Examples of **correct** code:

```ts
class FooService {
  private readonly max = 3;
  private helper(): void {}
}
const fooService = new FooService();
export default fooService;
```

```ts
// A service meant to be extended may export its class as the default.
export default class FooService {}
```

## How it is implemented

The rule is a thin orchestrator. It gates on the filename (`isServiceFile.ts`),
resolves the single service class into a shared model (`serviceModel.ts`), then
runs a list of independent validations from `validations/`:

- `validateFileNamingConvention.ts` — file-level; runs even with no valid class
- `validateNoTopLevelFunctions.ts`
- `validateNoTopLevelVariables.ts`
- `validateSingletonName.ts`
- `validateDefaultExportIsConstBound.ts`

Add a new restriction by writing another `validations/validate<Concern>.ts`
module and listing it in `service-file-structure.ts`.

## When not to use it

Disable it for files that are named like services but intentionally export
something other than a single class. Prefer renaming such files so the gate no
longer matches.
