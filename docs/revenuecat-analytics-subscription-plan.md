# MesoPro Supporter subscription plan

Add a $3/month **MesoPro Supporter** tier, sold through Google Play Billing in the Android app and RevenueCat Web Billing (Stripe) on the web. RevenueCat handles purchase validation and the subscription lifecycle. Analytics is the first feature behind the tier. iOS is added later as configuration plus another RevenueCat API key.

**Naming in code:**

- The RevenueCat entitlement is `supporter`. "Entitlement" is the term RevenueCat and Google Play Billing both use for access granted by a purchase.
- The stored field is `supporterExpiresAt`.

## Overview

```
Android app ──purchasePackage()──> Google Play ──RTDN──┐
Web app ─────purchase()──────────> RevenueCat Web Billing (Stripe)
                                                        v
                                                    RevenueCat
                                                        │ webhook (Authorization header)
                                                        v
                            gcloud-backend POST project/workout/revenueCat/webhook ─┐
Dashboard admin panel ── POST admin (update config / sync) ─────────────────────────┤
                                                                                    v
                                              WorkoutUserConfigRepository.update
                                                                                    │
App (both platforms) <── primary endpoint get.userConfig ───────────────────────────┘
```

- **Source of truth:** a new `WorkoutUserConfig` document per user, modeled on `DashboardUserConfig`. Its `supporterExpiresAt` field is the only thing the app checks.
- **Who writes it:**
  - The RevenueCat webhook writes RevenueCat's current expiry.
  - The dashboard admin panel can edit any `WorkoutUserConfig` field. For the entitlement, that means Grant (year 3000) or Clear (null), plus a Sync action that re-fetches from RevenueCat.
  - The workout app's own update path strips the field, so clients cannot write it.
- **Webhook handling:** follows RevenueCat's recommendation to re-fetch the customer from the REST API on every event instead of interpreting each event type ([RevenueCat webhooks docs](https://www.revenuecat.com/docs/integrations/webhooks)). The same fetch-and-write backs the admin "sync" action.
- **App user ID:** the RevenueCat app user ID is the `User._id` UUID on both platforms.
- **Enforcement:** client-side only.

## Step 0: Working folders

| Repo           | Folder                                                                    | Branch                 |
| -------------- | ------------------------------------------------------------------------- | ---------------------- |
| ts-libs        | `/Users/aneuhold/Development/GithubRepos/ts-libs-wt-AddWorkoutUserConfig` | `AddWorkoutUserConfig` |
| gcloud-backend | `/Users/aneuhold/Development/GithubRepos/gcloud-backend`                  | `AddRevenueCat`        |
| workout        | `/Users/aneuhold/Development/GithubRepos/workout-wt-AnalyticsPage`        | `AnalyticsPage`        |
| dashboard      | `/Users/aneuhold/Development/GithubRepos/dashboard-wt-SetupRevenueCat`    | the worktree's branch  |

## Step 1: ts-libs

Follow `ts-libs/.claude/CLAUDE.md`. Do not bump versions. `pnpm watch` runs in the ts-libs worktree and publishes changes to the local registry for consumers subscribed with their `sub:` scripts.

- **New document: `core-ts-db-lib/src/documents/workout/WorkoutUserConfig.ts`.** It mirrors `documents/dashboard/UserConfig.ts`:
  - `WorkoutUserConfig_docType = 'workoutUserConfig'` (matching the other workout docTypes);
  - `BaseDocumentWithTypeSchema` and `RequiredUserIdSchema` shapes;
  - `supporterExpiresAt: z.date().nullish()`, with a JSDoc saying it mirrors the RevenueCat `supporter` entitlement expiry and is written only by the webhook and admin actions.

  Export it from the package's root `index.ts` with the other workout documents, with a spec alongside it.

- **New repository: `be-ts-db-lib/src/repositories/workout/WorkoutUserConfigRepository.ts`** with a validator in `validators/workout/`.
  - It extends `WorkoutBaseWithUserIdRepository` and follows `DashboardUserConfigRepository`: singleton `getRepo()`, `getForUser(userId)`, and `getListenersForUserRepo()`.
  - The listener creates the config on `insertNew` / `insertMany` when `user.projectAccess.workout` is true, and deletes it on user deletion. It has no collaborator logic.
  - Register it in `UserRepository.setupSubscribers()`.
  - The repository has no entitlement-specific methods. The webhook, admin and client updates all use the standard `update` / `updateMany`, and the client restriction lives in the backend's workout update path (Step 2).
  - The validator rejects new documents, since configs are only created by the `UserRepository` listener and the migration.
  - Add a spec matching the other workout repository specs.
