# Google Authentication — Phase 2: Deprecation of Old Auth

This document describes the plan for removing the legacy authentication system (API key + password) after Phase 1 (Google Sign-In + JWT) has been deployed and verified in production.

See also: [Phase 1: Implementation](./google-auth-plan.md)

## Prerequisites

Before starting Phase 2:

- Phase 1 is fully deployed across all three repos (ts-libs, gcloud-backend, workout)
- Google Sign-In and JWT auth have been verified working in production
- All active users have successfully logged in with the new system at least once (or have been notified of the migration)
- The dashboard app (if still in use) has also been updated to use JWT auth

---

## Detailed Deprecation Plan

### Step 1: ts-libs Changes

#### 1a. Remove `apiKey` from `WebSocketHandshakeAuth`

**File**: Update `packages/core-ts-api-lib/src/types/WebSocket.ts`

Remove the deprecated `apiKey` field so only `accessToken` remains:

```typescript
export type WebSocketHandshakeAuth = {
  /** JWT access token for authenticating the WebSocket connection. */
  accessToken: string;
};
```

#### 1b. Remove `apiKey` from API input types

**Files**: Update `ProjectWorkoutPrimaryInput`, `ProjectDashboardInput`, and any other input types that carry an `apiKey` field.

Remove the `apiKey` field from these types. The `AuthGuard` (JWT-based) now handles authentication via the `Authorization` header, so individual endpoints no longer need the API key in the request body.

#### 1c. Remove `ApiKey` document (optional)

If API keys are no longer used anywhere:

- Remove `ApiKey` document type from `core-ts-db-lib`
- Remove `ApiKeyRepository` from `be-ts-db-lib`
- Remove the `apiKey` field from `AuthValidateUserOutput.userInfo`

> **Note**: Only do this if the dashboard app and any other consumers have also been migrated. If the dashboard still uses API keys, defer this step.

#### 1d. Remove password fields from `AuthValidateUserInput`

**File**: Update `packages/core-ts-api-lib/src/types/AuthValidateUser.ts`

Remove `userName` and `password` fields, leaving only `credential`:

```typescript
export interface AuthValidateUserInput {
  /** Google ID token received from Google Identity Services. */
  credential: string;
}
```

### Step 2: gcloud-backend Changes

#### 2a. Remove legacy API key fallback from `AuthGuard`

**File**: Update `src/common/guards/Auth.guard.ts`

Remove the fallback that checks for `apiKey` in the request body (added in Phase 1 step 2g item 5). The guard should now only accept JWT `Authorization: Bearer` headers.

#### 2b. Remove password validation from `validateUser`

**File**: Update `src/routes/auth/Auth.controller.ts`

Remove the `else if (body.userName && body.password)` branch from the `validateUser` endpoint. Only the Google credential flow remains.

#### 2c. Remove `POST /auth/checkPassword`

**File**: Update `src/routes/auth/Auth.controller.ts`

Delete the `checkPassword` endpoint entirely.

#### 2d. Remove legacy API key fallback from WebSocket gateways

**File**: Update WebSocket gateway `handleConnection` methods

Remove the `else if (apiKey)` fallback branch. Only `accessToken` JWT verification remains.

#### 2e. Remove `auth.password` from User documents (optional)

If password-based login is fully removed:

- Remove `auth.password` from the `User` document schema in `core-ts-db-lib`
- Optionally run a migration script to unset the `auth.password` field on all existing User documents in the database

### Step 3: Workout App Changes

#### 3a. Remove password login form

**File**: Update `src/components/Login/Login.svelte`

Remove the username/password form fields and the "or" separator. Only the Google Sign-In button remains.

#### 3b. Remove `apiKey` from user config

**File**: Update `src/stores/local/userConfig/userConfig.ts`

Remove the `apiKey` field from `UserConfig`. Only `accessToken` and `refreshToken` are used for auth.

#### 3c. Remove API key from request bodies

Remove any remaining code that includes `apiKey` in API call bodies, since authentication is now handled via the `Authorization` header.

---

## Files Changed Summary

### ts-libs (`core-ts-api-lib`)

| File | Action |
|------|--------|
| `src/types/WebSocket.ts` | Update (remove `apiKey` from `WebSocketHandshakeAuth`) |
| `src/types/AuthValidateUser.ts` | Update (remove `userName`, `password` fields from input) |
| Input types (`ProjectWorkoutPrimaryInput`, etc.) | Update (remove `apiKey` field) |
| Barrel exports | Update as needed |

### ts-libs (`core-ts-db-lib`) — optional

| File | Action |
|------|--------|
| `src/documents/common/ApiKey.ts` | Delete (if no consumers remain) |
| `src/documents/common/User.ts` | Update (remove `auth.password`) |

### ts-libs (`be-ts-db-lib`) — optional

| File | Action |
|------|--------|
| `src/repositories/ApiKeyRepository.ts` | Delete (if no consumers remain) |

### gcloud-backend

| File | Action |
|------|--------|
| `src/common/guards/Auth.guard.ts` | Update (remove API key fallback) |
| `src/routes/auth/Auth.controller.ts` | Update (remove password flow, remove `checkPassword` endpoint) |
| WebSocket gateways | Update (remove `apiKey` fallback) |

### workout

| File | Action |
|------|--------|
| `src/components/Login/Login.svelte` | Update (remove password form) |
| `src/stores/local/userConfig/userConfig.ts` | Update (remove `apiKey`) |
| API call sites | Update (remove `apiKey` from request bodies) |

---

## Risks and Rollback

- **Dashboard app**: Ensure the dashboard app has been migrated to JWT auth before removing API key support. If it hasn't, defer steps 1b, 1c, 2a, and 2d.
- **Rollback**: If issues are discovered, the Phase 1 code supports both auth methods. Reverting Phase 2 changes restores dual-auth support.
- **Database migration**: Removing `auth.password` from User documents is a one-way operation. Take a database backup before running any migration script.
