# Google Play Policy Compliance Plan

Goal: bring **MesoPro** (`com.tonyneuhold.mesopro`) into compliance with the [Play Developer Content Policy](https://play.google/developer-content-policy/) before submission. Six work items, each scoped to a small, isolated change. Order is roughly by risk — account deletion and `AD_ID` are hard rejection risks; the rest are best-practice or data-minimization.

---

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