- **Backfill:** add a `MigrationService` entry that inserts a default `WorkoutUserConfig` for every existing user with workout access, and run it once against the DB.
- **`core-ts-api-lib/src/types/project/workout/ProjectWorkout.ts`:** add a singular `userConfig`, since each user has exactly one config:
  - in `get`, as `userConfig?: boolean` (the requesting user's config);
  - in `update`, as `userConfig?: WorkoutUserConfig`;
  - in `ProjectWorkoutPrimaryOutput`, as `userConfig?: WorkoutUserConfig`.

  There is no `insert` or `delete` option: configs are created by the `UserRepository` listener and the migration, and deleted with the user.

- **`core-ts-api-lib/src/types/Admin.ts`:** add admin support for the entitlement. Export the new types from `browser.ts` next to the other admin types. No new endpoint or client method is needed, since everything goes through `APIService.callAdminAPI`.
  - **`AdminInput.update`:** add `workoutUserConfigs?: WorkoutUserConfig[]`, next to `users`. The admin can update any config field, the same way it already updates any `User` field.
  - **`AdminInput.update`:** also add `sync?: { [userId: UUID]: { workoutUserConfig?: { entitlements?: { supporterExpiresAt?: boolean } } } }`. Each field set to `true` is updated from its external system's current value (RevenueCat for `supporterExpiresAt`) instead of from a document the client sends. New syncable fields are added as more keys in the same shape.
  - **`AdminOutputUserDetail`:** add `workoutUserConfig?: WorkoutUserConfig`.
- **`be-ts-lib/src/services/ConfigService/ConfigDefinition.ts`:** add `revenueCatGCloudBackendWebhookAuthHeader: z.string()` and `revenueCatGCloudBackendSecretApiKey: z.string()` to `ConfigSchema`, each with a one-line JSDoc.
- Run `pnpm check`, `pnpm test`, `pnpm lint` in ts-libs.

## Step 2: gcloud-backend

Run `pnpm sub` to subscribe to all four ts-libs packages from Step 1.

- **New guard: `src/common/guards/RevenueCatWebhook.guard.ts`.** A `CanActivate` modeled on `SuperAdmin.guard.ts` that compares the `Authorization` header to `ConfigService.config.revenueCatGCloudBackendWebhookAuthHeader` with `crypto.timingSafeEqual`. A separate guard is needed because the global `AuthGuard` only accepts Bearer JWTs.
- **New module: `src/routes/project/workout/revenueCat/`** with `RevenueCat.controller.ts`, `RevenueCat.module.ts` and `RevenueCat.service.ts`, registered in `src/routes/App.module.ts`. The module exports `RevenueCatService` so `AdminModule` can import it.
  - **Controller:** `POST project/workout/revenueCat/webhook`, placed under the workout project because the RevenueCat project and the `WorkoutUserConfig` it writes are both MesoPro-specific. Another app's RevenueCat project would get its own webhook under its own project path. It is decorated with `@Public()` and `@UseGuards(RevenueCatWebhookGuard)`. It returns 200 once the event is handled, including for unknown users, so RevenueCat does not retry. It returns a non-200 only for transient failures (REST API or DB unavailable) so RevenueCat's retries cover them.
  - **Service, `syncSupporterEntitlement(userId)`:** calls `GET https://api.revenuecat.com/v2/projects/{projectId}/customers/{userId}/active_entitlements` ([API v2 customer docs](https://www.revenuecat.com/docs/api-v2/customer)) with `revenueCatGCloudBackendSecretApiKey`, and finds the item whose `entitlement_id` is the `supporter` entitlement's ID. The project ID (`projbb068855`) and the `supporter` entitlement ID are not secret, so they are `static readonly` fields on the service. The entitlement ID is RevenueCat's generated ID from the entitlement's page (the [v2 entitlement object](https://www.revenuecat.com/docs/api-v2/entitlement) shows the format `entla1b2c3d4e5`), not the `supporter` lookup key. `expires_at` is in ms since epoch. It writes that date (or null if the entitlement is not active) onto the user's config with `WorkoutUserConfigRepository.update`, and returns the updated config. This is the one place that talks to RevenueCat, and both the webhook and the admin sync use it.
  - **Service, `handleWebhookEvent(event)`:**
    - Collects the user IDs from the event: `app_user_id`, plus `transferred_from` / `transferred_to` for `TRANSFER` events.
    - Skips IDs that are not UUIDs (RevenueCat anonymous IDs) or that have no `WorkoutUserConfig`.
    - Calls `syncSupporterEntitlement` for each remaining ID.
  - Type the webhook body and REST response as `unknown` and narrow them with a small Zod schema.
- **Workout primary endpoint:** add `userConfig` branches next to the existing per-type branches:
  - `WorkoutRetrieval.service.ts` `handleGet`, with `getForUser` for the requesting user;
  - `WorkoutUpdate.service.ts`, with `update`. It first removes `entitlements` from the incoming config, which makes this the single place that keeps clients from writing the entitlement.
- **Admin (`src/routes/admin/Admin.service.ts`):**
  - `#handleUpdate` also applies `update.workoutUserConfigs` through `WorkoutUserConfigRepository.update`, the same way it applies `update.users`.
  - `#handleUpdate` also handles `update.sync`, after the document updates. It calls `RevenueCatService.syncSupporterEntitlement` for each user ID whose `workoutUserConfig.entitlements.supporterExpiresAt` is `true`. It overwrites the field with RevenueCat's value, null included. If the RevenueCat call fails, the field is left unchanged and the error is returned in `errors`.
  - `#getUserDetail` also loads `WorkoutUserConfigRepository.getRepo().getForUser(userId)` into `workoutUserConfig`, in parallel with the dashboard config.
  - `Admin.module.ts` imports `RevenueCatModule`.
- **Tests:**
  - `RevenueCat.service.spec.ts` uses `TestUtil.insertTestUser` and a stubbed `fetch` for the REST response. It checks that:
    - the expiry is written, and null is written when the entitlement is absent;
    - unknown and anonymous IDs are ignored;
    - both sides of a transfer are synced.
  - `Admin.service.spec.ts` checks that `update.workoutUserConfigs` writes the entitlement, that sync writes RevenueCat's value (with `fetch` stubbed), and that `userDetail` includes `workoutUserConfig`.
  - `WorkoutUpdate.service.spec.ts`: a client `update.userConfig` that sets `supporterExpiresAt` leaves the stored value unchanged.
  - `test/App.e2e.spec.ts`: add a case that the webhook returns 401 for a missing or wrong Authorization header.
- Run `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`.
- After deploying, use **Send test event** on the RevenueCat `gcloud-backend` webhook and confirm it returns 200.

## Step 3: workout app, `currentUser` store and config document

Run `pnpm sub:core-ts-api-lib` and `pnpm sub:core-ts-db-lib` for the Step 1 changes.

Two changes:

- The server-side `WorkoutUserConfig` is held by a single-document service, since each user has exactly one.
- The existing local `userConfig` store, which holds auth info rather than a config, becomes `currentUser`. It also absorbs the `password` store and the flat `username` key, so all local login state lives in one place.

### `currentUser` store (rename of `userConfig`)

- **File and type:** move `src/stores/local/userConfig/userConfig.ts` to `src/stores/local/currentUser/currentUser.ts` (and the mock to `currentUser.mock.ts`). The type is `CurrentUser = { userId, username, password, accessToken, refreshTokenString }`.
  - `clear()` resets `userId` and the tokens but keeps `username` and `password`. This preserves today's behavior, where the login form stays pre-filled after logout.
  - Delete the stale TODO block about API persistence.
- **Delete `src/stores/local/password.ts`.** Its consumers (`Auth.service.ts`, `+layout.svelte` hydration, `Login.svelte`) use `currentUser` instead.
- **`src/util/LocalData/LocalData.ts`:**
  - Replace the `userConfig`, `username` and `password` keys with a single `currentUser` key in `storedKeyNames` and `#smallTierKeys`.
  - Replace `getUserConfig` / `setUserConfig`, `getUsername` / `setUsername` and `getPassword` / `setPassword` with `getCurrentUser` / `setCurrentUser`.
  - Update `LocalData.spec.ts` and `SessionStorageBackend.spec.ts` to match.
- **Consumers:** all current `userConfig` consumers rename to `currentUser`:
  - `currentUserId.ts`, `enabledPages.ts`, `loginState.ts`, `Auth.service.ts`, `WebSocket.service.ts`, `WorkoutAPI.service.ts`, `SessionMap.service.svelte.ts`;
  - `MockEnvSetup.service.ts`, `DemoMode.service.spec.ts`;
  - both `+layout.svelte` files and `SettingsPageDeleteAccountButton.svelte`.

  `currentUserId` becomes `derived(currentUser, (u) => u.userId)`, and its 6 page and dialog consumers are untouched.

- **Existing installs:** `STORAGE_PREFIX` in `src/util/LocalData/storagePrefix.ts` moves from `v5-` to `v6-`, with no key migration. `LocalData.init()` deletes the `v5-` entries, so existing installs start signed out with an empty cache and refetch everything after signing in. Changes that had not synced before the update are lost.

### `UserConfig.service.svelte.ts` (new)

**New file: `src/services/UserConfigService/UserConfig.service.svelte.ts`.** It extends `AbstractDocumentMapStoreService` so it hydrates and handles API output with the document map services, and holds the config as `$state<WorkoutUserConfig | null>`.

- **`get currentConfig()`:** the held config when its `userId` matches the signed-in user.
- **`setWithoutApiPersist(config)`** replaces the config, and **`updateWithoutApiPersist(updater)`** updates the signed-in user's loaded config. Both persist to local data without an API write.
- A new `workoutUserConfig` key in `LocalData.storedKeyNames` with `getWorkoutUserConfig` / `setWorkoutUserConfig`. `LocalData.clearWorkoutDocuments()` clears it with the workout maps.
- `handleApiOutput` sets the config when `output.userConfig` is present and `input.get.userConfig` is set.
- **`get entitlements()`:** returns `{ supporter: boolean }`, where `supporter` is true when the current user's config has a `supporterExpiresAt` in the future. Future entitlements are added as more keys. This is the only gate the UI checks.
- Add it to `apiResponseHandlingOrder.ts`.
- `WorkoutAPI.service.ts` `getInitialData()` adds `userConfig: true`.
- **Demo mode and Storybook:** seed a config with a future `supporterExpiresAt` through the existing mock scenario setup, built with `WorkoutUserConfigSchema.parse`. Demo mode then shows analytics with no special case in the gate.

## Step 4: workout app, purchase flow and paywall

Install `@revenuecat/purchases-js` ([Web SDK docs](https://www.revenuecat.com/docs/web/web-billing/web-sdk)) as a dev dependency. `@revenuecat/purchases-capacitor` is already on `main`.

### Android

- **`android/app/src/main/AndroidManifest.xml`:** change the main activity's `launchMode` from `singleTask` to `singleTop`. RevenueCat warns that modes other than `standard` / `singleTop` can cancel a purchase when the app is backgrounded ([Capacitor installation docs](https://www.revenuecat.com/docs/getting-started/installation/capacitor)). The auth flow is unaffected:
  - The activity has no deep-link intent filters.
  - Google sign-in goes through Credential Manager.
  - No `appUrlOpen` listener exists.

### RevenueCat service

**New file: `src/services/RevenueCat.service.ts`.** It holds no reactive state, so it is `.service.ts` rather than `.service.svelte.ts`. It follows the other native-plugin wrappers: an idempotent `init()`, a `Capacitor.isNativePlatform()` branch and a default-exported singleton. It only wraps the SDKs; the gate lives in `UserConfig.service`.

- **`init(userId)`:** skipped in demo mode.
  - On native, calls `Purchases.configure({ apiKey, appUserID })` from `@revenuecat/purchases-capacitor`.
  - On web, calls `Purchases.configure({ apiKey, appUserId })` from `@revenuecat/purchases-js`.
  - If already configured for another user, it calls `logIn(userId)` instead. It never calls `logOut()`, since that creates anonymous IDs ([identifying customers](https://www.revenuecat.com/docs/customers/identifying-customers)).
  - The public API keys are `static readonly` fields, matching how `UpdateCheck.service.svelte.ts` holds its URL. Web uses the sandbox key in dev builds and the production key otherwise.
    - MesoPro (Play Store): `goog_MBlwtwazXAphuqLnFTuPhquiPpB`
    - MesoPro (Web): `rcb_eBhpqqdAPcFtQyMGxlpcsSjbBiZk`
    - MesoPro (Web) sandbox: `rcb_sb_jUpWrhhvYOdUjRIUyTwqmJSyb`
- **`purchase()`:**
  - Looks up the `supporter_monthly` package in the current offering's `availablePackages` by identifier, then calls the platform SDK's purchase method.
  - The package identifier is a `static readonly` field, not the `offering.monthly` shortcut, so adding other tiers' packages does not change it.
  - On success, it copies `customerInfo.entitlements.active.supporter.expirationDate` into the local config through `userConfigService.updateWithoutApiPersist`, without an API write. This unlocks the app immediately, and the next initial data fetch replaces it with the webhook-written value.
  - A user-cancelled purchase is a no-op, not an error.
- **`getManagementUrl()`:** reads `CustomerInfo.managementURL` on demand, for the settings row.
- **Wiring:** call `init` from the two places that establish a logged-in user: `Auth.service.ts` `#applyLoginResult` and `loginState.ts` `init()`.

### UI

- **Analytics page gate:** at the top of the analytics page component (`src/pages/AnalyticsPage/AnalyticsPage.svelte`, created by the analytics page work on this branch), render `AnalyticsPagePaywall.svelte` when `!userConfigService.entitlements.supporter`.
  - The paywall is a `Card` like `DemoModeCard.svelte`: "MesoPro Supporter", what it includes, $3/month, and a Subscribe button calling `revenueCatService.purchase()` on both platforms.
  - The nav item stays visible.
- **Settings:** add `src/pages/SettingsPage/SettingsPageSupporterRow.svelte`, placed before `SettingsPageDeleteAccountButton`. It shows the supporter status and, when `getManagementUrl()` returns a URL, a "Manage subscription" button. Users with an admin grant have no RevenueCat history, so the button does not appear for them.
- **Storybook:** add stories for `AnalyticsPagePaywall` and the settings row (inactive, active), following the `SettingsPage/SB/` layout. `SBFullAppRouter.svelte` already routes `/analytics`.

### Tests and validation

- `UserConfig.service` spec: `entitlements.supporter` for an expired date, a future date, a null date and a missing config. Use the existing mock utilities in `src/services`.
- Run `pnpm lint --fix`, `pnpm check`, `pnpm test`.
- With the release, update the Play Data safety form to declare purchase history (collected by RevenueCat).

## Step 5: dashboard admin panel

- **Precondition (done separately, outside this plan):** the dashboard is already on the latest `@aneuhold` packages with their breaking changes adopted. Do not start this step until that is merged into `dashboard-wt-SetupRevenueCat`. This step then runs `pnpm sub:core-ts-api-lib` and `pnpm sub:core-ts-db-lib` for the Step 1 changes.
- **`src/components/Admin/AdminUserConfigInfo.svelte`:** add a "Workout User Config" `Paper` section next to "Dashboard User Config". It shows `supporterExpiresAt`, displayed as "Not a supporter" when null.
- **`src/components/Admin/AdminUserDetail.svelte`:** add a supporter entitlement row with three SMUI buttons, matching the existing Save and Delete buttons. Each refreshes from the returned `userDetail` and shows `snackbar.success` / `snackbar.error`, the same as `saveUser`.
  - **Grant** and **Clear** send the loaded `workoutUserConfig` with `supporterExpiresAt` set to `3000-01-01` or null, through `AdminAPIService.query({ update: { workoutUserConfigs: [config] }, get: { userDetail: userId } })`. Clear asks for confirmation through `confirmationDialog.open`, like Delete.
  - **Sync from RevenueCat** sends `{ update: { sync: { [userId]: { workoutUserConfig: { entitlements: { supporterExpiresAt: true } } } } }, get: { userDetail: userId } }`. It replaces the date with whatever RevenueCat returns (a date or none).
  - Further config fields can get edit controls here later through the same `update.workoutUserConfigs` path.
- **Mocks and stories:**
  - `AdminAPI.service.mock.ts` `createUserDetail` adds a `workoutUserConfig` built with `WorkoutUserConfigSchema.parse`.
  - Add story variants for a supporter and a non-supporter to `AdminUserConfigInfo.stories.svelte` and `AdminUserDetail.stories.svelte`.
- Run the dashboard's lint, check and test scripts.

## End-to-end validation

With a license tester and Stripe test mode, check that:

- a purchase on either platform unlocks immediately;
- the webhook writes `supporterExpiresAt`;
- the other platform unlocks after its next initial data fetch;
- the admin panel's Grant unlocks with no purchase, Clear locks again, and Sync restores RevenueCat's value;
- cancelling keeps access until expiry;
- an existing install upgrading to this build stays signed in and keeps its queued changes.
