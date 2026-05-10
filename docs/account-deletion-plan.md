# Account Deletion — Implementation Plan

Scope: the in-app portion of Step 1 of `docs/play-policy-compliance-plan.md`. Adds an authenticated `deleteAccount` backend endpoint, exposes it through `core-ts-api-lib`, and wires an in-app destructive flow into `SettingsPage`. The publicly-reachable web URL, privacy policy, and terms pages are tracked separately and are out of scope here.

The order below matches the dependency direction: shared API library → backend → workout app. `gcloud-backend/src/routes/auth/Auth.controller.ts:4-7` imports its input/output types from `@aneuhold/core-ts-api-lib`, so the shared types must be published before the backend can reference them.

---

## Key discovery (simplifies the original plan)

`UserRepository.setupSubscribers()` (`ts-libs/packages/be-ts-db-lib/src/repositories/common/UserRepository.ts:27-38`) already subscribes the User repo's delete events to every per-user workout and dashboard repository. The chain also propagates Mesocycle → Microcycle → Session → SessionExercise → Set, and Exercise → ExerciseCalibration. Refresh tokens are stored inline on the User document (`user.auth.refreshTokenHashes`).

**Implication:** the backend delete-account flow is just `UserRepository.getRepo().delete(userId)` — no per-collection `Promise.all`, no separate refresh-token cleanup, no shared-lib changes. Spec coverage of the cascade already lives in the workout repo specs; the new endpoint test only needs to assert the User document is gone (and trust the cascade).

---

## Step 1 — Add `deleteAccount` types & wiring to `core-ts-api-lib`

This must land first: the backend `Auth.controller.ts` imports its `AuthDeleteAccountInput` (and any output type) from `@aneuhold/core-ts-api-lib`, mirroring how `AuthRefreshTokenInput` is consumed today (`gcloud-backend/src/routes/auth/Auth.controller.ts:4-7`).

### 1.1 New types file

File: `ts-libs/packages/core-ts-api-lib/src/types/AuthDeleteAccount.ts` (new)

- Export `AuthDeleteAccountInput` (empty interface, doc-commented) and `AuthDeleteAccountOutput = void`. Keep the file minimal — the existing logout flow proves a void payload is supported, but we use a dedicated type so future fields (e.g. confirmation token) are easy.

### 1.2 Add the call to `GCloudAPIService.ts`

File: `ts-libs/packages/core-ts-api-lib/src/services/GCloudAPIService/GCloudAPIService.ts`

- Add `static async authDeleteAccount(): Promise<APIResponse<undefined>>`. Use `this.call(...)` (so a 401 triggers refresh) with an empty object input — this is an authenticated endpoint.
- Insert the method directly under `authLogout()` (lines 108-116).
- Import `AuthDeleteAccountInput` from the new types file.

### 1.3 Add the facade method on `APIService.ts`

File: `ts-libs/packages/core-ts-api-lib/src/services/APIService/APIService.ts`

- Add `static async deleteAccount(): Promise<APIResponse<undefined>>` that returns `GCloudAPIService.authDeleteAccount()`. Place it directly under `logout()` (lines 39-41).

### 1.4 Export the types from `browser.ts`

File: `ts-libs/packages/core-ts-api-lib/src/browser.ts`

- Add the two new type imports/exports next to the existing auth types (lines 9-10, 41-44).

### 1.5 Validation

- Build + test the package per `~/Development/GithubRepos/ts-libs/.github/copilot-instructions.md`.
- After publish, **wait 6 seconds** before depending on the new exports in `gcloud-backend` (Step 2) and the workout app (Step 3).

---

## Step 2 — Backend `deleteAccount` endpoint (`gcloud-backend`)

Depends on Step 1 — the controller needs to import `AuthDeleteAccountInput` from the freshly-published `@aneuhold/core-ts-api-lib`.

### 2.1 Add the route on `Auth.controller.ts`

File: `src/routes/auth/Auth.controller.ts`

- Add `AuthDeleteAccountInput` to the type-only import from `@aneuhold/core-ts-api-lib` (lines 2-8).
- Add a `@Post('deleteAccount')` action below the existing `logout()` (around line 183). Authenticated (no `@Public()`), no `@Body()`. Signature mirrors `logout()`:
  ```
  async deleteAccount(@CurrentUserContext() userContext: UserContext): Promise<APIResponse<void>>
  ```
