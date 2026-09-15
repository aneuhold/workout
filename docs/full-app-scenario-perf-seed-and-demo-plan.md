# Full App Scenario Data for the Perf Seed and a Demo Mode Plan

Goal: make the Full App scenarios part of `MockData` (`testUtils/MockData/`) so they're the single source of example workout data for three consumers:

1. The Full App Storybook stories.
2. The perf account seed (`scripts/commands/perf/seed.ts`), replacing its hand-built mesocycle.
3. A demo mode on the real site, turned on with a `?demo` query parameter and remembered for the tab in `sessionStorage`. It runs the normal app on scenario data with the API stubbed the way Storybook stubs it and `LocalData` held in memory, so nothing is sent or saved. A "Demo" button exits it.

---

## Background

These facts shape the steps below.

- **Perf marks need an active mesocycle.** `PerfMark.HomeRendered` and `PerfMark.SessionsListRendered` only fire when `mesocycleMapService.categorizedMesocycles.active` is set (`HomePage.svelte`, `SessionsPage.svelte`). `active` is the first mesocycle without a `completedDate`. The Historical Data scenario completes all three of its mesocycles, so `perf.spec.ts` would time out waiting for the marks.
- **Current scenario sizes** (measured by running each scenario and counting `allDocs` in the nine document map services):

  | Data | Mesocycles | Sessions | Sets | Total documents |
  |---|---|---|---|---|
  | Current perf seed | 1 | 20 | 117 | 229 |
  | Mid-Training | 1 | 26 | 166 | 301 |
  | Mesocycle Start, Deload Trigger | 1 | 30 | 240 | 388 |
  | Historical Data | 3 | 94 | 761 | 1,143 |

- **Storybook stubs the API but not storage.** `.storybook/preview.ts` calls `TestSetup.setupGlobalMocks(spyOn)`, which stubs `APIService.callWorkoutAPI`, `APIService.logout`, `APIService.deleteAccount`, and `WebSocketService.connect`. `LocalData` isn't stubbed there. Its writes go to the Storybook dev server's own browser storage, which never touches the deployed site.
- **Mocks and pages write through `LocalData`.** Every mock `reset()` calls `setMap({})`, and interacting with pages (logging a set, completing a session) persists maps and the `WorkoutAPIService` request queue through `LocalData`.
- **Browser storage scope.** `localStorage` is shared by every page on the same origin, while `sessionStorage` is partitioned by browser tab and origin ([MDN Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)). Every `LocalData` key uses the same `v5-` prefix (`storagePrefix.ts`), so demo writes through the normal backends would overwrite a signed-in user's cached maps and persisted API queue in that browser.
- **The root layout initializes everything once per page load.** `src/routes/+layout.svelte` runs `LocalData.init()`, rehydrates the stores and document maps from the cache, and calls `loginState.init()`, which restores a signed-in user's token and fetches their data. Until `loginState` leaves `Initializing`, `(app)/+layout.svelte` only shows "Loading...", so no page mounts before this finishes.
- **Mock data is built when it's imported.**
  - `MockData`'s static `userConfigMock` field constructs `UserConfigMock`, whose constructor sets the `userConfig` store to a "Mock User".
  - The static `defaultMuscleGroups`, `defaultEquipmentTypes`, `defaultExercises`, and `defaultCalibrations` records are built at import with whatever `TestUsers.currentUserCto._id` was at that moment. That's why `seed.ts` overwrites `userId` on every document after changing that ID.
  - The nine map-service mock instances on `MockData` have no constructors or fields, so creating them does nothing else.
  - `TestSetup.setupGlobalMocks` runs before every Vitest test and Storybook story, and already calls `MockData.resetAll()` and `MockData.userConfigMock.reset()`. `setupBaseData` isn't universal: the muscle group and equipment form dialog stories call `addDefaultMuscleGroups()` and `addDefaultEquipmentTypes()` directly.
- **Generated documents inherit their owner.** `WorkoutMesocycleService` and `WorkoutSessionService` copy `userId` from the mesocycle onto the documents they generate, and `WorkoutSetService` copies it from the exercise CTO (`core-ts-db-lib`).

---

## Part 1: Shared scenario data

### Step 1: Move the scenarios into `MockData`

`testUtils/MockData/MockData.ts` (moved from `testUtils/MockData.ts`), `testUtils/MockData/MockScenario.service.ts` (new), `src/pages/SBFullApp/sbFullAppScenarios.ts` (deleted)

- Move `MockData.ts` into the new `testUtils/MockData/` folder, fix its `./TestUsers` import, and update the 27 files that import `$testUtils/MockData`.
- Move the `FullAppScenario` enum into `MockData.ts` as an export.
- Add `MockData.setupScenario(scenario)`, which defers to `MockScenarioService`.
- Add `MockScenarioService` as `export default class MockScenarioService` with static methods, like `WorkoutHydrationService`. It holds the scenario switch and the helper functions from `sbFullAppScenarios.ts` (`setupDeloadTriggerScenario`, `setupHistoricalDataScenario`, `setupFreeFormWorkoutScenario`, `getSessionIdsForMicrocycles`) as private static methods, because the `service-file-structure` lint rule allows no functions or variables outside the class. It imports `MockData` for the mock services, the same way the `*.service.mock.ts` files already do.
- Remove the `routeState` dependency. The Free-Form Workout and Deload Trigger scenarios currently call `routeState.navigate` to open a session. Instead, `setupScenario` returns the URL the scenario should open (or `null`), and `SBFullAppExample` passes it to `routeState.navigate`. That keeps `testUtils` independent of the Storybook router.
- Point `FullApp.stories.svelte` and `SBFullAppExample.svelte` at `MockData`, then delete `sbFullAppScenarios.ts`.

