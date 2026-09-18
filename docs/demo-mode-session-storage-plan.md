# Demo Mode: Injected Backends for Storage and Network

Demo mode runs the real app against two injected backends: `sessionStorage` for everything `LocalData` writes, and an `IAPIBackend` implementation that answers without a network. Data lives in the tab, so a reload resumes the demo where the visitor left it, and it is cleared when the demo ends.

## Facts that shape the design

Seeding the `MidTrainingWithHistory` scenario and reading back through `LocalData` gives:

| Data | In memory after seeding | In storage after seeding |
|---|---|---|
| Sessions | 120 | 0 |
| Exercises | 12 | 0 |
| Exercise CTOs | 12 | no key exists |

- **Seeding does not reach storage.** The mock builders use `addDocWithoutPersist`, and each mock's `reset()` writes an *empty* map through `setMap({})`, so all nine `v5-*Map` keys end up holding `{}`. Only in-app mutations (`addDoc`, `updateDoc`, `setMap`) persist. The seed therefore has to be flushed explicitly, which is Step 4.
- **Nothing persists exercise CTOs.** There is no CTO key in `LocalData.storedKeyNames`, because the app refetches them from the API on every load (`getInitialData` asks for `exerciseCTOs` and `muscleGroupVolumeCTOs`). A demo answering `{}` has to rebuild them, or every CTO-driven page (session, exercise, library) comes back empty after a reload. That is Step 5. Volume CTOs need nothing, since no scenario sets them.
- **`resetAll()` is destructive to storage, not just memory.** It runs `setMap({})` on all nine services, and `setMap` persists. Anything that resets after `LocalData.init()` erases the stored demo before it can be read, which is why Step 5 separates backend installation from the resets.
- **`LocalData`'s static fields are evaluated in Node.** The module loads while `pnpm build` prerenders the routes, so a storage backend must not touch `window` in its constructor.
- **Size is not a concern.** The seed serializes to 1,405 documents and about 715 KB of JSON (927 sets alone are 436 KB), well inside the roughly 5 MB per-origin `sessionStorage` budget.
- **`sessionStorage` is the right store.** It is partitioned by tab and origin, survives reloads, and dies with the tab, so the demo never touches a signed-in user's cached data in that browser.

---

# Part 1: The API backend seam

## Step 1: `IAPIBackend` in `core-ts-api-lib`

Do this work in the `ts-libs` worktree at `/Users/aneuhold/Development/GithubRepos/ts-libs-wt-AddAPIInterface`, under `packages/core-ts-api-lib`.

Files: `src/services/APIService/IAPIBackend.ts` (new), `src/services/APIService/API.service.ts`, `src/services/APIService/API.service.spec.ts`, `src/browser.ts`

- `IAPIBackend` describes the surface `APIService` delegates: `authValidateUser`, `authLogout`, `authDeleteAccount`, `projectDashboard`, `admin`, `projectWorkout`, the four token and callback setters, `getUrl`, `setUrl`, and the readonly `defaultUrl`.
- `APIService` holds `static #backend: IAPIBackend = GCloudAPIService` and gains `setBackend(backend)`. Every method delegates through the field. `GCloudAPIService` stays a static class and needs no changes: TypeScript checks its static side against the interface at the assignment.
- Export `IAPIBackend` as a type from `browser.ts` alongside the other type exports, so consumers can implement it.
- Spec: cases for `setBackend` routing calls to an injected backend and for the default being `GCloudAPIService`. The existing cases spy on `GCloudAPIService`'s methods and the default backend is that same class object, so delegation reaches those spies.
- Run `pnpm check`, `pnpm test`, and `pnpm lint` in the package. That worktree publishes to the local registry on its own, and publishing to npm is handled outside this plan.
- From the workout app, run `pnpm sub:core-ts-api-lib` to subscribe to the published package and pick the changes up.

The change is additive, so other consumers of the library are unaffected.

## Step 2: The demo backend

Files: `src/services/MockEnvSetupService/DemoAPIBackend.ts` (new), `src/services/MockEnvSetupService/types.ts` (deleted), `src/services/MockEnvSetupService/MockEnvSetup.service.ts`, `src/services/WebSocket.service.ts`, `testUtils/vitest-setup.ts`, `.storybook/preview.ts`

