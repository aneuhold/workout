# Deployment Automation Plan

Make the Android release ride along with the existing web deploy, driven by a single version bump.

## End state

The entire release process:

```
pnpm bump patch      # or minor / major
```

Commit, open a PR, merge. CI deploys the web build to Netlify and uploads the signed AAB to the Play track named in Step 3, both from the same commit. Promoting to production stays a manual click in Play Console.

Merges that do not change the version deploy the web build only, exactly as today.

## Why this is simpler

| | Today | After |
|---|---|---|
| Version fields to maintain by hand | 3 (`package.json` `version`, `build.gradle` `versionName`, `build.gradle` `versionCode`) | 1 (`package.json` `version`) |
| Commands to run for a release | 1 script + ~6 manual Play Console steps | 1 command |
| Machines that can cut a release | 1 (the one holding the keystore) | any (CI) |
| Ordering rules you must remember | Upload to Play before merging, or `UpdateCheckService` nags users toward a release that does not exist | none |
| Source of the shipped AAB | your working tree | the merged commit |

## Step 1 — Derive both Android version fields from `package.json`

**`android/app/build.gradle`**

Replace the literal `versionCode 13` / `versionName "1.1.7"` with values parsed from the root `package.json` using `groovy.json.JsonSlurper` on `rootProject.file("../package.json")`.

- `versionName` is the semver string verbatim.
- `versionCode` is `major * 10000 + minor * 100 + patch`.

`1.1.7` yields `10107`, above the highest code uploaded to any track (`13`, confirmed against the Play API). Add a one-line comment recording the invariant: `minor` and `patch` must stay below 100.

The existing `signingConfigs.release` block and its `keystorePropertiesFile.exists()` guard need no changes. That guard already covers a developer with a local keystore, a developer without one, and CI writing the file at build time.

## Step 2 — The bump command

**`package.json`**

Add one script:

```
"bump": "pnpm version --no-git-tag-version"
```

Used as `pnpm bump patch`, `pnpm bump minor`, `pnpm bump major`. It writes `package.json` and nothing else: no git commit, no tag, no dirty-tree check.

## Step 3 — Play upload script

**New file: `scripts/uploadAndroidRelease.ts`**