### Step 2: Build mock data when it's set up, not when it's imported

`src/stores/local/userConfig/userConfig.mock.ts`, `src/services/documentMapServices/MuscleGroupMap.service.mock.ts`, `EquipmentTypeMap.service.mock.ts`, `ExerciseMap.service.mock.ts`, `ExerciseCalibrationMap.service.mock.ts`

- `UserConfigMock`: drop the constructor's `reset()` call and its `userId` parameter, and have `reset()` read `TestUsers.currentUserCto._id` when called. `TestSetup.setupGlobalMocks` already calls `MockData.userConfigMock.reset()` explicitly.
- Default documents: `addDefaultMuscleGroups`, `addDefaultEquipmentTypes`, `addDefaultExercises`, and `addDefaultCalibrations` build their documents when called, using the current `TestUsers.currentUserCto._id`, and fill the static `default*` records that other code reads. `setupBaseData` already calls them in dependency order (muscle groups and equipment, then exercises, then calibrations). The two dialog stories only call the muscle group and equipment methods, which have no dependencies, and nothing reads the records at a file's top level.
- The nine map-service mock instances stay as static fields. Creating them has no effect, and moving them would leave `MockData.*Mock` undefined until initialized in every importing file.

### Step 3: Give Mid-Training a training history

`testUtils/MockData/MockData.ts`, `testUtils/MockData/MockScenario.service.ts`

- Rename `FullAppScenario.MidTraining` to `MidTrainingWithHistory = 'midTrainingWithHistory'`.
- Give the Historical Data setup method a parameter for how many days ago its last mesocycle was completed, and offset the mesocycle dates from it. The Historical Data case passes `1`, which is today's behavior.
- At the start of the `MidTrainingWithHistory` case, run the history setup so it ends a week before the block starts (`daysAgo(21)`), then keep the existing Mid-Training setup. The history's mesocycles all have a `completedDate`, so the Mid-Training block stays `active`. Estimated size from the measured counts: about 1,400 documents.

`src/pages/SBFullApp/FullApp.stories.svelte`, `src/pages/SBFullApp/SBFullAppExample.svelte`

- Rename the "Mid-Training" story to "Mid-Training With History", and update the story's default `args.scenario` and `SBFullAppExample`'s `scenario` prop default to the renamed member.

---

## Part 2: Perf seed

### Step 4: Seed the perf account from the scenario

`scripts/commands/perf/seed.ts`

- Keep authentication, `vi.restoreAllMocks()`, and the `TestUsers.currentUserCto._id` assignment.
- Replace `MockData.setupBaseData()` and `MesocycleMapServiceMock.generateFullMesocycle(...)` with `MockData.setupScenario(FullAppScenario.MidTrainingWithHistory)`.
- Build the insert payload from `allDocs` on the nine document map services (the same nine `WorkoutHydrationService` hydrates).
- Remove the `userId` overwrite. After Step 2, every document is built after the seed sets `TestUsers.currentUserCto._id`, and generated documents inherit that ID from the mesocycle and exercise CTOs.
- Derive the expected counts from the payload. Delete `EXPECTED_COUNTS`, `COLLECTION_KEYS`, and `SEED_START_DATE`. The order becomes: authenticate, generate the scenario, fetch the account's documents, compare counts, then wipe and insert only when they differ.
- Update the doc comments to describe the scenario as the data source.

No changes to `vite.perf.config.ts` or `.github/workflows/pull-request.yml`.

### Step 5: Refresh the local perf baseline

- Run `pnpm test:perf`. It reseeds the account, measures, and rewrites `scripts/commands/perf/localBaseline.json`. Commit the new baseline, since the larger data set changes every metric.

---

## Part 3: Demo mode

### Step 6: Add an in-memory `LocalData` backend

`src/util/LocalData/InMemoryBackend.ts` (new), `src/util/LocalData/InMemoryBackend.spec.ts` (new), `src/util/LocalData/LocalData.ts`

- `InMemoryBackend` implements `ILocalDataBackend` with a `Map`, and `cleanupOldVersions` does nothing. It's named after its storage, like `IndexedDbBackend`, `LocalStorageBackend`, `PreferencesBackend`, and `SqliteBackend`. The spec follows `IndexedDbBackend.spec.ts` and `LocalStorageBackend.spec.ts`.
- `LocalData.init` gets an optional `ILocalDataBackend` parameter. When one is passed, both `#smallBackend` and `#largeBackend` use it. Existing callers don't change.

