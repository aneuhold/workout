# Deployment Automation Plan

Make the Android release ride along with the existing web deploy, driven by a single version bump.

## End state

The entire release process:

```
pnpm bump
```

Pick patch, minor, or major at the prompt. Commit, open a PR, merge. CI deploys the web build to Netlify and uploads the signed AAB to the Play track named in Step 2, both from the same commit. Promoting to production stays a manual click in Play Console.

Merges that do not change the version deploy the web build only, exactly as today.

## Why this is simpler

|                                  | Today                                                                                                  | After                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Bumping and publishing           | one command, so you cannot do either alone                                                             | `pnpm bump` at authoring time, upload on merge |
| Commands to run for a release    | 1 script + ~6 manual Play Console steps                                                                | `pnpm bump`, then merge                        |
| Machines that can cut a release  | 1 (the one holding the keystore)                                                                       | any (CI)                                       |
| Ordering rules you must remember | Upload to Play before merging, or `UpdateCheckService` nags users toward a release that does not exist | none                                           |
| Source of the shipped AAB        | your working tree                                                                                      | the merged commit                              |

## Step 1 — Bump command

**New file: `scripts/bumpRelease.ts`**

The entry point behind `pnpm bump`. It resolves the bump kind once through an `@inquirer/prompts` `select` offering patch, minor, and major with the resulting version name shown against each, then hands that answer to each release-preparation step in turn. Writing the version fields is the first such step. Keep every step a named function over the resolved bump kind and the current version, so the list is what grows rather than the function walking it.

Carries over the version handling from `scripts/publishAndroidBuild.ts`, which is deleted: `readAppVersion` and its `package.json` / `build.gradle` drift check, `writeAppVersion`, `bumpSemver`, and `matchOrThrow`. Its Play Console links, `SENTRY_UPLOAD_SOURCE_MAPS` flag, and shell command runner do not come along.

The version step keeps its current behaviour exactly: `versionName` takes the chosen semver bump, `versionCode` takes the local value plus 1. Nothing consults Play, so `pnpm bump` needs no credentials and no network.

**`package.json`**

```
"bump": "tsx scripts/bumpRelease.ts"
```

`versionCode` and `versionName` stay literals in `android/app/build.gradle`, with `pnpm bump` as their only writer. Nothing parses `package.json` at build time.

## Step 2 — Release scripts

Three new files under `scripts/`, following the existing `<verb><Noun>.ts` convention (`emitVersionInfo.ts`, `replaceDevVersion.ts`). Everything the release does lives here, so `main-branch.yml`, `pull-request.yml`, and a developer's terminal run the same code and Step 3 stays a list of steps.

### `scripts/bundleAndroidRelease.ts`

Turns an existing web build into the signed AAB.

1. Materialize the keystore when `ANDROID_KEYSTORE_BASE64` is present: decode it to `android/mesopro-upload.jks`, then write `android/keystore.properties` with that path, `mesopro` as `keyAlias`, and `ANDROID_KEYSTORE_PASSWORD` as both `storePassword` and `keyPassword`. Both file paths are already covered by `android/.gitignore`. The password must accompany the keystore; one without the other throws rather than quietly producing an unsigned bundle. With neither present a developer's own `keystore.properties` is left alone, which the `keystorePropertiesFile.exists()` guard in `build.gradle` already covers.
2. `pnpm cap sync android`.
3. `./gradlew bundleRelease` in `android/`.

### `scripts/uploadAndroidRelease.ts`

