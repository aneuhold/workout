# Google Play Policy Compliance Plan

Goal: bring **MesoPro** (`com.tonyneuhold.mesopro`) into compliance with the [Play Developer Content Policy](https://play.google/developer-content-policy/) before submission. Six work items, each scoped to a small, isolated change. Order is roughly by risk — account deletion and `AD_ID` are hard rejection risks; the rest are best-practice or data-minimization.

---

## Step 1 — Account deletion (in-app + public web URL)

Required by the [User Data: account deletion policy](https://support.google.com/googleplay/android-developer/answer/13316080). Apps that allow account creation must offer a discoverable in-app deletion path **and** a publicly reachable URL where users can request deletion without re-installing.

### 1a. Backend deletion endpoint (`gcloud-backend`)

1. Add a `deleteAccount` action in `src/routes/auth/Auth.controller.ts` (`@Post('deleteAccount')`, authenticated, no body) and a corresponding method in `Auth.service.ts`.
2. Service flow: load `userId` from `UserContext`, then `Promise.all` repository deletes for that user across `WorkoutSession`, `WorkoutSessionExercise`, `WorkoutSet`, `WorkoutMesocycle`, `WorkoutMicrocycle`, `WorkoutExercise`, `WorkoutExerciseCalibration`, `WorkoutEquipmentType`, `WorkoutMuscleGroup`. Reuse the per-user `userId` filter pattern already used in `WorkoutDeletion.service.ts`.
3. Then `RefreshTokenRepository.deleteAllForUser(userId)` (add this helper next to the existing `deleteRefreshToken`) and finally `UserRepository.delete(userId)`.
4. Add a `WorkoutDeletion.service.spec.ts`-style test asserting all collections for that user are empty afterwards. Follow [`~/Development/GithubRepos/ts-libs/.github/copilot-instructions.md`](../../ts-libs/.github/copilot-instructions.md) when touching shared types, and run the backend test suite.

### 1b. Wire it through `core-ts-api-lib`

1. Add `AuthDeleteAccount.ts` to `src/types/` mirroring the empty-input/empty-output shape of the logout types.
2. Add `authDeleteAccount()` to `GCloudAPIService.ts` and a `static async deleteAccount()` on `APIService.ts` that delegates to it. Wait 6 seconds after publishing locally so the workout app picks it up.

### 1c. In-app deletion flow

1. Add a `handleDeleteAccount` method in `src/pages/SettingsPage/SettingsPage.svelte` that:
   - Opens `SingletonDeleteDialog` (already imported in `+layout.svelte`) with copy explaining the deletion is permanent.
   - On confirm: `await APIService.deleteAccount()`, then run the same teardown as `TopBar.svelte:46` `handleLogout` (`userConfig.clear()`, `WorkoutAPIService.reset()`, `LocalData.clearWorkoutMaps()`, `loginState.set(LoginState.LoggedOut)`, `googleAuthService.logout()`).
   - Surface errors via the existing snackbar pattern.
2. Add a destructive `Button` row at the bottom of `SettingsPage.svelte` labeled "Delete account" — match the existing `flex flex-col gap-4 p-4` layout, no new CSS.

### 1d. Public web deletion URL

Play needs a URL that works *without* the app installed. The existing layout (`src/routes/+layout.svelte`) gates everything on `LoginState`, so add a route group that opts out of the gate.

1. Create `src/routes/(public)/+layout.svelte` — minimal pass-through that renders only `<ModeWatcher />` and `{@render children?.()}`. This isolates the public pages from the auth-gated `+layout.svelte` via SvelteKit [layout groups](https://svelte.dev/docs/kit/advanced-routing#Advanced-layouts-group).
2. Create `src/routes/(public)/account/delete/+page.svelte`. It explains the consequences, asks for Google sign-in (reuse `Login.svelte` or call `googleAuthService.signIn()` directly), and on success calls `APIService.deleteAccount()`. Same teardown as 1c on success.
3. Create `src/routes/(public)/privacy/+page.svelte` and `src/routes/(public)/terms/+page.svelte` — static markdown rendered to HTML, matching the Data Safety form (Sentry, MongoDB Atlas via `gcloud-backend`, Google Sign-In identifiers; retention; deletion contact).
4. Add `export const prerender = true;` to each public page's `+page.ts` so they're crawlable static HTML under the existing static adapter.
5. Paste the live HTTPS URLs into Play Console: App Content → Privacy policy, Account deletion, plus the Settings → Account section. Verify each loads in a fresh incognito window before submission.

---

## Step 2 — Remove the `AD_ID` permission

The merged release manifest at `android/app/build/intermediates/merged_manifest/release/processReleaseMainManifest/AndroidManifest.xml` currently contains `com.google.android.gms.permission.AD_ID` and the four `ACCESS_ADSERVICES_*` permissions, contributed transitively by Google Play services. Shipping `AD_ID` while declaring "no advertising ID used" on Data Safety triggers a Play Console warning. See [Advertising ID policy](https://support.google.com/googleplay/android-developer/answer/6048248) and the [`AD_ID` declaration guidance](https://support.google.com/googleplay/android-developer/answer/6048248#zippy=%2Cwhich-apps-need-to-declare-the-permission).

1. Edit `android/app/src/main/AndroidManifest.xml`:
   - Add `xmlns:tools="http://schemas.android.com/tools"` to the `<manifest>` element.
   - Inside `<manifest>` (outside `<application>`), add `<uses-permission android:name="com.google.android.gms.permission.AD_ID" tools:node="remove" />`.
   - Add the same `tools:node="remove"` line for each of `ACCESS_ADSERVICES_ATTRIBUTION`, `ACCESS_ADSERVICES_AD_ID`, `ACCESS_ADSERVICES_CUSTOM_AUDIENCE`, `ACCESS_ADSERVICES_TOPICS` (we don't use Privacy Sandbox APIs).
2. Run `pnpm build:android && cd android && ./gradlew bundleRelease` and re-grep the merged manifest at `android/app/build/intermediates/merged_manifest/release/.../AndroidManifest.xml` to confirm none of the five permissions remain.
3. On Play Console Data Safety, declare "Advertising ID — not collected".

Reference: [`tools:node` manifest merger reference](https://developer.android.com/build/manage-manifests#node_markers).

---

## Step 3 — Eliminate the Facebook SDK

`@capgo/capacitor-social-login` pulls in the Facebook SDK transitively even when only Google sign-in is configured. The merged manifest shows `com.facebook.CurrentAccessTokenExpirationBroadcastReceiver` and `AuthenticationTokenManager$CurrentAuthenticationTokenChangedBroadcastReceiver`. The Facebook SDK can auto-init and contact Facebook on first launch, which would force a third-party-data-sharing disclosure on Data Safety.

Two options — pick one:

- **Option A (preferred): swap the plugin.** Replace `@capgo/capacitor-social-login` with `@capacitor-community/google-auth` (Google-only, no Facebook). Update `src/services/GoogleAuthService.ts` to use its API surface. Re-run the existing Google Sign-In flow on a release build to confirm parity.
- **Option B: exclude Facebook from `@capgo/capacitor-social-login`.** Add a Gradle exclude rule for `com.facebook.android:facebook-android-sdk` in `android/app/build.gradle` `dependencies { ... }` block. Risk: a future plugin update may add a hard dependency.

After whichever path:

1. Re-bundle and re-grep the merged manifest for `com.facebook` — should be empty.
2. Run a release-mode `adb logcat | grep -i facebook` for 30s after first launch to confirm no Facebook init traffic.

---

## Step 4 — Sentry PII scrubbing

Default `@sentry/capacitor` and `@sentry/sveltekit` capture user IPs, full URLs (with query strings), and any user object passed via `Sentry.setUser`. Either disclose this on Data Safety or scrub.

1. In `src/hooks.client.ts`, add to `sentryOptions`:
   - `sendDefaultPii: false` ([docs](https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii)).
   - A `beforeSend(event)` that deletes `event.user?.email`, `event.user?.username`, `event.user?.ip_address`, and strips `?...` from `event.request?.url` and any `breadcrumbs[].data.url`.
   - A `beforeBreadcrumb(breadcrumb)` that does the same URL-stripping for `navigation`/`fetch`/`xhr` breadcrumbs.
2. Audit `src/stores/session/loginState.ts` and any `Sentry.setUser` callers — pass only an opaque `id` (Mongo ObjectId), never email/username.
3. Verify on a real release build by triggering an error and inspecting the resulting Sentry event.

---

## Step 5 — Settings page links to legal pages + delete account

`src/pages/SettingsPage/SettingsPage.svelte` currently only has a theme toggle. Add three rows below the Appearance row, in this order, all using the existing `flex items-center justify-between` pattern (no new CSS):

1. **Privacy Policy** — anchor opening the Step 1d privacy URL in a new tab.
2. **Terms of Service** — anchor to the terms URL.
3. **Delete account** — destructive button wired to `handleDeleteAccount` from Step 1c.

Use `IconExternalLink`, `IconFileText`, and `IconTrash` from `@tabler/icons-svelte` to match the icon usage in `TopBar.svelte`. No new components needed.

---

## Step 6 — Trim unused biometric permissions

`USE_BIOMETRIC` and `USE_FINGERPRINT` appear in the merged manifest, contributed by Credential Manager via the social-login plugin. Capacitor's Google Sign-In via Credential Manager doesn't actually invoke biometric APIs at runtime — these are only needed if you call passkey/biometric flows.

1. Add `<uses-permission android:name="android.permission.USE_BIOMETRIC" tools:node="remove" />` and the same for `USE_FINGERPRINT` to `android/app/src/main/AndroidManifest.xml`.
2. Re-bundle and run the full Google Sign-In golden path on a release build (cold install on a physical device, sign in, sign out, sign in again). If sign-in works, the removal is safe and can stay. If it breaks, revert these two lines only.

If Step 3 swaps the plugin, this step may already be resolved — verify the merged manifest before adding the removes.

---

## Validation

Before each AAB upload, run:

- `pnpm lint --fix`, `pnpm check`, `pnpm test` (workout app)
- Backend test suite for the `Auth` and `Workout` modules (Step 1a)
- `pnpm build:android && cd android && ./gradlew bundleRelease`
- Grep the merged release manifest for `AD_ID`, `ACCESS_ADSERVICES`, `com.facebook`, `USE_BIOMETRIC`, `USE_FINGERPRINT` — all should be absent (or expected).
- Cold-install the release AAB on a physical device and run: sign in → log a session → open Settings → tap each legal link → tap Delete account → confirm → re-sign-in produces a fresh empty account.
- Open the public `/privacy`, `/terms`, `/account/delete` URLs in incognito on desktop; confirm they load without auth.

---

## Open questions / trade-offs

- **Delete-account scope.** Plan above hard-deletes everything. If we later need to retain anything for fraud/abuse (e.g. soft-deleted user with a `deletedAt` timestamp for 30 days), declare that retention window explicitly in the privacy policy. The current plan is the simpler path and is what most personal-account apps do.
- **Plugin swap (Step 3 Option A) vs. Gradle exclude (Option B).** Option A is cleaner long-term but is a real refactor of `GoogleAuthService.ts` and needs a full sign-in regression test. Option B is one line of Gradle and reversible. Recommend A unless time-pressured.
- **Public pages and the static adapter.** The app uses `@sveltejs/adapter-static`; `prerender = true` on the public pages produces static HTML at deploy time. Confirm the host (Netlify per `hooks.client.ts`) serves them at predictable URLs before pasting into Play Console.
