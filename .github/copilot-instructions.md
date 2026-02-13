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
- **Adding components**: Use the `add-new-shadcn-component` sub-agent to add new shadcn-svelte components to the project (unless you are currently that agent, in which case follow your defined workflow directly).
- **Tailwind CSS v4**: Use utility classes for styling. No `@apply` in components; use `cn()` utility from `$util/svelte-shadcn-util` to merge classes. Do not use `w-[100px]` or similar px values. Use Tailwind's spacing scale (e.g., `w-25`) or custom CSS variables if needed. Note that some things need to still contain the brackets because they actually mean something that needs to be a variable, such as `supports-[backdrop-filter]`.
- **Class merging**: Always use `cn()` when conditionally applying Tailwind classes: `class={cn('base-class', condition && 'conditional-class')}`
- **CSS Variables**: Theme colors defined in `src/globalStyles/global.css` using CSS custom properties (e.g., `--primary`, `--background`)
- **Icon library**: Tabler icons via `@tabler/icons-svelte`
- **Dark mode**: Managed by `mode-watcher` package; use `.dark` class variant in Tailwind
- **Clean CSS**: Never use inline styles, and try to keep the number of CSS classes to the absolute minimum. Using a small amount of CSS classes is a good indication that you are leveraging CSS correctly. If you find yourself needing to add a large number of CSS classes to a component, it's often a sign you need to take a step back and rethink your approach.

### Component Patterns

- **Svelte 5 syntax**: Use modern runes (`$state()`, `$derived()`, `$effect()`, `$props()`)
- **Singleton components**: Files named `Singleton*` are single-instance widgets (snackbar, confetti, dialogs) that export imperative functions
- **UI components**: shadcn-svelte components are stored in `src/components/ui` (accessible via `$ui` alias)
- **Component docs**: Use JSDoc `@component` tag at top of `.svelte` files

### Storybook Stories

- Each `Story` is an instance of the component being tested, not a wrapper. Build variations accordingly.
- If a wrapper is needed in order to properly demonstrate the functionality of the component, or provide easier access / test data to the various properties of the component, build a separate component next to the original called `SB<ComponentName>Example.svelte` and use that as your target component for the story variations.

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
- Use named imports only (NEVER `import * as`)
- Import at file top (inline only when absolutely necessary)

### Enums

- Use PascalCase for enum names and values
- Use TypeScript `enum` (not `const enum` or `type`)
- Avoid string unions in as many cases as possible, prefer string enums for better readability and maintainability

### Syntax and Best Practices

- NEVER use `['propertyName']` syntax to access properties, always use `.propertyName` unless the property name is dynamic. Even then though, a variable / constant should be used instead of a string literal.
- Use object destructuring when accessing multiple properties from an object
- Prefer template literals over string concatenation.

## Tests

- Follow the same TypeScript conventions as in the main codebase, including never using `any`
- Use Vitest for unit tests
- Writes tests in a separate file next to the original but with `.test.ts` appended to the file name
- Prefer using real implementations over mocks unless necessary. For example, always use the associated Schema.parse to create new example documents in tests.
- DRY: Don't Repeat Yourself (avoid duplicate code in tests) Create helper functions for common test scenarios.
- Always make tests concise and focused on business logic, not implementation details.
- Use utilities in `/test-utils` whenever possible to avoid code duplication.