- Inject a new `AuthService.deleteAccount(userContext.userId)` call (added in 2.2). Wrap in try/catch returning `APIResponse<void>` with `success: true/false` and any error message pushed to `errors`, matching the `validateUser` error-handling style (lines 112-116).

### 2.2 Add `deleteAccount` to `Auth.service.ts`

File: `src/routes/auth/Auth.service.ts`

- Add `async deleteAccount(userId: UUID): Promise<void>` that calls `await UserRepository.getRepo().delete(userId)`. Nothing else — the cascade handles every dependent collection and refresh tokens are inline on the User doc.
- Import `UUID` from `crypto`.

### 2.3 Spec for `Auth.service.ts`

File: `src/routes/auth/Auth.service.spec.ts` (new — there is no existing `Auth.service.spec.ts`; model after `WorkoutDeletion.service.spec.ts`).

- Insert a temporary user via `workoutTestUtil.insertTestUser('authDelete')` plus one mesocycle and one muscle group attached to that user.
- Call `service.deleteAccount(testUser._id)`.
- Assert: `UserRepository.getRepo().get({ _id: testUser._id })` returns `null`, and the previously inserted mesocycle and muscle group are also gone (sanity-checks the cascade is wired).
- `afterAll` closes the DB connection (matches the existing pattern at `WorkoutDeletion.service.spec.ts:46-49`). Skip the `workoutTestUtil.deleteTestUser` call since the test deletes the user itself.

### 2.4 Validation

- `pnpm test` in `gcloud-backend` (or whichever script runs the Vitest suite there).
- `pnpm lint --fix` and the equivalent type-check script.

---

## Step 3 — In-app delete flow on Settings page

### 3.1 Introduce `AuthService` and consolidate scattered auth logic

File: `src/services/AuthService.ts` (new)

Right now auth orchestration is spread across three files:
- `src/components/Login/Login.svelte:61-125` — `handleGoogleIdToken`, `handleSubmit`, and `handleLoginResult` (≈65 lines mixing UI state with API calls, token storage, `userConfig.set`, `WorkoutAPIService.getInitialDataForLogin`, and `loginState` transitions).
- `src/components/TopBar/TopBar.svelte:46-58` — the five-line logout teardown.
- The new delete-account flow needs to repeat that teardown.

Pull the orchestration into a singleton service so every entry point (login, logout, delete) goes through one place. Match the **`GoogleAuthService` pattern** (`src/services/GoogleAuthService.ts:19-85`): a `class` with instance methods and `export default new AuthService();`. Per `CLAUDE.md` the service-singleton convention is the standard, and `googleAuthService` is the closest sibling — keep them stylistically identical.

Public surface (all `async` instance methods):

- `loginWithGoogle(idToken: string): Promise<APIResponse<AuthValidateUserOutput>>`
  - Sets `loginState = ProcessingCredentials`.
  - Calls `APIService.validateUser({ googleCredentialToken: idToken, project: ProjectName.Workout })`.
  - Delegates the response to a private `applyLoginResult(response)` helper.
  - Returns the raw response so the caller can render its own error UI (matches what `Login.svelte` does today with `invalidCredentials`).

- `loginWithPassword(userName: string, password: string): Promise<APIResponse<AuthValidateUserOutput>>`
  - Persists the username to `LocalData.setUsername` and writes to the `password` store (the existing `Login.svelte:79-80` behavior).
  - Sets `loginState = ProcessingCredentials`.
  - Calls `APIService.validateUser({ userName, password, project: ProjectName.Workout })`.
  - Calls `applyLoginResult(response)` and returns the response.

- `logout(): Promise<void>`
  - `await APIService.logout();` (best-effort — the rest must run even if the network call fails).
  - Calls private `clearLocalSession()`.

- `deleteAccount(): Promise<APIResponse<undefined>>`
  - `const result = await APIService.deleteAccount();`
  - If `result.success`, calls `clearLocalSession()`.
  - Returns the response so the SettingsPage handler can render an error if it failed.

Private helpers:

