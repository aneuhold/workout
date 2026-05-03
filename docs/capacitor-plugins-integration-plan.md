# Capacitor Plugins Integration Plan

Goal: wire up `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/app`, `@sentry/capacitor`, and `@capacitor-community/keep-awake` so the Android wrap behaves correctly, while the web build keeps working unchanged. Implements Step 3 of `docs/capacitor-android-plan.md`.

## Guiding principles

- Every plugin call is gated on `Capacitor.isNativePlatform()` so the web build is byte-for-byte identical to today.
- Reuse the existing service-singleton pattern (matches `WakeLockService`, `GoogleAuthService`, `TimerService`). No abstraction layer for "platforms" beyond the per-call native check — Capacitor itself is the abstraction.
- Native lifecycle wiring (splash hide, status bar sync, back button) lives in **one** new service so `+layout.svelte` only grows by a single line. Wake lock stays in its existing service. Sentry native init stays in `hooks.client.ts` because Sentry must initialize at module load time.

## Step 1 — Install dependencies

Add to `devDependencies` via pnpm:

- `@capacitor/splash-screen`
- `@capacitor/status-bar`
- `@capacitor/app`
- `@sentry/capacitor`
- `@capacitor-community/keep-awake`

Run `pnpm cap sync android` afterwards so the Android project picks up the new plugins.

## Step 2 — Configure splash screen + status bar in `capacitor.config.ts`

Edit `capacitor.config.ts`:

- Add a `plugins` block.
- `SplashScreen`: `launchAutoHide: false` (we hide it from JS once the app is mounted), and a `backgroundColor` that matches the app's background CSS variable so there's no flash.
- `StatusBar`: `overlaysWebView: false` so layout calculations stay simple, plus an initial `backgroundColor` matching the dark/light defaults.

No code changes needed beyond this file.

## Step 3 — Native Sentry init in `src/hooks.client.ts`

Edit `src/hooks.client.ts`:

- Import `Capacitor` from `@capacitor/core` and `* as SentryCapacitor` from `@sentry/capacitor` (named import for `init`, per the SDK).
- When `initalizeSentry` is true and `Capacitor.isNativePlatform()` is true, call `SentryCapacitor.init({ dsn, ... }, SentrySvelte.init)` (sibling-init pattern from Sentry's Capacitor guide). The native init forwards options to the existing SvelteKit init so we keep one config block.
- Otherwise keep the existing `Sentry.init({...})` call exactly as-is.
- `handleError` export stays unchanged.

Trade-off: the DSN and options are duplicated only by the function reference, not the config — both inits read the same options object.

## Step 4 — Native wake lock in `src/services/WakeLockService.ts`

Edit `src/services/WakeLockService.ts` (no rename, no new file):

- Import `Capacitor` from `@capacitor/core` and `KeepAwake` from `@capacitor-community/keep-awake`.
- Add a private `isNative` getter that returns `Capacitor.isNativePlatform()`.
- In `acquireLock()`: if native, `await KeepAwake.keepAwake()` and return. Otherwise keep the current Wake Lock API path.
- In `release()`: if native, `await KeepAwake.allowSleep()`. Otherwise keep the current path.
- The existing `visibilitychange` re-acquire branch is web-only behavior; keep it but skip on native (the OS plugin handles foreground/background itself).
- No public API change — `TimerService` keeps calling `wakeLockService.request()` / `release()` exactly as it does today.

## Step 5 — New `NativePlatformService.svelte.ts`

Create `src/services/NativePlatformService.svelte.ts`. Single responsibility: bootstrap the native-only UI lifecycle plugins. No-op on web. This is also the intended home for any future phone-only behaviors that have no web equivalent (iOS included) — when iOS lands, plugin calls live here behind the same `isNativePlatform()` gate, with platform-specific branching (`Capacitor.getPlatform()`) only when the iOS and Android calls genuinely differ.

Public surface:

- `init(): void` — called once from `+layout.svelte` onMount.

Inside `init()`, gated on `Capacitor.isNativePlatform()`:

1. **Splash screen** — `await SplashScreen.hide()`. Called at the end of `init()` so the splash stays visible until the layout has finished its onMount work.
2. **Status bar** — set up a `$effect.root(() => $effect(() => { ... }))` (same pattern as `TimerService.svelte.ts:73`) that reads `mode.current` from `mode-watcher` and calls `StatusBar.setStyle({ style: Style.Dark | Style.Light })` plus `StatusBar.setBackgroundColor(...)` whenever the resolved mode changes. The effect runs once at registration so the status bar is correct on launch.
3. **Hardware back button** — `App.addListener('backButton', ({ canGoBack }) => { ... })`. If `canGoBack` (Capacitor reports browser history depth), call `window.history.back()`; otherwise `await App.exitApp()`. No need to retain the listener handle — the layout is the root and lives for the process lifetime.

Punted: integrating the back button with open shadcn-svelte dialogs (so back closes the topmost overlay before navigating). Revisit if it surfaces as a real complaint.

## Step 6 — Wire the new service into `src/routes/+layout.svelte`

Edit `src/routes/+layout.svelte`:

- Import `nativePlatformService from '$services/NativePlatformService'`.
- In the existing `onMount(...)` (line 45), call `nativePlatformService.init()` after `WorkoutHydrationService.hydrateDocumentMaps()` and `timerService.init()`. One added line.

No other layout changes.

## Step 7 — Validation

Run, in order, and fix anything that surfaces:

1. `pnpm lint --fix`
2. `pnpm check`
3. `pnpm test`
4. `pnpm build`
5. `pnpm cap sync android`
6. Manual smoke on emulator via `pnpm preview:android`:
   - Splash screen disappears once content is interactive.
   - Status bar icons flip when toggling dark/light in Settings.
   - Hardware back button navigates back through routes, then exits the app once history is empty.
   - Start a timer, lock the screen briefly, return — wake lock still active, no `WakeLockSentinel released` errors in logcat.
   - Force a JS error and confirm it lands in Sentry tagged with the Capacitor SDK.

## Files touched

- `package.json` (deps)
- `capacitor.config.ts` (plugins config)
- `src/hooks.client.ts` (native Sentry init)
- `src/services/WakeLockService.ts` (KeepAwake branch)
- `src/services/NativePlatformService.svelte.ts` (new)
- `src/routes/+layout.svelte` (one-line wire-up)

Six files, one of them new. No new abstractions, no platform shim layer, no feature flags.
