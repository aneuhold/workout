# Google Authentication — Phase 2: Deprecation of Old Auth

This document describes the plan for removing the legacy API key system after Phase 1 (Google Sign-In + JWT) has been deployed and verified in production. Password-based login is kept for test accounts but moves to JWT auth.

See also: [Phase 1: Implementation](./google-auth-plan.md)

## Repo Locations on Disk

| Repo | Path |
|------|------|
| workout | `~/Development/GithubRepos/workout-wt-DeprecateApiKey` |
| dashboard | `~/Development/GithubRepos/dashboard` |
| ts-libs | `~/Development/GithubRepos/ts-libs` |
| gcloud-backend | `~/Development/GithubRepos/gcloud-backend` |

## Prerequisites

- Phase 1 is fully deployed and verified across all three repos
- The dashboard app has also been updated to use JWT auth (Phase 1)

---

## LocalData Prefix Consideration

Both the workout and dashboard apps use a `v3-` prefix for all localStorage keys (defined in each app's `LocalData.ts`). Bumping to `v4-` would force all users to re-login and clear cached data (workout maps, tasks, etc.) since no migration logic exists.

**Recommendation: Do NOT bump the prefix.** Reasons:

- Users who already have `accessToken` stored will remain seamlessly logged in
- Users who only have `apiKey` (haven't logged in since Phase 1) will be forced to re-login anyway because the `apiKey` login-state check is being removed — this is the desired behavior
- Orphaned `v3-apiKey` entries are tiny and harmless in localStorage
- Bumping would unnecessarily clear all cached document maps, forcing every user to re-fetch all data

If a clean-slate approach is preferred later, bumping the prefix remains an option.

---

## Deprecation Plan

### Step 1: ts-libs Changes

#### 1a. Remove `apiKey` from `WebSocketHandshakeAuth`

**File**: `packages/core-ts-api-lib/src/types/WebSocket.ts` — remove deprecated `apiKey` field, keep only `accessToken`.

#### 1b. Remove `apiKey` from API input types

**Files**:
- `packages/core-ts-api-lib/src/types/project/workout/ProjectWorkout.ts` — remove `apiKey` from `ProjectWorkoutPrimaryInput`
- `packages/core-ts-api-lib/src/types/project/dashboard/ProjectDashboard.ts` — remove `apiKey` from `ProjectDashboardInput`

The `AuthGuard` handles auth via the `Authorization` header now; `apiKey` in the request body is no longer needed.

#### 1c. Remove `apiKey` from `AuthValidateUserOutput`

**File**: `packages/core-ts-api-lib/src/types/AuthValidateUser.ts` — remove `apiKey: ApiKey` from `userInfo`. The response still returns `user`, `accessToken`, and `refreshTokenString`, which is all clients need.

#### 1d. Remove `ApiKey` document and repository

**Files**:
- `packages/core-ts-db-lib/src/documents/common/ApiKey.ts` — delete
- `packages/core-ts-db-lib/src/browser.ts` — remove `ApiKeySchema` export
- `packages/be-ts-db-lib/src/repositories/common/ApiKeyRepository.ts` — delete
- `packages/be-ts-db-lib/src/validators/common/ApiKeyValidator.ts` — delete
- `packages/be-ts-db-lib/src/util/DbSchemaUpdater.ts` — remove ApiKey validation references

#### 1e. Remove ApiKey from `UserRepository` subscriber

The `UserRepository` auto-creates an `ApiKey` when a new user is inserted, and auto-deletes it when a user is deleted. Remove this subscriber logic.

### Step 2: gcloud-backend Changes

#### 2a. Remove legacy API key fallback from `AuthGuard`

**File**: `src/common/guards/Auth.guard.ts` (lines 49–60) — remove the fallback block that checks for `apiKey` in `request.body` and looks it up via `ApiKeyRepository`. The guard now only accepts JWT `Authorization: Bearer` headers.

#### 2b. Remove `POST /auth/checkPassword`

**File**: `src/routes/auth/Auth.controller.ts` — delete the `checkPassword` endpoint entirely.

#### 2c. Remove legacy API key fallback from WebSocket gateways

**Files**:
- `src/routes/project/workout/Workout.gateway.ts` (lines ~148–157) — remove `apiKey` fallback branch from `authenticateClient()`
- `src/routes/project/dashboard/Dashboard.gateway.ts` (lines ~167–176) — remove `apiKey` fallback branch from `authenticateClient()`

Only `accessToken` JWT verification remains.

#### 2d. Remove `apiKey` from auth response

**File**: `src/routes/auth/Auth.controller.ts` — stop returning `apiKey` in `userInfo`. Update the `validateUser` endpoint to return `{ user }` instead of `{ user, apiKey }`.

#### 2e. Remove `ResolvedCredentials.apiKey` and related lookups

**File**: `src/routes/auth/Auth.service.ts` — remove `apiKey: ApiKey` from `ResolvedCredentials` interface. Remove `ApiKeyRepository` lookups from both `resolvePasswordCredentials()` and `resolveGoogleCredentials()`.

#### 2f. Update tests

**File**: `src/routes/project/dashboard/Dashboard.controller.spec.ts` — remove `apiKey` from test fixture `createDashboardInput()` helper and any other test references.

#### 2g. Hash stored passwords (optional)

If keeping password-based login for test accounts, migrate from plaintext password comparison to bcrypt hashing. This is independent of the API key removal but is a good security improvement to bundle in.

### Step 3: Workout App Changes

#### 3a. Remove `apiKey` from `UserConfig` type and store

**File**: `src/stores/local/userConfig/userConfig.ts`
- Remove `apiKey: UUID | null` from the `UserConfig` type
- Remove `apiKey: null` from the default config and `clear()` method

#### 3b. Remove `apiKey` from `UserConfigMock`

**File**: `src/stores/local/userConfig/userConfig.mock.ts` — remove `apiKey: DocumentService.generateID()` from mock config.

#### 3c. Remove `apiKey` from `LocalData`

**File**: `src/util/LocalData/LocalData.ts` — remove `apiKey` from `storedKeyNames`, and delete the `apiKey` getter/setter (lines 84–94). The orphaned `v3-apiKey` entry in users' browsers is harmless.

#### 3d. Remove `apiKey` fallback from login state initialization

**File**: `src/stores/session/loginState.ts` (line 50) — change:
```typescript
// Before
if (browser && (config.accessToken || config.apiKey)) {
// After
if (browser && config.accessToken) {
```
Only `accessToken` determines whether the user is logged in. Users without an `accessToken` will be prompted to re-login (which will issue JWTs).

#### 3e. Remove `apiKey` from Login result handling

**File**: `src/components/Login/Login.svelte` (lines 96, 107–113) — stop extracting `apiKey` from `validationResponse.data.userInfo` and stop including it in `userConfig.set(...)`. The `userConfig` only needs `userId`, `username`, `accessToken`, and `refreshTokenString`.

#### 3f. Remove `apiKey` from `WorkoutAPIService`

**File**: `src/services/WorkoutAPIService.ts`
- Remove `checkOrSetupWorkoutAPI()` method (lines 98–104) which validates `apiKey`
- Update `callWorkoutAPI()` (lines 151–168) to stop passing `apiKey` in the request body — only `options` and `socketId` are needed
- Update `getInitialDataIfNeeded()` (line 49) — replace `userConfig.get().apiKey` check with `userConfig.get().accessToken`

#### 3g. Remove `apiKey` from `WebSocketService`

**File**: `src/services/WebSocketService.ts` (line 26) — remove `apiKey: config.apiKey ?? undefined` from the `auth` object. Only `accessToken` is sent. Also update JSDoc on `disconnect()` (line 75) to remove "API key changes" reference.

#### 3h. Remove `password` store and `LocalData.password` (optional)

**Files**:
- `src/stores/local/password.ts` — consider keeping for test account convenience, or remove if not needed
- `src/util/LocalData/LocalData.ts` — consider removing `password` from `storedKeyNames` and its getter/setter

> **Note**: The username/password login form and password flow in `validateUser` are **kept** for test accounts that don't have a Google account. Both flows already issue JWTs in Phase 1, so no additional work is needed — the password flow just continues to work as-is without API keys.

### Step 4: Dashboard App Changes

#### 4a. Delete the `apiKey` store

**File**: `src/stores/local/apiKey.ts` — delete this file entirely. The dashboard will use `accessToken` for all auth checks.

#### 4b. Remove `apiKey` from `LocalData`

**File**: `src/util/LocalData/LocalData.ts` — remove `apiKey` from `storedKeyNames` and delete the `apiKey` getter/setter (lines 78–88).

#### 4c. Remove `apiKey` fallback from login state initialization

**File**: `src/stores/session/loginState.ts` (line 50) — change:
```typescript
// Before
if (browser && (LocalData.accessToken || (LocalData.apiKey && LocalData.apiKey !== ''))) {
// After
if (browser && LocalData.accessToken) {
```

#### 4d. Remove `apiKey` from Login result handling

**File**: `src/components/Login/Login.svelte`
- Line 63: Remove `validationResponse.data.userInfo?.apiKey` from the success condition
- Lines 68, 81: Stop extracting `apiKeyValue` and stop calling `apiKey.set(apiKeyValue)`
- The login response is now verified by checking `validationResponse.data.userInfo?.user` and `validationResponse.data.config?.dashboard`

#### 4e. Remove `apiKey` from `DashboardAPIService`

**File**: `src/util/api/DashboardAPIService.ts`
- Remove `checkOrSetupDashboardAPI()` method (lines 134–140) which validates `apiKey`
- Update `callDashboardAPI()` (lines 178–195) to stop passing `apiKey` in the request body
- Update `checkIfUsernameIsValid()` (lines 116–132) to stop passing `apiKey`
- Update `getInitialDataIfNeeded()` (line 56) — replace `apiKey.get()` check with `LocalData.accessToken`
- Remove `import { apiKey } from '$stores/local/apiKey'`

#### 4f. Remove `apiKey` from `WebSocketService`

**File**: `src/services/WebSocketService.ts` (line 25) — remove `apiKey: apiKey.get() ?? undefined` from the `auth` object. Remove `import { apiKey } from '$stores/local/apiKey'`. Only `accessToken` is sent.

#### 4g. Remove `apiKey` from logout flow

**File**: `src/components/NavBar.svelte`
- Line 9: Remove `import { apiKey } from '$stores/local/apiKey'`
- Line 28: Remove `apiKey.set(null)` from `handleLogout()`

#### 4h. Remove `password` store and `LocalData.password` (optional)

Same consideration as workout app — keep for test accounts or remove if not needed.

---

## Execution Order

The steps should be executed in this order to avoid breaking changes:

1. **Step 1 (ts-libs)**: Remove `apiKey` from types and exports. Publish new versions.
2. **Step 2 (gcloud-backend)**: Remove server-side API key fallbacks. Deploy.
3. **Steps 3 & 4 (workout + dashboard)**: Remove client-side API key usage. Can be done in parallel. Deploy.

> **Important**: Steps 1 and 2 must be deployed first. If clients still send `apiKey` in request bodies to a server that no longer reads it, that's harmless (the field is just ignored). But if clients stop sending `apiKey` before the server stops requiring it, requests from users on old cached versions could fail. Since Phase 1 already made `apiKey` optional on both sides, the order is flexible in practice — but the above order is safest.

---

## Files Changed Summary

### ts-libs (`core-ts-api-lib`)

| File | Action |
|------|--------|
| `src/types/WebSocket.ts` | Update (remove `apiKey`) |
| `src/types/AuthValidateUser.ts` | Update (remove `apiKey` from `userInfo`) |
| `src/types/project/workout/ProjectWorkout.ts` | Update (remove `apiKey` from input) |
| `src/types/project/dashboard/ProjectDashboard.ts` | Update (remove `apiKey` from input) |

### ts-libs (`core-ts-db-lib`)

| File | Action |
|------|--------|
| `src/documents/common/ApiKey.ts` | Delete |
| `src/browser.ts` | Update (remove `ApiKeySchema` export) |

### ts-libs (`be-ts-db-lib`)

| File | Action |
|------|--------|
| `src/repositories/common/ApiKeyRepository.ts` | Delete |
| `src/validators/common/ApiKeyValidator.ts` | Delete |
| `src/util/DbSchemaUpdater.ts` | Update (remove ApiKey references) |
| `UserRepository` subscriber logic | Update (remove auto-create/delete of ApiKey) |

### gcloud-backend

| File | Action |
|------|--------|
| `src/common/guards/Auth.guard.ts` | Update (remove API key fallback) |
| `src/routes/auth/Auth.controller.ts` | Update (remove `checkPassword`, stop returning `apiKey`) |
| `src/routes/auth/Auth.service.ts` | Update (remove `apiKey` from `ResolvedCredentials`, remove lookups) |
| `src/routes/project/workout/Workout.gateway.ts` | Update (remove `apiKey` fallback) |
| `src/routes/project/dashboard/Dashboard.gateway.ts` | Update (remove `apiKey` fallback) |
| `src/routes/project/dashboard/Dashboard.controller.spec.ts` | Update (remove `apiKey` from test fixtures) |

### workout

| File | Action |
|------|--------|
| `src/stores/local/userConfig/userConfig.ts` | Update (remove `apiKey` from type + defaults) |
| `src/stores/local/userConfig/userConfig.mock.ts` | Update (remove `apiKey` from mock) |
| `src/util/LocalData/LocalData.ts` | Update (remove `apiKey` key + getter/setter) |
| `src/stores/session/loginState.ts` | Update (remove `apiKey` fallback check) |
| `src/components/Login/Login.svelte` | Update (stop extracting/storing `apiKey`) |
| `src/services/WorkoutAPIService.ts` | Update (remove `apiKey` from API calls + checks) |
| `src/services/WebSocketService.ts` | Update (remove `apiKey` from auth) |

### dashboard

| File | Action |
|------|--------|
| `src/stores/local/apiKey.ts` | **Delete** |
| `src/util/LocalData/LocalData.ts` | Update (remove `apiKey` key + getter/setter) |
| `src/stores/session/loginState.ts` | Update (remove `apiKey` fallback check) |
| `src/components/Login/Login.svelte` | Update (stop extracting/storing `apiKey`) |
| `src/util/api/DashboardAPIService.ts` | Update (remove `apiKey` from API calls + checks) |
| `src/services/WebSocketService.ts` | Update (remove `apiKey` from auth) |
| `src/components/NavBar.svelte` | Update (remove `apiKey.set(null)` from logout) |

---

## Risks and Rollback

- **Users with only `apiKey` (no `accessToken`)**: Users who haven't logged in since Phase 1 deployed will be forced to re-login. This is expected and acceptable — they'll receive JWT tokens on their next login.
- **Old cached app versions**: If a user has a cached old version that still sends `apiKey`, the server will simply ignore the extra field. No breakage.
- **Rollback**: Phase 1 code supports both auth methods. Reverting Phase 2 changes restores dual-auth support.
- **LocalData prefix**: Not bumped. Orphaned `v3-apiKey` entries remain in localStorage but are harmless. Can be cleaned up in a future version bump if desired.