- `applyLoginResult(response)` — mirrors the current `Login.svelte:97-125`: on success, store tokens via `APIService.setAccessToken`/`setRefreshTokenString`, write `userConfig.set(...)`, kick off `WorkoutAPIService.getInitialDataForLogin()`, set `loginState = LoggedIn`. On failure, set `loginState = LoggedOut`. (Returning the response lets the UI decide whether to surface "invalid credentials" — the service stays UI-agnostic.)
- `clearLocalSession()` — the existing teardown sequence: `userConfig.clear()`, `WorkoutAPIService.reset()`, `await LocalData.clearWorkoutMaps()`, `loginState.set(LoginState.LoggedOut)`, `await googleAuthService.logout()`.

Wrap try/catch around the awaited `APIService.logout()` and `googleAuthService.logout()` calls so a network or plugin error never blocks local teardown — the user must end up at the login screen even if cleanup partially fails.

### 3.2 Refactor existing call sites onto `AuthService`

- `src/components/TopBar/TopBar.svelte:46-58` — replace `handleLogout` body with `await authService.logout();`. Drop the now-unused imports (`APIService`, `googleAuthService`, `WorkoutAPIService`, `LocalData`, `userConfig`, `loginState`, `LoginState`).
- `src/components/Login/Login.svelte:61-125` — replace `handleGoogleIdToken` and `handleSubmit` with one-liners that delegate to `authService.loginWithGoogle(idToken)` / `authService.loginWithPassword(typedUserName, typedPassword)`. Use the returned `APIResponse` to set `invalidCredentials` (and to log the unexpected-shape branch). Remove `handleLoginResult` and the now-redundant imports.

These refactors are small (the moved code already exists), and they're prerequisites for the new delete flow to share the same teardown path.

### 3.3 Out of scope for this service (call out explicitly)

- `src/stores/session/loginState.ts:43-45` (the `APIService.setOnTokensRefreshed` callback) and `loginState.init()` (token rehydration on app boot) stay where they are. Both run at module-init / `onMount` time and aren't user actions — folding them into `AuthService` would tangle the service's lifecycle with app boot. Revisit if a future task needs to mock the boot path.
- The `loginState` Svelte store itself stays in `src/stores/session/`. `AuthService` *uses* it (the same way `GoogleAuthService` uses no stores at all, while `WorkoutAPIService` reads `userConfig`).

### 3.4 Add the destructive row + handler to `SettingsPage.svelte`

File: `src/pages/SettingsPage/SettingsPage.svelte`

Current file has only the appearance `<Select>` row. Extend it without introducing new singletons or CSS — use an inline `AlertDialog` (the same shadcn primitive `SingletonDeleteDialog` uses) so the destructive UX matches the rest of the app.

- Imports: `Button`, `AlertDialog` + its sub-components from `$ui/AlertDialog/...`, `IconTrash` from `@tabler/icons-svelte`, `authService` from `$services/AuthService`, and `createLogger` from `$util/logging/logger`.
- Add `confirmOpen = $state(false)`, `processing = $state(false)`, `errorMessage = $state<string | null>(null)`.
- `async function handleDeleteAccount()`:
  1. `processing = true; errorMessage = null;`
  2. `const result = await authService.deleteAccount();`
  3. If `!result.success`, log via the page-scoped logger, set `errorMessage = result.errors[0] ?? 'Failed to delete account.'`, `processing = false`, and return. The inline `<p class="text-destructive text-sm">` (pattern from `Login.svelte:166`) renders the message below the button.
  4. On success, `authService` has already cleared local state and flipped `loginState`; the gate in `+layout.svelte:91` switches to `<Login />` automatically.
- In the markup, add a second row inside the existing `<div class="flex flex-col gap-4 p-4">` container:
  ```
  <div class="flex items-center justify-between">
    <Label>Delete account</Label>
    <Button variant="destructive" onclick={() => (confirmOpen = true)} disabled={processing}>
      <IconTrash size={16} /> Delete account
    </Button>
  </div>
  ```
  Plus an `AlertDialog bind:open={confirmOpen}` with a `Delete account?` title and copy explaining: *"This permanently deletes your MesoPro account and every workout, mesocycle, exercise, and calibration tied to it. This action cannot be undone."*. Cancel + destructive Delete buttons mirror `SingletonDeleteDialog.svelte:90-98`.