### Step 7: Add demo setup on top of `setupGlobalMocks`

`testUtils/TestSetup.ts`

- Add a static method (proposed: `setupDemo`) that:
  1. Calls `LocalData.init(new InMemoryBackend())`. This comes first because `setupGlobalMocks` resets `MockData`, which writes through `setMap`.
  2. Calls `setupGlobalMocks` with a small method-replacing `SpyOnFn` kept private to `TestSetup`, which stubs the API and WebSocket exactly as Storybook and Vitest do.
  3. Calls `MockData.setupScenario(FullAppScenario.MidTrainingWithHistory)`.
  4. Sets `userConfig` (without propagation) to `TestUsers.currentUserCto`'s ID and a demo username, which `TopBar` shows.
  5. Sets `loginState` to `LoginState.LoggedIn`. `loginState.init()` isn't used because it needs an access token and fetches data. With no token set, `WorkoutAPIService.getInitialDataIfNeeded()` also stays idle when the tab regains focus.
- Update the class doc comment, which currently says the mocks are for tests only.

### Step 8: Turn demo mode on from the root layout, with a Demo button

`src/routes/+layout.svelte`

- In `onMount`, demo mode is on when `page.url.searchParams.has('demo')` (importing `page` from `$app/state`, as `(app)/+layout.svelte` does) or when the demo flag is already in `sessionStorage`. When the parameter is present, set the flag. The key uses `STORAGE_PREFIX` like the `LocalData` keys and stays local to this file. SvelteKit forbids reading `url.searchParams` while prerendering but allows it in the browser, for example in `onMount` ([SvelteKit page options](https://svelte.dev/docs/kit/page-options)).
- When demo mode is on, load `TestSetup` with a dynamic `import()` and call `setupDemo()` instead of `LocalData.init()`, the store and document map hydration, and `loginState.init()`. `timerService.init()` and `nativePlatformService.init()` run either way.
- After Step 2, importing the mocks no longer changes app state, so the dynamic import is only about load cost. MDN recommends dynamic imports when a static import would slow loading for code that's unlikely to be needed, and notes static imports are evaluated at load time ([MDN `import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)). Here, about 1,800 lines of mock, scenario, and test-utility source would otherwise load on every visitor's startup, which the perf tests measure. Confirm the separate chunk in the build output (see Validation), since this is the first production code to import `$testUtils`.
- While demo mode is on, render a simple "Demo" `Button` (from `src/components/ui/Button`) fixed at the bottom left, raised above the mobile NavBar by `--bottom-nav-height` below the `md` breakpoint. Tapping it removes the flag and loads `/` as a full page load, which brings back the real stores and API.
- Update the component's doc comment.

Resulting behavior:

- The resume links to the site's root with `?demo`. The home route is already prerendered, so no new route or hosting change is needed.
- Navigating inside the app keeps demo mode, with real routes and real URLs, and reloading the tab stays in demo mode even after `?demo` drops out of the address bar. Closing the tab ends it.
- The Demo button shows on every page because the root layout wraps both `(app)` and `(marketing)`. Tapping it returns to the real app, and since the demo saved nothing, the browser's stored session and cache are exactly as they were.
- Logging out from Settings during the demo shows the login screen, and the Demo button still exits.

---

## Validation

1. `pnpm lint --fix`, `pnpm check`, and `pnpm test` (required by `.claude/CLAUDE.md`). `pnpm check` catches any missed `$testUtils/MockData` import, and `pnpm test` covers the new `InMemoryBackend.spec.ts` plus the specs that use the default exercise records.
2. `pnpm storybook`:
   - Every story still renders after the `MockData` move and the explicit initialization, including the muscle group and equipment form dialog stories.
   - "Mid-Training With History" shows three past mesocycles plus the active block.
   - Historical Data looks unchanged.
   - Free-Form Workout and Deload Trigger still open on their session.
3. `pnpm test:perf:seed` twice: the first run wipes and reseeds, and the second logs that counts match and skips. A match on the second run also confirms every inserted document belongs to the perf user without the `userId` overwrite.
4. `pnpm test:perf`: all three metrics are recorded for both throttling modes.
5. `pnpm preview`, then:
   - `http://localhost:5173/?demo` opens straight into the app with the scenario data and no login screen, and the Demo button sits at the bottom left above the mobile NavBar.
   - Every NavBar item and a session page open normally, and reloading keeps demo mode.
   - Logging sets and completing a session work, and the Network panel shows no requests to `api.antonneuhold.com` or socket.io.
   - Sign in at `http://localhost:5173/` in another tab first. After using the demo, reloading the signed-in tab still shows that user's own data, and its `v5-` storage entries are unchanged.
   - Tapping Demo returns to the real app, and a reload afterward stays out of demo mode.
   - The build output puts `TestSetup`, `MockData`, and `MockScenarioService` in a chunk that only loads in demo mode.

---

## Open questions

1. **Naming:** `InMemoryBackend`, `TestSetup.setupDemo`, and whether `FullAppScenario` should be renamed now that it lives in `MockData` and isn't specific to the Full App story (for example `MockScenario`, to match `MockScenarioService`).
