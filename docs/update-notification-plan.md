# Update Notification Plan

Show a dialog when a newer version of the app is deployed. On web, prompt the user to reload. On Android (Capacitor), prompt them to update from the Play Store.

The app emits a `version.json` into the build output and fetches it (with `{ cache: 'no-store' }`) whenever `WorkoutAPIService.getInitialData()` runs — the same trigger already used for all data refreshes (app visibility changes, login). On mismatch, a dialog opens.

---

## Implementation Steps

### 1. Unified build script — `scripts/emitVersionInfo.ts`

Replace both `scripts/emitStorageVersion.ts` (writes `build/.storage-version`) and the planned `emitVersionJson.ts` with a single script that writes `build/version.json`:

```json
{
  "appVersion": "1.0.2",
  "storageVersion": "v5-"
}
```

`appVersion` comes from `package.json`. `storageVersion` comes from `STORAGE_PREFIX` (imported from `src/util/LocalData/storagePrefix.ts`), exactly as `emitStorageVersion.ts` does today.

Update the `build` script in `package.json` — replace `emitStorageVersion.ts` with `emitVersionInfo.ts` and remove the planned `emitVersionJson.ts`:
```
"build": "vite build && tsx scripts/replaceDevVersion.ts && tsx scripts/emitVersionInfo.ts"
```

Delete `scripts/emitStorageVersion.ts`.

---

### 2. Backwards-compatible perf consumer — `testUtils/perfTestUtils.ts`

Update `detectStoragePrefix()` to prefer `build/version.json` but fall back to `build/.storage-version`:

```typescript
detectStoragePrefix(): string {
  const versionJsonPath = resolve('build/version.json');
  if (existsSync(versionJsonPath)) {
    const data = JSON.parse(readFileSync(versionJsonPath, 'utf8'));
    if (data.storageVersion) return data.storageVersion;
  }
  return readFileSync(resolve('build/.storage-version'), 'utf8').trim();
}
```

Add `existsSync` to the existing `fs` imports.

---

### 3. `src/services/UpdateCheckService.ts`

New module-level singleton (plain `.ts`, no runes needed) that exports:

- `updateAvailable` — a `writable<boolean>(false)` Svelte store.
- `checkForUpdate()` — async function that:
  - Skips if `CURRENT_VERSION === '#DEV.VERSION#'` (dev mode guard; the placeholder is only replaced during `pnpm build`).
  - Throttles to at most once every 5 minutes via a module-level `lastCheckedAt` timestamp.
  - Fetches `https://mesopro.tonyneuhold.com/version.json` with `{ cache: 'no-store' }` (same URL on both web and Android since the production host is fixed).
  - Swallows fetch errors silently.
  - Sets `updateAvailable` to `true` if the returned `appVersion` differs from `CURRENT_VERSION`.

Where `CURRENT_VERSION = '#DEV.VERSION#'` is a module-level constant replaced at build time by `replaceDevVersion.ts`.

---

### 4. Call `checkForUpdate()` from `WorkoutAPIService.getInitialData()`

In `src/services/WorkoutAPIService.ts`, import `checkForUpdate` from `UpdateCheckService` and call `void checkForUpdate()` at the top of `getInitialData()`. This covers all trigger paths for logged-in users: visibility-change refreshes (`getInitialDataIfNeeded`), login (`getInitialDataForLogin`), and any direct calls.

---

### 5. Call `checkForUpdate()` from `Login.svelte`'s `onMount`

The singleton dialog is only mounted inside the logged-in block of the `(app)` layout, so it isn't present when the login screen is shown. To cover the logged-out case, add `void checkForUpdate()` to the existing `onMount` in `src/components/Login/Login.svelte`.

If the check resolves before the user logs in and `updateAvailable` becomes `true`, the singleton's `$effect` will see it as already `true` on mount and open the dialog immediately after login.

---

### 6. Singleton dialog — `src/components/singletons/dialogs/SingletonUpdateNotification/SingletonUpdateNotification.svelte`

Follow the same pattern as `SingletonDeleteDialog.svelte`.

**Instance script (`<script lang="ts">`):**
- Import `updateAvailable` from `UpdateCheckService`.
- `let open = $state(false)`.
- `$effect`: when `$updateAvailable` becomes `true`, set `open = true`. Dismissal sets `open = false` without resetting `updateAvailable` (the update is still pending).

**Template:**
- `AlertDialog` bound to `open`.
- Branch on `Capacitor.isNativePlatform()`:
  - **Web:** "A new version of MesoPro is available. Reload to get the latest update." — action button calls `window.location.reload()`.
  - **Android:** "A new version of MesoPro is available on the Play Store." — action button calls `window.open('https://play.google.com/store/apps/details?id=com.tonyneuhold.mesopro')`.
- Both paths include a "Not now" `AlertDialogCancel` button.

---

### 7. Mount in the app layout — `src/routes/(app)/+layout.svelte`

Import and render `<SingletonUpdateNotification />` alongside the other singleton dialogs (after `<SingletonRescheduleMesocycleDialog />`).

---

### 8. Mount in the Storybook decorator — `src/components/singletons/SBAllSingletonsDecorator.svelte`

Import and render `<SingletonUpdateNotification />` in the same position as the app layout.

---

## Validation

```sh
pnpm lint --fix
pnpm check
pnpm test
pnpm build   # verify build/version.json contains both appVersion and storageVersion
```