No new files in `src/components`. No new singleton in `+layout.svelte`.

### 3.5 Storybook coverage

A story already exists at `src/pages/SettingsPage/SB/SettingsPage.stories.svelte` and a pass-through wrapper at `src/pages/SettingsPage/SB/SBSettingsPageExample.svelte`. Both stay shape-compatible — `SBSettingsPageExample` just renders `<SettingsPage />`, so the new Delete-account row appears automatically in the existing `Default` story.

Required additions:

- Add a second story variant in `SettingsPage.stories.svelte` named `DeleteAccountDialog` that demonstrates the `AlertDialog` open state. The cleanest seam is a separate wrapper (per the repo's `SB<ComponentName>Example.svelte` convention noted in `CLAUDE.md`):
  - New file: `src/pages/SettingsPage/SB/SBSettingsPageDeleteDialogExample.svelte`. It mounts `<SettingsPage />` and uses an `onMount` hook with `tick()` to programmatically click the destructive Delete-account button (e.g. `document.querySelector<HTMLButtonElement>('button[data-testid="delete-account-button"]')?.click()`). To support that, give the destructive button in `SettingsPage.svelte` a `data-testid="delete-account-button"` attribute (matches the pattern used at `Login.svelte:174`).
  - Add `<Story name="DeleteAccountDialog" component={SBSettingsPageDeleteDialogExample} />` (the per-story `component` override is supported by `defineMeta`).

- Extend `testUtils/TestSetup.ts:setupGlobalMocks` to also `spyOnFn(APIService, 'deleteAccount')` and `spyOnFn(APIService, 'logout')`, both returning `Promise.resolve({ success: true, errors: [], data: undefined })`. `.storybook/preview.ts:11` already invokes `setupGlobalMocks(spyOn)` for every story, so this single addition covers any interaction-test flow that ends up clicking the dialog's confirm button — no per-wrapper monkey-patching of `authService` needed. Vitest tests pick up the same stubs via `testUtils/vitest-setup.ts:8`.

Verify both stories render in `pnpm storybook` before considering the step complete.

### 3.6 Validation

- `pnpm lint --fix && pnpm check && pnpm test`
- Manual: sign in → Settings → Delete account → confirm → app returns to login screen → re-sign-in produces a fresh empty account.
- Regression smoke (because Step 3.2 refactored `Login.svelte` and `TopBar.svelte`): Google sign-in, password sign-in, and the existing dropdown Logout still work end-to-end.

---

## Validation summary (run before considering the work complete)

- `core-ts-api-lib`: build + test per the ts-libs instructions; wait 6s after publishing.
- `gcloud-backend`: `pnpm lint --fix`, type-check, `pnpm test` for the Auth and Workout suites.
- workout app: `pnpm lint --fix && pnpm check && pnpm test && pnpm build`.
- `pnpm storybook`: `Pages/SettingsPage/Default` and `Pages/SettingsPage/DeleteAccountDialog` both render.
- Manual smoke test the in-app delete flow on a real device (cold install of the next release AAB): sign in → log a session → Settings → Delete account → confirm → app returns to login screen → re-sign-in produces a fresh empty account.

---

## Out of scope (tracked separately)

- **Public web account-deletion URL.** Removed from this plan. Authenticated-only deletion via the in-app Settings flow is the entire user-facing surface here. A separate effort will decide how to satisfy the Play policy's public-URL requirement (e.g. a static landing page that points users to the in-app flow plus a manual-deletion contact email).
- **Privacy policy and terms pages.** Tracked separately.

---

## Open questions / trade-offs

- **`AuthService` scope (Step 3.1 / 3.2).** This plan moves login + logout + deleteAccount into the new singleton and refactors `Login.svelte` and `TopBar.svelte` to call it. The token-refresh callback and `loginState.init()` boot path stay in `src/stores/session/loginState.ts` because they're module-init / `onMount` work, not user actions. If a future task wants to mock the boot path or unit-test rehydration, those would be the next things to fold in.
- **Hard delete vs. soft delete with retention window.** This plan hard-deletes everything (matches the parent plan's recommendation). If retention for fraud/abuse is ever needed, switch `UserRepository.delete` to a `deletedAt` write and add a scheduled purge — but then declare the retention window in the privacy policy.
