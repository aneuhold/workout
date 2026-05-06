# Capacitor Android Plan

Goal: get this SvelteKit app shippable to the Google Play Store as an Android app, wrapped by [Capacitor](https://capacitorjs.com/docs), with the same codebase still serving the web build.

The Android shell is in place and the system-feature plugins (Sentry native crashes, hardware back button, status bar, splash screen, icon/splash asset generation, wake lock) are wired up and gated on [`Capacitor.isNativePlatform()`](https://capacitorjs.com/docs/core-apis/web#isnativeplatform). What's documented below is what still needs to land before the wrap is shippable.

---

## Step 3 (remaining) — Persistent storage and optional haptics

For each plugin, the standard pattern is to gate it on [`Capacitor.isNativePlatform()`](https://capacitorjs.com/docs/core-apis/web#isnativeplatform) so the web build stays untouched.

### Persistent storage — preferences + SQLite

`localStorage` survives app updates today, but Android can clear WebView storage under storage pressure, and the workout document maps in `src/util/LocalData/LocalData.ts` already exceed iOS's 4 MB `UserDefaults` cap. The fix is a two-tier split: [`@capacitor/preferences`](https://capacitorjs.com/docs/apis/preferences) for small auth/config values, [`@capacitor-community/sqlite`](https://github.com/capacitor-community/sqlite) (no encryption) for the document maps. See [`capacitor-persistent-storage-plan.md`](./capacitor-persistent-storage-plan.md) for the full design.

### Haptics — `@capacitor/haptics` (optional)

`TimerService` likely uses `navigator.vibrate`, which works on Android. [`@capacitor/haptics`](https://capacitorjs.com/docs/apis/haptics) is the platform-blessed replacement if you want richer feedback (impact, notification, selection styles).

Docs:

- [Capacitor plugin index](https://capacitorjs.com/docs/plugins)
- [`Capacitor.isNativePlatform()`](https://capacitorjs.com/docs/core-apis/web#isnativeplatform)

---

## Validation checkpoints

After each step, the repo's required checks must pass before considering it done:

- `pnpm lint --fix`
- `pnpm check`
- `pnpm test`
- `pnpm build` produces a clean `build/` directory (Capacitor will refuse to sync otherwise)
- `npx cap sync android` completes with zero errors
- `npx cap run android` launches the app on an emulator with the back button working and at least one workout session round-trip succeeding

---

## Open questions

1. **iOS later?** This plan is Android-only. If iOS is on the horizon, several decisions (asset generation, scheme handling, social-login iOS client setup) get easier if made with both in mind from the start.
2. **CI**: do you want Play Store uploads automated (Fastlane / Gradle Play Publisher), or is a manual upload from Android Studio fine for v1?
