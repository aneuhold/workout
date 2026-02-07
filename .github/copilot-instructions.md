# Repo-specific instructions for AI coding agents

This repository is a SvelteKit app (Svelte 5) managed with pnpm.

- Quick commands (use `pnpm`):
  - Dev server: `pnpm dev` (runs `pnpm theme` then `vite dev`)
  - Build: `pnpm build` (runs `pnpm theme` then `vite build`)
  - Preview: `pnpm preview`
  - Storybook: `pnpm storybook` (also runs `pnpm theme`)
  - Check: `pnpm check` (TypeScript)
  - Lint: `pnpm lint` (ESLint)

- Important project files to consult:
  - `package.json` — scripts, pnpm configuration.
  - `README.md` — architecture notes (store flow, singletons, recurring tasks) and local development tips.
  - `svelte.config.js` — adapter (static), and path aliases ($components, $stores, $services, ...).
  - `vite.config.ts` — Sentry integration, node polyfills for browser crypto, Vitest merge.
  - `src/globalStyles/_smui-theme.scss` and `src/globalStyles` — theme inputs used by `yarn theme`.
  - `src/components` — UI components; look for files prefixed with `Singleton` (single-instance components exposing imperative update functions).
  - `src/stores` and `src/services` — core state patterns. See `README.md` for parent/child store sequence diagram and `pageInfo.ts` usage.

- Architecture & conventions (concrete):
  - Singleton UI components: files named `Singleton*` are single-instance widgets (snackbar, confetti, dialogs). They export imperative functions to update/show state rather than being instantiated multiple times.
  - Routes: prefer copying an existing route folder and adapting. `pageInfo.ts` files are kept outside module context because they must be importable before Svelte module load.
  - State management: Use modern Svelte 5 typically such as the `$state()` syntax. For more complex state, use stores and services in `src/stores` and `src/services`.

- Integrations & environment notes:
  - Sentry: configured both in `vite.config.ts` (upload source maps) and `hooks.client.ts`. `SENTRY_AUTH_TOKEN` must be set to enable uploads. Vite logs an error if the token is missing.
  - Node polyfills: `vite-plugin-node-polyfills` is used so some node packages (crypto, util, stream) work in browser bundles.
  - Adapter: SvelteKit uses `@sveltejs/adapter-static` with `fallback: 'app.html'`. Production output is in `build/`.

- Small contract for an agent working here:
  1. Read `package.json` & `README.md` to learn workflow scripts and store patterns.
  2. For code changes, run `pnpm test`, `pnpm lint`, and `pnpm check` before considering a task complete.

- Examples to reference when making edits:
  - Aliases useful for imports: `$components`, `$stores`, `$services` (defined in `svelte.config.js`).

## Tool Information

- When using the Sentry MCP server, the organization slug is `anton-neuhold`.

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