Follows the existing `scripts/<verb><Noun>.ts` convention (`emitVersionInfo.ts`, `replaceDevVersion.ts`). Runs the [Google Play Developer API](https://developers.google.com/android-publisher/edits) edit transaction:

1. `edits.insert` to open a draft edit.
2. `edits.bundles.upload` with a read stream of `android/app/build/outputs/bundle/release/app-release.aab`. The response carries the `versionCode`, so the script never recomputes the formula from Step 1.
3. `edits.tracks.update` assigning that version code to the target track with `status: 'completed'`, using the first line of the triggering commit message as the release name and notes.
4. `edits.commit`.

Reads `appId` from `capacitor.config.ts` rather than hardcoding the package name. Authorizes with a bare `new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/androidpublisher'] })` from `google-auth-library`, which picks up the Application Default Credentials that `google-github-actions/auth` writes in Step 4.

New dependencies: `@googleapis/androidpublisher` and `google-auth-library`. Use the scoped package, not the 212 MB umbrella `googleapis`.

### Target track

```ts
/**
 * Play track identifiers accepted by `edits.tracks.update`. These four are the
 * tracks this app has. Additional closed testing tracks created in Play Console
 * carry custom names and would be added here.
 *
 * @see https://developers.google.com/android-publisher/tracks
 */
enum PlayTrack {
  InternalTesting = 'internal',
  ClosedTesting = 'alpha',
  OpenTesting = 'beta',
  Production = 'production'
}
```

Set the module-level track constant to `PlayTrack.InternalTesting`. That is where the current release lives and where the app's only published build sits. Switch to `PlayTrack.ClosedTesting` once the 12-tester cohort is assembled and the 14-day clock starts, so the closed track keeps receiving builds without a Play Console visit.

## Step 4 — Extend the main-branch workflow

**`.github/workflows/main-branch.yml`**

Extend the existing `deploy` job rather than adding a second one. A second job would need artifact plumbing or a second `pnpm build`, and a second build would upload duplicate Sentry source maps for the same release.

Changes to the job:

- `actions/checkout@v6` gains `fetch-depth: 2` so the previous commit's `package.json` is readable.
- Add `permissions: { contents: read, id-token: write }` for the Workload Identity Federation OIDC token.
- Raise `timeout-minutes` from 10 to 25 to cover the Gradle build.
- After the existing Netlify step, add a step with `id: version` that compares `version` in `package.json` at `HEAD` against `HEAD~1` and writes `changed` to `$GITHUB_OUTPUT`.
- Add the release steps, each guarded by `if: steps.version.outputs.changed == 'true'`:
  - `actions/setup-java@v5` with Temurin 21, matching the `JavaVersion.VERSION_21` in `android/app/capacitor.build.gradle`. The `ubuntu-latest` image already ships Android SDK platform 36.
  - Decode `ANDROID_KEYSTORE_BASE64` into `android/mesopro-upload.jks` and write `android/keystore.properties` with the four properties the existing Gradle block reads. Both paths are already covered by `android/.gitignore`.
  - `pnpm cap sync android`, reusing the `build/` output the Netlify step already produced.
  - `cd android && ./gradlew bundleRelease`.
  - `google-github-actions/auth@v2` with `workload_identity_provider: projects/926119935605/locations/global/workloadIdentityPools/github-pool/providers/github-provider` and `service_account: mesopro-play-publisher@backend-463900.iam.gserviceaccount.com`. Omit `token_format` so the action writes an ADC file rather than a fixed-scope token, letting the script request the `androidpublisher` scope itself.
  - `pnpm tsx scripts/uploadAndroidRelease.ts`, with only the commit message passed through the environment.

`SENTRY_UPLOAD_SOURCE_MAPS` is already `true` on this job, so the Android app ships against the same source maps as the web build.

No `workflow_dispatch` and no duplicate-upload guard. Re-running from the GitHub UI covers manual reruns, and Play rejects a duplicate version code with an explicit message.

## Step 5 — External setup

### Done

Verified against `backend-463900` on 2026-08-19:

- Service account `mesopro-play-publisher@backend-463900.iam.gserviceaccount.com`, display name "MesoPro Play Publisher", unique ID `113986326306293497417`. Holds **zero** project roles.
- Its only IAM binding is `roles/iam.workloadIdentityUser` for `principalSet://iam.googleapis.com/projects/926119935605/locations/global/workloadIdentityPools/github-pool/attribute.repository/aneuhold/workout`.
- The `github-pool` WIF provider is shared with `gcloud-backend` and needed no change; its attribute condition is `assertion.repository_owner == 'aneuhold'`.
- `androidpublisher.googleapis.com` is enabled on `backend-463900`.
- No JSON key exists for the account.
- `mesopro-play-publisher` is invited in Play Console with release permissions for `com.tonyneuhold.mesopro`.
- Local developer auth works. `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/androidpublisher,https://www.googleapis.com/auth/cloud-platform` succeeds, confirming gcloud's built-in OAuth client will issue the `androidpublisher` scope, so no `--client-id-file` workaround is needed.
- Live track list, read from `edits.tracks.list`: `internal`, `alpha`, `beta`, `production`. Only `internal` holds a release, version code `13` ("1.1.7"). `alpha` exists but is empty.

### Remaining

1. Add four repository secrets alongside the existing `NETLIFY_*`, `PERF_TEST_*`, and `SENTRY_AUTH_TOKEN`:
   - `ANDROID_KEYSTORE_BASE64` (`base64 -i ~/.android/keystores/mesopro-upload.jks`)
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`

## Step 6 — Fold the release configuration into the Android reference doc

Rename `docs/android-signing-and-google-sign-in.md` to **`docs/android-signing-and-publishing.md`**. Update the two inbound links: `README.md:54` and `docs/play-store-submission-plan.md:29`.

Merge into the existing structure rather than appending:

- Rewrite the opening scope line and the TL;DR so the doc answers both questions it now serves: which key signs a given build, and which identity publishes it.
- Extend the distribution-path table with a row for the CI release, so all four paths sit together: local debug key, local upload key, CI upload key, and Google's Play App Signing key.
- New **Publishing identity** section, recording everything under Step 5's "Done" list plus:
  - Why the account is separate from `github-actions-deployer`: that account holds `run.admin`, `compute.instanceAdmin.v1`, `artifactregistry.admin`, `compute.osLogin`, and `iam.serviceAccountUser` on `backend-463900`, none of which publishing needs.
  - Why the name is app-scoped: the impersonation grant is per repository, so a shared `play-publisher` would let every bound repo release every app it can reach. Matches the `<app>-<purpose>` convention already documented for `mesopro-upload.jks`.
  - That Play Console grants release permission, which is why the account carries no GCP project roles.
- New **GitHub repository secrets** subsection: the four `ANDROID_*` values, where each comes from, and that Play App Signing holding the real signing key is what makes storing the upload key acceptable.
- New **Publishing locally** subsection. Developers authenticate as themselves, not as `mesopro-play-publisher`, which stays CI's identity alone. Record the `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/androidpublisher,https://www.googleapis.com/auth/cloud-platform` command and that `scripts/uploadAndroidRelease.ts` then runs unchanged because it reads ADC. Note that `--scopes` is required, since the ADC defaults cover `cloud-platform` but not `androidpublisher`, and that `gcloud auth login` does not satisfy this because it writes to a different credential store.
- Extend **Adding a new developer** with a Play Console invite step for anyone who needs to publish, alongside the existing debug-key OAuth client registration. Each person gets their own Play Console access so uploads stay attributable and offboarding is a single removal there.

Once this lands, this plan document is superseded and can be deleted.

## What gets removed or corrected

**`scripts/publishAndroidBuild.ts`** — deleted, all 244 lines.

**`package.json`**

- `publish:android:build` and `publish:android:validate` scripts.
- The `"scriptsComments": {}` key.

**`android/app/build.gradle`**

- The `versionCode 12` and `versionName "1.1.6"` literals.

**`README.md`**

- The Publishing bullet collapses to one line: `pnpm bump` plus merge.
- Line 71's pointer to `scriptsComments` is corrected to name `scripts/dev-android.ts`, which holds the `DEVICES` list.

**`vite.config.ts`**

- The comment on lines 18 to 21 names `pnpm publish:android:build` as a source-map upload path. The main-branch workflow becomes the only uploader.

**`docs/play-store-submission-plan.md`**

Kept, because Step 4's asset uploads and Step 7's 12-tester gate are still open. Seven passages need correcting:

- Line 3, the header, still says `versionCode 1 / versionName "1.0"`. Point it at `package.json` `version` instead.
- Line 5 links to `capacitor-android-plan.md`, which no longer exists.
- Step 3, lines 54 to 56: the manual `versionCode` bump and local build steps become `pnpm bump patch` plus a merge.
- Step 3, line 60: "Add an npm script `release:android`" is obsolete. Delete.
- Step 8, line 145: "upload the latest AAB (bump `versionCode`)" becomes promoting the CI-uploaded build in Play Console.
- Validation checkpoints, lines 158 to 161: the manual `build:android`, `bundleRelease`, and "versionCode strictly increased" checks are CI's job. The device smoke test survives.
- Post-launch follow-ups, line 169: replace the Gradle Play Publisher recommendation with a pointer to `docs/android-signing-and-publishing.md`.

Step 7's "push at least one patch release during this window" becomes `pnpm bump patch` plus a merge.

## Validation

Per the repo's completion checklist: `pnpm lint --fix`, `pnpm check`, `pnpm test`.

Android-specific, in order:

1. `pnpm bump patch`, then confirm `cd android && ./gradlew :app:properties | grep -i version` reports the matching `versionName` and derived `versionCode`. Revert the bump afterward.
2. `pnpm build:android` still succeeds locally with no `keystore.properties` changes.
3. First real merge with a version bump: watch the workflow, then confirm the build appears on the target track with the expected version code.

If `bundleRelease` reports a missing SDK component despite platform 36 being preinstalled, add `android-actions/setup-android@v3` ahead of the Gradle step.
