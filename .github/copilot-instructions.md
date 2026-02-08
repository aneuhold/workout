# Repo-specific instructions for AI coding agents

This repository is a SvelteKit app (Svelte 5) using Tailwind CSS v4 and shadcn-svelte components, managed with pnpm.

## Quick Commands

Use `pnpm` for all package management:

- Dev server: `pnpm dev`
- Build: `pnpm build`
- Preview: `pnpm preview`
- Storybook: `pnpm storybook`
- Check: `pnpm check` (TypeScript + circular dependency check)
- Lint: `pnpm lint` (ESLint)
- Test: `pnpm test` (Vitest)

## Important Project Files

- `package.json` — scripts, pnpm configuration
- `README.md` — architecture notes, local development tips
- `svelte.config.js` — adapter (static), path aliases ($components, $stores, $services, $ui, etc.)
- `vite.config.ts` — Sentry integration, Tailwind, node polyfills for browser crypto, Vitest
- `src/globalStyles/global.css` — Tailwind v4 imports, CSS variables for theming (base-nova style)
- `src/components/ui` — shadcn-svelte UI components (installed via CLI)
- `src/stores` and `src/services` — core state management patterns

## Architecture & Conventions

### UI Components & Styling

- **shadcn-svelte**: Use pre-built accessible components from shadcn-svelte. Reference: https://shadcn-svelte.com/llms.txt
- **Adding components**:
  1.  `pnpm dlx shadcn-svelte@latest add COMPONENT-NAME` (see [available components](https://shadcn-svelte.com/docs/components))
  2.  Run `pnpm lint --fix` after installing to fix any formatting issues
  3.  Rename all the components to what they are, by default, exported as. For example when `Card`, `CardAction`, and `CardFooter` are first installed, the files are named `card.svelte`, `card-action.svelte`, and `card-footer.svelte`. They should be renamed to `Card.svelte`, `CardAction.svelte`, and `CardFooter.svelte` respectively.`
  4.  Rename the containing folder of the new components to the capital case version of the component name. For example, if you add the `Alert` component, the containing folder should be renamed from `alert` to `Alert`.
  5.  Delete the `index.ts` file that gets generated, and import from the files directly.
  6.  Go to the actual shadcn component examples starting here: https://github.com/shadcn-ui/ui/tree/main/apps/v4/examples/base/ui (you can use the GitHub MCP server) for the associated components that were generated, grab the class names / styling that is used in the React components and replace the class names / styling that comes by default from shadcn-svelte with the ones you retrieved. So put React class names -> Svelte components. Don't over complicate this, and make sure the class names match exactly.
  7.  Look at the existing examples of storybook stories, and then create a single story file per component with a few stories in that file showcasing different variants and use cases.
- **Tailwind CSS v4**: Use utility classes for styling. No `@apply` in components; use `cn()` utility from `$util/svelte-shadcn-util` to merge classes
- **Class merging**: Always use `cn()` when conditionally applying Tailwind classes: `class={cn('base-class', condition && 'conditional-class')}`
- **CSS Variables**: Theme colors defined in `src/globalStyles/global.css` using CSS custom properties (e.g., `--primary`, `--background`)
- **Icon library**: Tabler icons via `@tabler/icons-svelte`
- **Dark mode**: Managed by `mode-watcher` package; use `.dark` class variant in Tailwind

### Component Patterns

- **Svelte 5 syntax**: Use modern runes (`$state()`, `$derived()`, `$effect()`, `$props()`)
- **Singleton components**: Files named `Singleton*` are single-instance widgets (snackbar, confetti, dialogs) that export imperative functions
- **UI components**: shadcn-svelte components are stored in `src/components/ui` (accessible via `$ui` alias)
- **Component docs**: Use JSDoc `@component` tag at top of `.svelte` files

### Routes & Pages

- Copy an existing route folder and adapt when creating new routes
- `pageInfo.ts` files are kept outside module context because they must be importable before Svelte component load

### State Management

- **Simple state**: Use Svelte 5 runes (`$state()`, `$derived()`)
- **Complex state**: Use stores (`src/stores`) and services (`src/services`)
- **Store types**: `local/` (persisted), `session/` (session-only), `derived/` (computed)

## Before Completing Tasks

1. Run: `pnpm test`, `pnpm lint`, and `pnpm check`

## Tool Information

- **Svelte MCP server**: Use the Svelte MCP server to better understand how Svelte works and to get help with Svelte-specific questions.
- **shadcn-svelte**: For component documentation and patterns, reference https://shadcn-svelte.com/llms.txt.
- **Sentry MCP server**: Organization slug is `anton-neuhold`

## Code Style

### Types & Functions

- NEVER EVER use `any` NOT EVEN IN TESTS (use `unknown` if necessary, and only if absolutely unavoidable).
- Add explicit types when unclear; extract complex object types to separate `type` declarations
- Use PascalCase for type names; file names should match the primary exported type
- Use arrow functions and `const`/`let` (never `var`)
- Use `async`/`await` instead of `.then()`

### Documentation & Naming

- Add JSDoc for all methods, functions, and classes (include `@param`, omit `@returns`)
- Add JSDoc for public class properties only if complex
- Never prefix functions/methods with underscores

### Class Structure

- Order methods by visibility: public, protected, private
- Within same visibility, order doesn't matter

## File Organization

### Imports

- Use relative imports within package, package references for external packages
- Use named imports only (never `import * as`)
- Import at file top (inline only when absolutely necessary)

### Enums

- Use PascalCase for enum names and values
- Use TypeScript `enum` (not `const enum` or `type`)

## Tests

- Follow the same TypeScript conventions as in the main codebase, including never using `any`
- Use Vitest for unit tests
- Writes tests in a separate file next to the original but with `.test.ts` appended to the file name
- Prefer using real implementations over mocks unless necessary. For example, always use the associated Schema.parse to create new example documents in tests.
- DRY: Don't Repeat Yourself (avoid duplicate code in tests) Create helper functions for common test scenarios.
- Always make tests concise and focused on business logic, not implementation details.
- Use utilities in `/test-utils` whenever possible to avoid code duplication.
