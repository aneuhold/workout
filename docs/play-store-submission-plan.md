# Google Play Store Submission Plan

Goal: get **MesoPro** (`com.tonyneuhold.mesopro`, currently `versionCode 1` / `versionName "1.0"`, `targetSdk 36`) live on the Google Play Store.

This is downstream of [`capacitor-android-plan.md`](./capacitor-android-plan.md). The Android shell, plugins, icons, and splash are all wired up. The Play Console account exists, the app has been created in Play Console, and Android Developer Verification (ADI) is done — both the pre-bound debug key and the upload key (`~/.android/keystores/mesopro-upload.jks`) are verified for `com.tonyneuhold.mesopro`. The upload keystore is wired into Gradle, a signed release AAB has been built, and the Play Console compliance forms (App content) are filled out. What's left is the public-web pages, store listing assets, the main store listing copy, and the testing → production rollout.

> Capacitor's [official Play deployment page](https://capacitorjs.com/docs/android/deploying-to-google-play) is a thin pointer — it states that Capacitor apps are normal native Android apps and defers to Google's [launch checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist). There's no Capacitor-managed signing, bundling, or Play upload flow; everything below uses standard Gradle + Play Console.

> **Personal-account caveat:** Google requires new personal developer accounts to run a **closed test with at least 12 opt-in testers for 14+ continuous days** before they can request production access. Plan the calendar around this. ([Closed testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465))

---

## Step 1 — Pages that need to exist on the public web

Hosting will be a SvelteKit route outside the base layout (handled separately). This step just enumerates the pages the Play submission depends on.

| Page | Required? | Why |
|---|---|---|
| **Privacy Policy** | **Required** | Play will not let you submit without a publicly reachable URL. ([Play privacy policy requirements](https://support.google.com/googleplay/android-developer/answer/9859455)) Content must match the Data Safety answers already filled in under App content. Must cover: data collected (auth identifiers, workout/session documents, device/Sentry crash data), where it's stored (MongoDB Atlas via `gcloud-backend`, Sentry), third parties (Google Sign-In, Sentry), retention, deletion-request contact email, children's policy. |
| **Terms of Service** | Optional but recommended | Not required by Play. Light "use at your own risk, no warranty, account termination" boilerplate. Useful to link from in-app Settings. |
| **Marketing / landing page** | Optional | Not required by Play. Helpful to populate the listing's "Website" field with something other than a privacy policy, and gives somewhere to point a Play Store badge once live. Can be added post-launch. |

Verify each URL loads over HTTPS in incognito before pasting into the Play listing.

---

## Step 2 — Prepare store-listing assets

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

## Step 3 — Fill out the main store listing

In Play Console under **Main store listing** ([guide](https://support.google.com/googleplay/android-developer/answer/9859152)):

1. App name (≤30 chars): `MesoPro`
2. Short description (≤80 chars): one-liner about evidence-based hypertrophy training tracking.
3. Full description (≤4000 chars): features, audience, what it tracks (RSM/SFR/fatigue), no medical claims.
4. App icon, feature graphic, screenshots from Step 2.
5. Category: **Health & Fitness**.
6. Tags: pick 2–5 from Google's controlled list.
7. Contact details: support email (use `agneuhold@gmail.com` or a dedicated alias), website URL (Step 1 marketing page if you built one).
8. Privacy Policy URL (Step 1).

Then under **Store settings** — country availability (start with worldwide or US-only; easy to expand), pricing (Free).

---

## Step 4 — Internal testing track (immediate)

Internal test = up to 100 testers, **no review delay**, builds usually live in minutes. ([Internal testing](https://support.google.com/googleplay/android-developer/answer/9303479))

1. Play Console → **Testing → Internal testing → Create new release**.
2. Upload the signed release AAB (`android/app/build/outputs/bundle/release/app-release.aab`). Confirm Play App Signing enrollment on first upload.
3. Write release notes (≤500 chars per locale) — for v1 something like "Initial release."
4. Add yourself + a couple trusted email addresses to the testers list.
5. Roll out → copy the opt-in link → install on a real device → run the golden path: sign in, create mesocycle, log a session, kill app, reopen, verify state survived.

---

## Step 5 — Closed testing track (calendar gate for personal accounts)

Required before production for new personal accounts: **≥12 testers, opted in for ≥14 continuous days**. ([Requirement details](https://support.google.com/googleplay/android-developer/answer/14151465))

1. Recruit ≥12 testers (friends, gym contacts) — they need Google accounts and must accept the opt-in.
2. Play Console → **Testing → Closed testing → Create track**. Upload same or newer AAB.
3. Add the 12+ accounts to the tester list. Distribute the opt-in URL.
4. Track opt-ins via Play Console; chase anyone who hasn't joined within a few days.
5. Keep the test running uninterrupted for 14+ days. Push at least one patch release during this window to prove the update flow works.
6. Collect feedback — bug reports go via the closed-test feedback URL, crash reports via Play Console + Sentry.

---

## Step 6 — Production release

Once Step 5's clock has elapsed and Play Console shows the **"Apply for production access"** button as available:

1. Apply for production access. Google reviews — usually a few days.
2. Once approved: **Production → Create new release**, upload the latest AAB (bump `versionCode`).
3. Release notes for v1.0.
4. Choose a **staged rollout** (start at 20%, expand once Sentry shows no spike in crash-free-sessions).
5. Submit for review. First-time reviews can take **up to 7 days**; subsequent updates are usually <24 h.
6. Once live, grab the Play Store URL and add a Play Store badge to the marketing page (Step 1).

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
