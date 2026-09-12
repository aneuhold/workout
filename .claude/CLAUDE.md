@../README.md

# workout

## Language

@../node_modules/@aneuhold/robot-instructions/src/instructions/lang/typescript.md

@../node_modules/@aneuhold/robot-instructions/src/instructions/lang/css.md

## Runtime

@../node_modules/@aneuhold/robot-instructions/src/instructions/runtime/node.md

## Framework

@../node_modules/@aneuhold/robot-instructions/src/instructions/framework/svelte.md

@../node_modules/@aneuhold/robot-instructions/src/instructions/framework/sveltekit.md

## Tooling

@../node_modules/@aneuhold/robot-instructions/src/instructions/tooling/vitest.md

@../node_modules/@aneuhold/robot-instructions/src/instructions/tooling/storybook.md

## UI

@../node_modules/@aneuhold/robot-instructions/src/instructions/ui/tailwind.md

@../node_modules/@aneuhold/robot-instructions/src/instructions/ui/shadcn-svelte.md

## This repo

A SvelteKit app (Svelte 5) using Tailwind CSS v4 and shadcn-svelte components, managed with pnpm.

### Quick commands

- Dev server: `pnpm dev`
- Build: `pnpm build`
- Check: `pnpm check` (TypeScript + circular dependency check)
- Lint: `pnpm lint` (ESLint)
- Test: `pnpm test` (Vitest)

### Important project files

- `package.json`: scripts, pnpm configuration
- `README.md`: architecture notes, local development tips
- `svelte.config.js`: adapter (static), path aliases (`$components`, `$stores`, `$services`, `$ui`)
- `vite.config.ts`: Sentry integration, Tailwind, node polyfills for browser crypto, Vitest
- `src/globalStyles/global.css`: Tailwind v4 imports, CSS variables for theming (base-nova style)
- `src/components/ui`: shadcn-svelte UI components (installed via CLI)
- `src/stores`: Svelte stores (`writable`/`readable`/`derived` from `svelte/store`)
- `src/services`: singleton service classes (including rune-based reactive state)

### Shared library: `@aneuhold/core-ts-db-lib`

The workout app depends on `@aneuhold/core-ts-db-lib`, a schema-first data modeling and service library located on disk at `~/Development/GithubRepos/ts-libs/packages/core-ts-db-lib`. Key folders:

- `src/documents/workout/`: Zod-validated document types (WorkoutSession, WorkoutExercise, WorkoutSet, WorkoutMesocycle, WorkoutMicrocycle, WorkoutEquipmentType, WorkoutExerciseCalibration, WorkoutMuscleGroup, WorkoutSessionExercise)
- `src/embedded-types/workout/`: nested value types used within documents (RSM, Fatigue)
- `src/services/workout/`: domain logic services (WorkoutSessionService, WorkoutExerciseService, WorkoutSetService, WorkoutMesocycleService, WorkoutMicrocycleService, WorkoutEquipmentTypeService, WorkoutExerciseCalibrationService, WorkoutSFRService)
- `src/documents/common/`: shared documents (User, ApiKey)

You are encouraged to modify this library when the change involves document types, embedded types, or core domain logic that doesn't involve frontend state. If you make changes there, follow the instructions at `~/Development/GithubRepos/ts-libs/.claude/CLAUDE.md`. Run appropriate tests and add new tests for any changes. Once all changes in the library are complete, wait 6 seconds before expecting them to reflect in the workout app. Changes propagate automatically.

### UI components and styling

- Use the `add-new-shadcn-component` skill to add new shadcn-svelte components to the project, unless you are currently that agent, in which case follow your defined workflow directly.
- Merge classes with the `cn()` utility from `$util/svelte-shadcn-util`.
- Theme colors are defined in `src/globalStyles/global.css` as CSS custom properties (`--primary`, `--background`).
- Icon library: Tabler icons via `@tabler/icons-svelte`.
- Dark mode is managed by the `mode-watcher` package. Use the `.dark` class variant in Tailwind.

### Animation

The app uses a layered approach. Each layer uses the simplest tool that works, and `prefers-reduced-motion` is handled by a single global media query in `global.css`. Prefer higher layers first:

1. **CSS pseudo-classes (`:active`, `:hover`, `:focus`)** for instant interaction feedback, such as the nav tap highlight. Zero JS, zero overhead.
2. **Tailwind utility classes and CSS keyframes** for entrance effects, tab switches, and any animation that doesn't depend on dynamic height. The `animate-fade-in-up` keyframe in `global.css` powers content entrances. Use `data-*` attribute selectors (e.g. `data-[state=active]:animate-fade-in-up`) to tie animations to component state set by bits-ui and shadcn-svelte.
3. **View Transitions API** for page navigation cross-fades. Scoped to the `<main>` element via `view-transition-name: main-content` so TopBar and NavBar stay static. Progressive enhancement, so it does nothing in unsupported browsers.
4. **Svelte transitions (`transition:slide`, `in:fly`)** only when CSS alone can't do it. For staggered list entrances, use the `<StaggerItem>` wrapper component (`src/components/StaggerItem/StaggerItem.svelte`), which centralizes the fly-in parameters.

Do not animate individual set rows, badge lists, or other fine-grained items. Keep it to page-level and section-level effects.

### Routes and pages

- When adding a new route, also add a matching branch in `src/pages/SBFullApp/SBFullAppRouter.svelte` so the Full App Storybook story can navigate to it.

### Conventions

- Service file naming is enforced by linting.
- Use the utilities in `/test-utils` whenever possible to avoid duplication in tests.

### Tool information

- **Svelte MCP server**: use it to better understand how Svelte works and to get help with Svelte-specific questions.
- **Sentry MCP server**: the organization slug is `anton-neuhold`.

### Before considering a task complete

1. Run + fix any issues that come up: `pnpm lint --fix`, `pnpm check`, and `pnpm test`.