- `DemoAPIBackend` implements `IAPIBackend`: the call methods resolve `{ success: true, errors: [], data: {} }`, the setters no-op, and `getUrl` returns the default. It lives next to `MockEnvSetup.service.ts`, because the app owns what a stubbed backend answers. The name follows the other backend classes (`LocalStorageBackend`, `IndexedDbBackend`) rather than the `*.service.ts` convention.
- `WebSocketService` gains `disable()`, which makes `connect()` a no-op. Running the client with no server is a mode the app supports, so it gets a real method.
- `setupGlobalMocks()` takes no parameters: it installs `DemoAPIBackend`, disables the WebSocket, and runs `MockDataService.resetAll()` and `userConfigMock.reset()`. Its three callers (`vitest-setup.ts` once, `.storybook/preview.ts` twice) pass nothing. `types.ts` (`MockLike`, `SpyOnFn`) and the private spy shim that used them are deleted.

One installed backend then covers the demo, Vitest, and Storybook through the same path. Nothing in the suite asserts on the stubbed methods: there are zero references to `callWorkoutAPI` outside `MockEnvSetup` and `WorkoutAPIService`, and the specs that check API behavior spy on the app's own `WorkoutAPIService.queryApi`. `Login.stories.svelte` keeps its per-story `spyOn(APIService, 'validateUser')`, which sits on the facade and is independent of the installed backend.

---

# Part 2: Demo data in session storage

## Step 3: `SessionStorageBackend`

Files: `src/util/LocalData/SessionStorageBackend.ts` (new), `src/util/LocalData/SessionStorageBackend.spec.ts` (new), `src/util/LocalData/InMemoryBackend.ts` (deleted), `src/util/LocalData/InMemoryBackend.spec.ts` (deleted)

- `SessionStorageBackend` implements `ILocalDataBackend` against `window.sessionStorage`, mirroring `LocalStorageBackend` method for method. `cleanupOldVersions` keeps the `^v\d+-` predicate, so a tab that outlives a prefix bump drops its stale demo data while SvelteKit's `sveltekit:scroll` and `sveltekit:snapshot` entries stay untouched.
- The methods read `window.sessionStorage` when called, never in the constructor, for the prerender reason above.
- One class per storage mechanism is the pattern the folder follows (`IndexedDbBackend`, `LocalStorageBackend`, `PreferencesBackend`, `SqliteBackend`). The cost is that `cleanupOldVersions` is near-identical in the two web backends.
- Delete `InMemoryBackend.ts` and its spec. Nothing else references them.
- The spec follows `LocalStorageBackend.spec.ts`, plus one case asserting a value written here is absent from `window.localStorage`.

## Step 4: Flush the seeded maps to storage

File: `src/services/WorkoutHydration.service.ts`

- `WorkoutHydrationService.persistDocumentMaps()` is the counterpart to `hydrateDocumentMaps()` and covers the same nine services. For each one it builds a `DocumentMap` from the service's `allDocs` and hands it to `setMap`, which persists. Both are already public, so `DocumentMapStoreService` needs nothing new, and building the map from `allDocs` keeps the existing document objects instead of copying them.
- It belongs here because this class already imports and enumerates those nine services, and the demo calls its `hydrateDocumentMaps()` on the resume path. Anywhere else means a second copy of that list.
- It is synchronous, because `persistToLocalData` returns `void` and the web storage write underneath is synchronous.

## Step 5: Boot the demo from session storage

File: `src/services/MockEnvSetupService/MockEnvSetup.service.ts`

- A private method installs the backends (`DemoAPIBackend`, `WebSocketService.disable()`). `setupGlobalMocks()` calls it and then resets; `setupDemo()` calls it without resetting, for the reason in the facts above.
- `setupDemo()`:
  1. `await LocalData.init(new SessionStorageBackend())`, first, because it decides which backend every read and write hits.
  2. Install the backends, before `loginState.init()` can fire a request.
  3. Branch on whether `LocalData.getUserConfig()` returns a config, the marker for "this tab already seeded the demo":
     - **Nothing stored (first load):** `MockScenarioService.setupScenario(FullAppScenario.MidTrainingWithHistory)` (it resets the maps itself), then `WorkoutHydrationService.persistDocumentMaps()`, then `userConfig.set(...)` so the demo user persists too.
     - **Config stored (reload):** `userConfig.hydrate()` and `WorkoutHydrationService.hydrateDocumentMaps()`, then rebuild the CTOs with `MockDataService.exerciseMapServiceMock.setDefaultExerciseCTOs(...)`, passing `exerciseCalibrationMapService.allDocs`, `exerciseMapService.allDocs`, and `equipmentTypeMapService.allDocs`. That method reads `sessionMapService` and `setMapService` directly to derive `bestSet` and `lastSession*`, so the rebuilt CTOs reflect sets logged during the demo, not just the seed.
  4. `loginState.init()`.
