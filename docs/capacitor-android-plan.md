# Capacitor Android Plan

Goal: get this SvelteKit app shippable to the Google Play Store as an Android app, wrapped by [Capacitor](https://capacitorjs.com/docs), with the same codebase still serving the web build.

Capacitor itself is already installed (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`); the Android shell exists. The remaining steps below are concrete changes to land in this repo to make the wrap shippable.

---

## Context: where you already are

The app is well-positioned because:

- `svelte.config.js` already uses [`@sveltejs/adapter-static`](https://svelte.dev/docs/kit/adapter-static) with `fallback: 'app.html'`. That's [SPA mode](https://svelte.dev/docs/kit/single-page-apps), which is exactly what Capacitor needs (it serves files from disk; there is no Node server).
- `static/manifest.json` and `static/icons/*.png` already exist (see [Web App Manifest spec](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest)).
- A `WakeLockService` already exists — phones are the primary target use case.

The notable mismatches to resolve:

- **System-feature access** should go through Capacitor plugins rather than fragile WebView shims. Covers Sentry native crashes, hardware back button, status bar / splash, persistent storage, wake locks, etc. (Step 3.)
- **Safe areas / viewport-fit**: not currently styled for a native chrome. (Step 4.)
- **Google Sign-In** currently uses Google's officially-rendered button via `google.accounts.id.renderButton`, which doesn't survive a Capacitor WebView reliably. Replace with a custom-branded button that drives GIS on web and the social-login plugin on native. (Step 5.)
- **One claim still worth verifying firsthand** — WebSocket cleartext rules — is at the bottom under "Verify yourself."

---

## Step 3 — Use Capacitor plugins for system features (instead of WebView shims)

**Why**: The general principle when wrapping a web app: any time you'd reach for a browser API that's flaky inside a WebView, swap to the equivalent Capacitor plugin. Plugins call the actual Android system API under the hood, so they survive process lifecycle events, get real OS-level capabilities, and don't depend on WebView vendor quirks. Capacitor's [plugin index](https://capacitorjs.com/docs/plugins) has a comprehensive list. Below are the ones this app specifically needs.

For each plugin, the standard pattern is to gate it on [`Capacitor.isNativePlatform()`](https://capacitorjs.com/docs/core-apis/web#isnativeplatform) so the web build stays untouched.

### Crash reporting — `@sentry/capacitor`

`@sentry/sveltekit` only catches JS errors. Native Android crashes (NDK / Java) need [`@sentry/capacitor`](https://docs.sentry.io/platforms/javascript/guides/capacitor/) installed alongside it. Sentry's [Capacitor guide](https://docs.sentry.io/platforms/javascript/guides/capacitor/) covers the sibling-init pattern (`SentryCapacitor.init({...}, SentrySvelte.init)`); there is no SvelteKit-specific Capacitor subpage. Update `src/hooks.client.ts` to branch on `isNativePlatform()`.

### Hardware back button — `@capacitor/app`

Android users expect the system back gesture to navigate the app, not exit it. Without handling, the app exits on first back press. Register an [`App.addListener('backButton', …)`](https://capacitorjs.com/docs/apis/app#addlistenerbackbutton-) in `+layout.svelte` (or a top-level service), call SvelteKit's [`history.back()` / `goto()`](https://svelte.dev/docs/kit/$app-navigation), and only call [`App.exitApp()`](https://capacitorjs.com/docs/apis/app#exitapp) when the history stack is empty. ([Material guidance on back navigation](https://m3.material.io/foundations/interaction/gestures#back).)

### Status bar — `@capacitor/status-bar`

Style the OS status bar (light/dark icons, color) to match the app theme. `mode-watcher` already tracks dark mode in the app — wire that into [`@capacitor/status-bar`](https://capacitorjs.com/docs/apis/status-bar) so the status bar follows.

### Splash screen — `@capacitor/splash-screen`

Controls the splash that's shown while the WebView boots. Use [`@capacitor/splash-screen`](https://capacitorjs.com/docs/apis/splash-screen) to show/hide it programmatically once the app is hydrated.

### Icon + splash asset generation — `@capacitor/assets`

Generate adaptive launcher icons and splash variants from a single source SVG with [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets). Source: `docs/officialAssets/logo-icon-circle.svg`. Extends or replaces the existing `generate:icons` script. ([Android adaptive icons reference](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive).)

### Persistent storage — `@capacitor/preferences`

`localStorage` survives app updates today, but Android can clear WebView storage under storage pressure. For data that must survive (auth tokens, user prefs), migrate to [`@capacitor/preferences`](https://capacitorjs.com/docs/apis/preferences). Audit `src/stores/local/` to find candidates.

### Wake lock — `@capacitor-community/keep-awake`

`src/services/WakeLockService.ts` uses the [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API). It works in modern Android WebViews but loses the lock on app background/foreground transitions. Add a Capacitor branch using [`@capacitor-community/keep-awake`](https://github.com/capacitor-community/keep-awake) for reliable behavior across long workout sessions.

### Haptics — `@capacitor/haptics` (optional)

`TimerService` likely uses `navigator.vibrate`, which works on Android. [`@capacitor/haptics`](https://capacitorjs.com/docs/apis/haptics) is the platform-blessed replacement if you want richer feedback (impact, notification, selection styles).

Docs:

- [Capacitor plugin index](https://capacitorjs.com/docs/plugins)
- [`Capacitor.isNativePlatform()`](https://capacitorjs.com/docs/core-apis/web#isnativeplatform)

---

## Step 4 — Style for native chrome (safe areas, viewport-fit)

**Why**: A bare WebView on Android draws under the status bar and the gesture nav bar, clipping your TopBar/NavBar. Status-bar styling itself is handled by the plugin in Step 3; this step is the CSS side.

- Add `viewport-fit=cover` to the meta viewport in `src/app.html` (current value: `width=device-width, initial-scale=1`).
- Audit `src/components/TopBar` / `NavBar` (or equivalent) for hardcoded `top: 0` / `bottom: 0`. Add `env(safe-area-inset-top|bottom)` padding via [`env()` CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env).

Docs:

- [`viewport-fit=cover` and safe areas (WebKit)](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [`env(safe-area-inset-*)` (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env)

---

## Step 5 — Custom Google Sign-In button + unified auth via `@capgo/capacitor-social-login`

**Why**: The current login flow renders Google's official button via [`google.accounts.id.renderButton`](https://developers.google.com/identity/gsi/web/reference/js-reference#google.accounts.id.renderButton) in `src/components/Login/Login.svelte` (the `<div bind:this={googleButtonRef}>` slot), driven by `src/services/GoogleGISService.ts`. Inside a Capacitor WebView the GIS popup is unreliable: Google may return `disallowed_useragent`, or the popup gets routed to a Custom Tab and the `window.opener` / `postMessage` callback never reaches the app.

The fix is to own the button visual and route the click through [`@capgo/capacitor-social-login`](https://github.com/Cap-go/capacitor-social-login). The plugin has a real web implementation (its `GoogleSocialLogin` provider runs an OAuth2 popup that returns the same `idToken` JWT) and native implementations on Android (Credential Manager) and iOS (Google Sign-In SDK). One library, one `signIn()` call, no platform branching in our service code.

The returned `idToken` feeds the existing `APIService.validateUser({ googleCredentialToken, ... })` call in `Login.svelte` unchanged. Backend wiring stays as-is.

### Custom icons folder

Establish a new pattern: `src/components/ui/icons/` holds Svelte components that render a single inline SVG each. First entry is `GoogleLogo.svelte` (the official "G" mark used by the sign-in button). Includes a Storybook story that lists every icon in the folder.

### Custom button component

Build `src/components/GoogleSignInButton/GoogleSignInButton.svelte` styled per [Google's brand guidelines for Sign-In with Google](https://developers.google.com/identity/branding-guidelines):

- Uses `<GoogleLogo />` from the new icons folder.
- "Continue with Google" wording — the app has no separate sign-up flow, so logging in is signing up.
- Light + dark variants via the existing `mode-watcher` store.
- Delegates the click to a callback prop. The button doesn't know what auth runs.

### Auth service

Replace `src/services/GoogleGISService.ts` with a thin service whose public surface is `initialize()`, `signIn()` (returns an ID token), and `logout()`. All three call directly into `SocialLogin.{initialize,login,logout}` from `@capgo/capacitor-social-login`. No GIS script loading, no `renderButton`, no platform branching — the plugin handles all of that.

`SocialLogin.initialize({ google: { webClientId: GOOGLE_CLIENT_ID, mode: 'online' } })` is called once at app start (in `+layout.svelte`).

### Login.svelte / TopBar.svelte changes

- Drop the `googleButtonRef` div and the `onMount` that calls `renderButton`.
- Render `<GoogleSignInButton onclick={handleGoogleSignIn} />`.
- `handleGoogleSignIn` calls the new service's `signIn()` and feeds the returned `idToken` into the existing `handleGoogleCallback` body.
- Replace the `disableAutoSelect()` call in TopBar's logout handler with the new service's `logout()`.

### Trade-off

You lose Google's auto-handling of locale, exact pixel rendering, and any future GIS button updates. In exchange, the button is identical across web and native, you stop fighting WebView popup quirks, and there's a single code path through a maintained Capacitor plugin.

Docs:

- [Google branding guidelines for Sign-In](https://developers.google.com/identity/branding-guidelines)
- [`@capgo/capacitor-social-login`](https://github.com/Cap-go/capacitor-social-login)
- [Capgo social-login Google setup](https://capgo.app/docs/plugins/social-login/google/general/)
- [Verifying Google ID tokens server-side](https://developers.google.com/identity/sign-in/web/backend-auth)

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

## Verify on-device

### socket.io / WebSocket cleartext + origin

Android 9+ blocks cleartext (`ws://`) traffic, so `socket.io-client` must use `wss://`. The backend is already TLS in prod, so this should be a non-issue. Confirm once the app is running on-device that the WebSocket actually connects.

If you do hit it, see:

- [Android cleartext traffic (`usesCleartextTraffic`)](https://developer.android.com/privacy-and-security/security-config#CleartextTrafficPermitted)

---

## Open questions

1. **iOS later?** This plan is Android-only. If iOS is on the horizon, several decisions (asset generation, scheme handling, social-login iOS client setup) get easier if made with both in mind from the start.
2. **CI**: do you want Play Store uploads automated (Fastlane / Gradle Play Publisher), or is a manual upload from Android Studio fine for v1?
