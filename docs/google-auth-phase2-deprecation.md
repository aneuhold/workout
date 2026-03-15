# Google Authentication — Phase 2: Deprecation of Old Auth

This document describes the plan for removing the legacy API key system after Phase 1 (Google Sign-In + JWT) has been deployed and verified in production. Password-based login is kept for test accounts but moves to JWT auth.

See also: [Phase 1: Implementation](./google-auth-plan.md)

## Prerequisites

- Phase 1 is fully deployed and verified across all three repos
- The dashboard app (if still in use) has also been updated to use JWT auth

---

## Deprecation Plan

### Step 1: ts-libs Changes

#### 1a. Remove `apiKey` from `WebSocketHandshakeAuth`

**File**: Update `packages/core-ts-api-lib/src/types/WebSocket.ts` — remove deprecated `apiKey`, keep only `accessToken`.

#### 1b. Remove `apiKey` from API input types

Update `ProjectWorkoutPrimaryInput`, `ProjectDashboardInput`, etc. The `AuthGuard` handles auth via the `Authorization` header now.

#### 1c. Remove `ApiKey` document (optional)

Remove `ApiKey` from `core-ts-db-lib`, `ApiKeyRepository` from `be-ts-db-lib`, and `apiKey` from `AuthValidateUserOutput.userInfo` — only if the dashboard and all other consumers have been migrated.

### Step 2: gcloud-backend Changes

#### 2a. Remove legacy API key fallback from `AuthGuard`

Remove the fallback that checks for `apiKey` in the request body (Phase 1 step 2g item 4). The guard now only accepts JWT `Authorization: Bearer` headers.

#### 2b. Remove `POST /auth/checkPassword`

Delete the `checkPassword` endpoint entirely.

#### 2c. Remove legacy API key fallback from WebSocket gateways

Remove the `else if (apiKey)` branch. Only `accessToken` JWT verification remains.

#### 2d. Hash stored passwords (optional)

If keeping password-based login for test accounts, migrate from plaintext password comparison to bcrypt hashing. This is independent of the API key removal but is a good security improvement to bundle in.

### Step 3: Workout App Changes

#### 3a. Remove `apiKey` from user config

**File**: Update `src/stores/local/userConfig/userConfig.ts` — remove `apiKey`. Only `accessToken` and `refreshToken` are used.

#### 3b. Remove API key from request bodies

Remove any remaining code that includes `apiKey` in API call bodies.

> **Note**: The username/password login form and password flow in `validateUser` are **kept** for test accounts that don't have a Google account. Both flows already issue JWTs in Phase 1, so no additional work is needed — the password flow just continues to work as-is without API keys.

---

## Files Changed Summary

### ts-libs (`core-ts-api-lib`)

| File | Action |
|------|--------|
| `src/types/WebSocket.ts` | Update (remove `apiKey`) |
| Input types (`ProjectWorkoutPrimaryInput`, etc.) | Update (remove `apiKey`) |

### ts-libs (`core-ts-db-lib`) — optional

| File | Action |
|------|--------|
| `src/documents/common/ApiKey.ts` | Delete (if no consumers remain) |

### ts-libs (`be-ts-db-lib`) — optional

| File | Action |
|------|--------|
| `src/repositories/ApiKeyRepository.ts` | Delete (if no consumers remain) |

### gcloud-backend

| File | Action |
|------|--------|
| `src/common/guards/Auth.guard.ts` | Update (remove API key fallback) |
| `src/routes/auth/Auth.controller.ts` | Update (remove `checkPassword` endpoint) |
| WebSocket gateways | Update (remove `apiKey` fallback) |

### workout

| File | Action |
|------|--------|
| `src/stores/local/userConfig/userConfig.ts` | Update (remove `apiKey`) |
| API call sites | Update (remove `apiKey` from request bodies) |

---

## Risks and Rollback

- **Dashboard app**: Ensure it has been migrated before removing API key support. If not, defer steps 1b, 1c, 2a, and 2c.
- **Rollback**: Phase 1 code supports both auth methods. Reverting Phase 2 changes restores dual-auth support.