- Doc comments on the class and on `setupDemo` describe the session storage backing and the seed-or-resume split.

Known gap in the CTO rebuild: the builder produces one CTO per calibration, so an exercise a visitor creates during the demo (which gets a minimal CTO and no calibration document) loses its CTO after a reload.

`WorkoutAPIService.hydrate()` stays out of the demo path. A restored queue would only replay requests against a backend that answers `{}`, and an empty in-memory queue is what `getInitialDataIfNeeded` expects.

## Step 6: Enter, exit, and clear

Files: `src/util/LocalData/SessionData.ts`, `src/services/DemoMode.service.ts`, `src/routes/+layout.svelte`, `src/components/DemoModeCard/DemoModeCard.svelte`

- `SessionData` exposes `getDemoModeEnabled()`, `enableDemoMode()`, and `clearDemoData()`. `clearDemoData()` removes every `sessionStorage` key starting with `STORAGE_PREFIX`, covering the demo flag and every `LocalData` key in one pass, and leaves SvelteKit's `sveltekit:*` entries alone, which a blanket `sessionStorage.clear()` would not. `setDemoModeEnabled(enabled)` goes away, since `clearDemoData()` covers turning it off.
- `DemoModeService.enter()` calls `enableDemoMode()`. `exit()` calls `clearDemoData()` and then loads home, so the next demo in that tab starts from the scenario.
- `+layout.svelte`'s `?demo` branch calls `enableDemoMode()`. Nothing else in the layout changes.
- Doc comments on both files state that demo data lives in the tab's session storage and is dropped on exit.
- `DemoModeCard`'s description says reloading is safe, in one clause: "Nothing is saved. Reloading keeps your place, and the demo ends when you close the tab."

## Step 7: Tests

- `core-ts-api-lib`: the `setBackend` cases from Step 1.
- `src/util/LocalData/SessionStorageBackend.spec.ts`: as described in Step 3.
- `src/util/LocalData/SessionData.spec.ts`: cases for `enableDemoMode()` and for `clearDemoData()` covering both halves (prefixed keys removed, unprefixed keys kept).
- New `src/services/MockEnvSetupService/MockEnvSetup.service.spec.ts`: asserts `setupDemo()` leaves the seed in session storage, which is what Steps 4 and 5 exist for. The checks are that `LocalData.getUserConfig()` and `LocalData.getDocumentMap(sessionMap)` come back populated and that `exerciseMapService.exerciseCTOs` is non-empty. The folder already holds `MockEnvSetup.service.ts`.
- The resume branch is not unit-testable in one process: `LocalData.init` runs once and the module singletons survive, so there is no honest way to simulate a second page load. The manual pass below covers it.

## Validation

1. In `core-ts-api-lib`: `pnpm check`, `pnpm test`, `pnpm lint`.
2. In the app: `pnpm sub:core-ts-api-lib`, then `pnpm lint --fix`, `pnpm check`, `pnpm test`.
3. `pnpm build`, to confirm prerendering works with the new storage backend.
4. Manual pass in the browser:
   - Open the demo from the login card, log a set, open a session URL, reload. Data and route survive.
   - Watch the network tab throughout. No request reaches `api.antonneuhold.com` and no WebSocket opens.
   - Confirm in DevTools that `localStorage` gained nothing and `sessionStorage` holds the `v5-` keys.
   - Exit the demo. The login page returns and the `v5-` keys are gone from `sessionStorage`.
   - Open `/?demo` in a second tab and confirm it seeds its own independent demo.
   - Sign in normally and confirm real requests go out, which checks that `GCloudAPIService` is the default backend.
