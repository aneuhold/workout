# Google Play Store Submission Plan

Goal: get **MesoPro** (`com.tonyneuhold.mesopro`, currently `versionCode 1` / `versionName "1.0"`, `targetSdk 36`) live on the Google Play Store.

This is downstream of [`capacitor-android-plan.md`](./capacitor-android-plan.md). The Android shell, plugins, icons, and splash are all wired up. What's left is the Play Console submission itself: account, signed release build, store listing assets, legal/policy URLs, compliance forms, and the testing → production rollout.

> Capacitor's [official Play deployment page](https://capacitorjs.com/docs/android/deploying-to-google-play) is a thin pointer — it states that Capacitor apps are normal native Android apps and defers to Google's [launch checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist). There's no Capacitor-managed signing, bundling, or Play upload flow; everything below uses standard Gradle + Play Console.

> **Personal-account caveat:** Google requires new personal developer accounts to run a **closed test with at least 12 opt-in testers for 14+ continuous days** before they can request production access. Plan the calendar around this. ([Closed testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465))

---

## Step 1 — Google Play Console account

Skip if already enrolled.

1. Sign up at the [Play Console](https://play.google.com/console/signup) — **$25 one-time** registration fee.
2. Choose **personal** (vs organization) — personal triggers the 12-tester closed-test requirement above.
3. Complete **identity verification** (government ID + address). Can take a few days.
4. Set up a **payments profile** even for free apps (required for the listing).

Docs: [Create a Play Console account](https://support.google.com/googleplay/android-developer/answer/6112435)

---

## Step 2 — Pages that need to exist on the public web

Hosting will be a SvelteKit route outside the base layout (handled separately). This step just enumerates the pages the Play submission depends on.

| Page | Required? | Why |
|---|---|---|
| **Privacy Policy** | **Required** | Play will not let you submit without a publicly reachable URL. ([Play privacy policy requirements](https://support.google.com/googleplay/android-developer/answer/9859455)) Content must match Step 7's Data Safety answers exactly. Must cover: data collected (auth identifiers, workout/session documents, device/Sentry crash data), where it's stored (MongoDB Atlas via `gcloud-backend`, Sentry), third parties (Google Sign-In, Sentry), retention, deletion-request contact email, children's policy. |
| **Terms of Service** | Optional but recommended | Not required by Play. Light "use at your own risk, no warranty, account termination" boilerplate. Useful to link from in-app Settings. |
| **Marketing / landing page** | Optional | Not required by Play. Helpful to populate the listing's "Website" field with something other than a privacy policy, and gives somewhere to point a Play Store badge once live. Can be added post-launch. |

Verify each URL loads over HTTPS in incognito before pasting into the Play listing.

---

## Step 3 — Wire the existing upload keystore into Gradle

The upload keystore already exists at `~/.android/keystores/mesopro-upload.jks` (alias `mesopro`, password in password manager) — see [`android-signing-and-google-sign-in.md`](./android-signing-and-google-sign-in.md) for full context. What's left is wiring it into the Gradle build, since `android/app/build.gradle` currently has no `signingConfig` for `release` and `android/.gitignore` still has `*.keystore` commented out.

1. Add a `keystore.properties` file at `android/keystore.properties` (gitignored — never committed) with:
   ```
   storeFile=/Users/<you>/.android/keystores/mesopro-upload.jks
   storePassword=...
   keyAlias=mesopro
   keyPassword=...
   ```
2. Edit `android/app/build.gradle`:
   - Load `keystore.properties` at the top (guard against missing file so CI/other dev machines don't blow up on debug builds).
   - Add a `signingConfigs.release { ... }` block reading from those props.
   - Set `buildTypes.release.signingConfig = signingConfigs.release`.
   - Leave `minifyEnabled = false` for v1 (Capacitor + WebView apps gain little from R8, and shrinking can break reflection-using plugins). Revisit later if AAB size matters.
3. Edit `android/.gitignore` — uncomment the existing `#*.jks` and `#*.keystore` lines (already present at lines ~56–58), and add `keystore.properties`.
4. Confirm enrollment in **[Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)** at first AAB upload (Step 8). Google holds the real signing key; the local keystore is only the *upload* key (rotatable if lost). Then immediately copy the **App signing key SHA-1** from Play Console → App Integrity and register it as a new Android OAuth client per the existing signing doc — without this, Google Sign-In silently fails for every Play Store install.

Docs: [Sign your app](https://developer.android.com/studio/publish/app-signing#sign-apk), [Configure Gradle to sign your app](https://developer.android.com/studio/publish/app-signing#sign_release).

---

## Step 4 — Build the release AAB

Play requires Android App Bundle (`.aab`), not APK. ([AAB requirement](https://developer.android.com/guide/app-bundle))

1. Bump `versionCode` / `versionName` in `android/app/build.gradle` whenever you upload a new build (versionCode must strictly increase).
2. Run `pnpm build:android` (already wired: `pnpm build && pnpm cap sync android`).
3. From the `android/` dir: `./gradlew bundleRelease`.
4. Output: `android/app/build/outputs/bundle/release/app-release.aab`.
5. Smoke-test the release build by installing the universal APK Android Studio can extract from the bundle, or via `bundletool build-apks` + `install-apks`.

Add an npm script `release:android` in `package.json` that runs the build + bundle in one shot.

---

## Step 5 — Create the app in Play Console

1. Play Console → **Create app**. Name `MesoPro`, language English (US), type App, free.
2. Accept the Play developer policies and US export laws checkboxes.
3. Note the auto-assigned package association — must match `com.tonyneuhold.mesopro`.

---

## Step 6 — Prepare store-listing assets

Required image assets ([Play asset specs](https://support.google.com/googleplay/android-developer/answer/9866151)). Note: [`@capacitor/assets`](https://capacitorjs.com/docs/guides/splash-screens-and-icons) (already used via `android/capacitor-assets/`) only generates **in-app** launcher icons + splash screens from the source SVG. The 512×512 Play icon and 1024×500 feature graphic are Play-only deliverables and have to be composed separately.

| Asset | Spec | Source |
|---|---|---|
| App icon | 512×512 PNG, 32-bit, ≤1 MB | Render from `docs/officialAssets/logo-light-icon-circle-gradient-background.svg` |
| Feature graphic | 1024×500 PNG/JPG | Compose new — logo + tagline on brand background |
| Phone screenshots | 2–8, 16:9 or 9:16, min side 320 px, max 3840 px | Capture from emulator at 1080×1920 |
| 7" tablet screenshots | optional, 1–8 | Skip for v1 unless tablet-targeted |
| 10" tablet screenshots | optional, 1–8 | Skip for v1 |

Sub-steps:

1. Pick **5–6 screen flows** to screenshot: Sessions list, active session with set logging, mesocycle planner, exercise library, analytics, settings.
2. Capture from `pnpm dev:android` on a Pixel-class emulator (1080×1920). Optionally annotate with text overlays in Figma/Affinity.
3. Generate the 512 icon and 1024×500 feature graphic. Reuse existing brand colors from `src/globalStyles/global.css`.
4. Drop everything in `docs/play-store-assets/` (new folder) so it's versioned with the repo.

---

## Step 7 — Fill out the listing + compliance forms

In Play Console under **Main store listing** and **App content**:

1. **Main store listing** ([guide](https://support.google.com/googleplay/android-developer/answer/9859152)):
   - App name (≤30 chars): `MesoPro`
   - Short description (≤80 chars): one-liner about evidence-based hypertrophy training tracking.
   - Full description (≤4000 chars): features, audience, what it tracks (RSM/SFR/fatigue), no medical claims.
   - App icon, feature graphic, screenshots from Step 6.
   - Category: **Health & Fitness**.
   - Tags: pick 2–5 from Google's controlled list.
   - Contact details: support email (use `agneuhold@gmail.com` or a dedicated alias), website URL (Step 2 marketing page if you built one).
   - Privacy Policy URL (Step 2).
2. **App content** — work top to bottom, every item must be green:
   - **Privacy policy** — paste URL.
   - **App access** — if login is required, supply demo creds Google's reviewers can use. Critical or the review will be rejected.
   - **Ads** — declare none (assuming no ads).
   - **Content rating** — fill the [IARC questionnaire](https://support.google.com/googleplay/android-developer/answer/9859655); will end up rated Everyone.
   - **Target audience** — choose 18+ (no children's-app obligations).
   - **News app** — No.
   - **COVID-19 contact tracing** — No.
   - **Data safety** ([guide](https://support.google.com/googleplay/android-developer/answer/10787469)) — declare auth IDs, fitness/health data, app activity, crash logs (Sentry). Must be consistent with the privacy policy from Step 2.
   - **Government apps** — No.
   - **Financial features** — No.
   - **Health apps** — declare appropriately if Google flags it.
   - **Advertising ID** — declare none used (Capacitor by default doesn't request it; verify no plugin pulls in `play-services-ads-identifier`).
3. **Store settings** — country availability (start with worldwide or US-only; easy to expand), pricing (Free).

---

## Step 8 — Internal testing track (immediate)

Internal test = up to 100 testers, **no review delay**, builds usually live in minutes. ([Internal testing](https://support.google.com/googleplay/android-developer/answer/9303479))

1. Play Console → **Testing → Internal testing → Create new release**.
2. Upload the AAB from Step 4. Confirm Play App Signing enrollment on first upload.
3. Write release notes (≤500 chars per locale) — for v1 something like "Initial release."
4. Add yourself + a couple trusted email addresses to the testers list.
5. Roll out → copy the opt-in link → install on a real device → run the golden path: sign in, create mesocycle, log a session, kill app, reopen, verify state survived.

---

## Step 9 — Closed testing track (calendar gate for personal accounts)

Required before production for new personal accounts: **≥12 testers, opted in for ≥14 continuous days**. ([Requirement details](https://support.google.com/googleplay/android-developer/answer/14151465))

1. Recruit ≥12 testers (friends, gym contacts) — they need Google accounts and must accept the opt-in.
2. Play Console → **Testing → Closed testing → Create track**. Upload same or newer AAB.
3. Add the 12+ accounts to the tester list. Distribute the opt-in URL.
4. Track opt-ins via Play Console; chase anyone who hasn't joined within a few days.
5. Keep the test running uninterrupted for 14+ days. Push at least one patch release during this window to prove the update flow works.
6. Collect feedback — bug reports go via the closed-test feedback URL, crash reports via Play Console + Sentry.

---

## Step 10 — Production release

Once Step 9's clock has elapsed and Play Console shows the **"Apply for production access"** button as available:

1. Apply for production access. Google reviews — usually a few days.
2. Once approved: **Production → Create new release**, upload the latest AAB (bump `versionCode`).
3. Release notes for v1.0.
4. Choose a **staged rollout** (start at 20%, expand once Sentry shows no spike in crash-free-sessions).
5. Submit for review. First-time reviews can take **up to 7 days**; subsequent updates are usually <24 h.
6. Once live, grab the Play Store URL and add a Play Store badge to the marketing page (Step 2).

---

## Validation checkpoints

Before each upload:

- `pnpm lint --fix`, `pnpm check`, `pnpm test` all pass
- `pnpm build:android` clean
- `./gradlew bundleRelease` produces a signed `.aab`
- Install the release build on a physical device and run the golden path end-to-end (sign in → log a session → close → reopen → data persists)
- `versionCode` strictly increased since last upload

---

## Post-launch follow-ups

These are not gates on shipping v1 — flagged here so they don't get lost.

1. **CI for releases.** First release goes out manually via `./gradlew bundleRelease` + Play Console upload, deliberately, to learn where the friction actually is. Once the manual flow is understood, automate with **GitHub Actions** + the [Gradle Play Publisher](https://github.com/Triple-T/gradle-play-publisher) plugin (free, open source, handles AAB upload + listing updates). Avoid Ionic Appflow — paid-only (~$49/mo starting tier) and Ionic has discontinued it (existing-customer maintenance only through Dec 31 2027).
2. **Marketing landing page.** Optional for v1; nice to have for the listing's Website field and as a target for the Play Store badge after launch.