Takes that AAB and runs the [Google Play Developer API](https://developers.google.com/android-publisher/edits) edit transaction:

1. `edits.insert` to open a draft edit.
2. `edits.bundles.upload` with a read stream of `android/app/build/outputs/bundle/release/app-release.aab`. The response reports the `versionCode` read from the bundle.
3. `edits.tracks.update` assigning that version code to the target track with `status: 'completed'`, using the first line of the triggering commit message as the release name and notes.
4. `edits.commit`.

Reads `appId` from `capacitor.config.ts` rather than hardcoding the package name. Authorizes with a bare `new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/androidpublisher'] })` from `google-auth-library`, which picks up Application Default Credentials: written by `google-github-actions/auth` in CI per Step 3, and by `gcloud auth application-default login` locally per Step 5.

New dependencies: `@googleapis/androidpublisher` and `google-auth-library`. Use the scoped package, not the 212 MB umbrella `googleapis`.

### `scripts/emitVersionChanged.ts`

Answers the one question both workflows gate on. Takes a base git ref, compares its `package.json` `version` against the working tree's, and writes `changed` to `$GITHUB_OUTPUT`, falling back to stdout when that variable is absent so it can be run by hand. Shallow-fetches the ref when it is not already local, so neither workflow carries its own `git fetch` line. `main-branch.yml` passes `HEAD~1`, `pull-request.yml` passes `origin/main`.

### `package.json`

```
"bundle:android": "tsx scripts/bundleAndroidRelease.ts"
"release:android": "pnpm build && pnpm bundle:android && tsx scripts/uploadAndroidRelease.ts"
```

`release:android` is the local one-command path. It calls `pnpm build` rather than `pnpm build:android` because the Capacitor sync belongs to `bundle:android` now; `build:android` stays as it is for `preview:android`.

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

## Step 3 — Workflows

Both workflows gate the same way: `id: version` running `scripts/emitVersionChanged.ts`, then `if: steps.version.outputs.changed == 'true'` on everything Android. A change that does not bump the version never touches Java, Gradle, or Play in either place.

Both also use Temurin 21 via `actions/setup-java@v5`, matching the `JavaVersion.VERSION_21` in `android/app/capacitor.build.gradle`. The `ubuntu-latest` image already ships Android SDK platform 36.

### `.github/workflows/main-branch.yml`

Extend the existing `deploy` job rather than adding a second one. A second job would need artifact plumbing or a second `pnpm build`, and a second build would upload duplicate Sentry source maps for the same release.

- `actions/checkout@v6` gains `fetch-depth: 2` so `HEAD~1` is readable.
- Add `permissions: { contents: read, id-token: write }` for the Workload Identity Federation OIDC token.
- Raise `timeout-minutes` from 10 to 25 to cover the Gradle build.
- After the Netlify step: `pnpm tsx scripts/emitVersionChanged.ts HEAD~1` as `id: version`.
- Then, all guarded on it:
  1. `actions/setup-java@v5`.
  2. `pnpm bundle:android`, with the `ANDROID_*` secrets in `env`. `build/` is already on disk from the Netlify step.
  3. `google-github-actions/auth@v2` with `workload_identity_provider: projects/926119935605/locations/global/workloadIdentityPools/github-pool/providers/github-provider` and `service_account: mesopro-play-publisher@backend-463900.iam.gserviceaccount.com`. Omit `token_format` so the action writes an ADC file rather than a fixed-scope token, letting the script request the `androidpublisher` scope itself.
  4. `pnpm tsx scripts/uploadAndroidRelease.ts`, with only the commit message passed through the environment.

`SENTRY_UPLOAD_SOURCE_MAPS` is already `true` on this job, so the Android app ships against the same source maps as the web build.

### `.github/workflows/pull-request.yml`

New `androidBuild` job, `needs: build`, `timeout-minutes: 25`. Without it, the merge that publishes a release is the first time anything Android compiles, and a Gradle, Java, or signing failure lands on `main` instead of on the PR that caused it.

Same shape as the `perf` job, which already consumes the `build` job's artifact:

- Checkout, PNPM, Node, `pnpm install`, as every job in this workflow does.
- `pnpm tsx scripts/emitVersionChanged.ts origin/main` as `id: version`.
- Then, all guarded on it:
  1. `actions/download-artifact@v8` for `buildAndTypes-pr`, the artifact `testAndDeploy` and `perf` already pull, so the web build is never repeated.
  2. `actions/setup-java@v5`.
  3. `pnpm bundle:android`, with the same `ANDROID_*` secrets.

Nothing uploads and no Google credentials are involved, so the job needs no `permissions` block. It signs with the real upload key, so a rotated secret or a broken signing config surfaces on the PR.

## Step 4 — External setup

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

1. Add two repository secrets alongside the existing `NETLIFY_*`, `PERF_TEST_*`, and `SENTRY_AUTH_TOKEN`:
   - `ANDROID_KEYSTORE_BASE64` (`base64 -i ~/.android/keystores/mesopro-upload.jks`)
   - `ANDROID_KEYSTORE_PASSWORD`

## Step 5 — Fold the release configuration into the Android reference doc

Rename `docs/android-signing-and-google-sign-in.md` to **`docs/android-signing-and-publishing.md`**. Update the two inbound links: `README.md:54` and `docs/play-store-submission-plan.md:29`.

Merge into the existing structure rather than appending:

- Rewrite the opening scope line and the TL;DR so the doc answers both questions it now serves: which key signs a given build, and which identity publishes it.
- Extend the distribution-path table with a row for the CI release, so all four paths sit together: local debug key, local upload key, CI upload key, and Google's Play App Signing key.
- New **Publishing identity** section, recording everything under Step 4's "Done" list plus:
  - Why the account is separate from `github-actions-deployer`: that account holds `run.admin`, `compute.instanceAdmin.v1`, `artifactregistry.admin`, `compute.osLogin`, and `iam.serviceAccountUser` on `backend-463900`, none of which publishing needs.
  - Why the name is app-scoped: the impersonation grant is per repository, so a shared `play-publisher` would let every bound repo release every app it can reach. Matches the `<app>-<purpose>` convention already documented for `mesopro-upload.jks`.
  - That Play Console grants release permission, which is why the account carries no GCP project roles.
- New **GitHub repository secrets** subsection: the two `ANDROID_*` values, where each comes from, and that Play App Signing holding the real signing key is what makes storing the upload key acceptable.
- New **Publishing locally** subsection. Developers authenticate as themselves, not as `mesopro-play-publisher`, which stays CI's identity alone. Record the `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/androidpublisher,https://www.googleapis.com/auth/cloud-platform` command and that `pnpm release:android` then runs unchanged because `scripts/uploadAndroidRelease.ts` reads ADC. Note that `--scopes` is required, since the ADC defaults cover `cloud-platform` but not `androidpublisher`, and that `gcloud auth login` does not satisfy this because it writes to a different credential store. Only the upload needs it; `pnpm bump` never talks to Play.
- Extend **Adding a new developer** with a Play Console invite step for anyone who needs to publish, alongside the existing debug-key OAuth client registration. Each person gets their own Play Console access so uploads stay attributable and offboarding is a single removal there.

Once this lands, this plan document is superseded and can be deleted.

## What gets removed or corrected

**`scripts/publishAndroidBuild.ts`** — deleted. Its version handling moves into `scripts/bumpRelease.ts` per Step 1; the rest goes.

**`package.json`**

- `publish:android:build` and `publish:android:validate` scripts. The `androidBuild` job in Step 3 covers what `signingReport` checked.
- The `"scriptsComments": {}` key.

**`README.md`**

- The Publishing bullet collapses to one line: `pnpm bump` plus merge.
- Line 71's pointer to `scriptsComments` is corrected to name `scripts/dev-android.ts`, which holds the `DEVICES` list.

**`vite.config.ts`**

- The comment on lines 18 to 21 names `pnpm publish:android:build` as a source-map upload path. The main-branch workflow becomes the only uploader.

**`docs/play-store-submission-plan.md`**

Kept, because Step 4's asset uploads and Step 7's 12-tester gate are still open. Seven passages need correcting:

- Line 3, the header, still says `versionCode 1 / versionName "1.0"`. Point both at `pnpm bump`, which is the only thing that writes either.
- Line 5 links to `capacitor-android-plan.md`, which no longer exists.
- Step 3, lines 54 to 56: the manual `versionCode` bump and local build steps become `pnpm bump` plus a merge.
- Step 3, line 60: "Add an npm script `release:android`" is satisfied by Step 2. Point it there.
- Step 8, line 145: "upload the latest AAB (bump `versionCode`)" becomes promoting the CI-uploaded build in Play Console.
- Validation checkpoints, lines 158 to 161: the manual `build:android` and `bundleRelease` checks are CI's job, and "versionCode strictly increased" is `pnpm bump`'s. The device smoke test survives.
- Post-launch follow-ups, line 169: replace the Gradle Play Publisher recommendation with a pointer to `docs/android-signing-and-publishing.md`.

Step 7's "push at least one patch release during this window" becomes `pnpm bump` plus a merge.

## Validation

Per the repo's completion checklist: `pnpm lint --fix`, `pnpm check`, `pnpm test`.

Android-specific, in order:

1. `pnpm bump`, choosing patch. Confirm `package.json` `version` and `build.gradle` `versionName` both moved to `1.1.8`, and `versionCode` from `13` to `14`.
2. `pnpm bundle:android` with no `ANDROID_*` variables set. Confirm it leaves the developer's own `android/keystore.properties` untouched and still produces a signed bundle.
3. `pnpm release:android` from a developer machine, publishing to the internal track.
4. Open the bump as a PR. Confirm `androidBuild` runs and produces a signed bundle, and that a second PR without a version bump skips every Android step.
5. Merge it: watch the workflow, then confirm the build appears on the target track with the expected version code.

If `bundleRelease` reports a missing SDK component despite platform 36 being preinstalled, add `android-actions/setup-android@v3` ahead of the Gradle step.
