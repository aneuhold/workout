# Google Authentication — Phase 1: Implementation

This document describes the plan for adding Google Sign-In and JWT-based authentication across the three repositories: **workout** (SvelteKit SPA), **gcloud-backend** (NestJS API), and **ts-libs** (shared types/services). The old auth system (API key + password) continues to work alongside the new system throughout this phase.

See also: [Phase 2: Deprecation of Old Auth](./google-auth-phase2-deprecation.md)

## Current State

- **Workout app**: Username/password login. Credentials sent to `POST /auth/validateUser`. Server returns a `User` object and `ApiKey`. The API key is stored in `localStorage` and sent in the body of every API POST request. WebSocket connections authenticate via `apiKey` in the handshake (`WebSocketHandshakeAuth`).
- **gcloud-backend**: No guards, no JWT, no Passport. API key validation is inline in each controller/gateway. Plaintext password comparison in `validateUser`.
- **ts-libs**: `User` document already has `auth.googleId` (nullable string), `auth.password` (nullable string), and an `email` field. `ApiKey` document stores a UUID key linked to a userId. All API communication goes through `GCloudAPIService.call()` which sends POST requests with JSON bodies.
- **Configuration**: The `ConfigService` in `be-ts-lib` loads environment-specific config from a private GitHub `config` repo (JSONC files). It currently holds `mongoRootUsername`, `mongoRootPassword`, `mongoUrl`, and `someKey`.

### Key Constraints

- The workout app uses `@sveltejs/adapter-static` (pure SPA, no SSR, no `hooks.server.ts`).
- The existing API key system is used by both the workout app and dashboard app for all CRUD operations and WebSocket auth.
- All API communication is centralized in `GCloudAPIService` in `core-ts-api-lib` — all requests are POST calls through `GCloudAPIService.call()`.

---

## Architecture Overview

```
                 Workout SPA (SvelteKit static)
                 ┌──────────────────────────────┐
                 │  1. User signs in via Google   │
                 │     button OR username/password │
                 │  2. SPA sends credentials to   │
                 │     NestJS via core-ts-api-lib  │
                 └──────────────┬───────────────┘
                                │
                   POST /auth/validateUser
                   { credential: "eyJ..." }  OR
                   { userName: "...", password: "..." }
                                │
                                ▼
                 NestJS API (gcloud-backend)
                 ┌──────────────────────────────┐
                 │  3. Verify identity (Google    │
                 │     token OR password)          │
                 │  4. Issue JWT access token +    │
                 │     refresh token               │
                 │  5. Store hashed refresh token  │
                 │  6. Return tokens + user info   │
                 └──────────────┬───────────────┘
                                │
                   Response: { accessToken, refreshToken,
                               userInfo: { user, apiKey } }
                                │
                                ▼
                 Workout SPA
                 ┌──────────────────────────────┐
                 │  7. Store tokens in localStorage│
                 │  8. Authorization: Bearer header│
                 │     on all API calls            │
                 │  9. Auto-refresh on 401         │
                 └──────────────────────────────┘
```

Both login flows (Google and password) go through `POST /auth/validateUser` and return the same response shape. The JWT/refresh token system is independent of how the user proves their identity — password-based users (e.g. test accounts) get the same JWT experience as Google users.

### Why This Approach

- **Client-side Google button**: Google Identity Services (GIS) SDK handles the consent flow entirely in the browser. Recommended approach for SPAs. The GIS script is loaded lazily only on the Login page.
- **JWT access + refresh tokens**: Short-lived access tokens (15 min) via `Authorization: Bearer` header. Longer-lived refresh tokens (7 days) with rotation. Only active tokens are stored server-side.
- **Account linking by email**: When a Google user signs in, the backend looks up by `auth.googleId`, then falls back to `email`. This links existing password-based accounts automatically.
- **ConfigService for secrets**: JWT secrets are stored in the existing ConfigService system (private GitHub `config` repo). The Google Client ID is a public value, hardcoded in `core-ts-api-lib`.

---

## Detailed Implementation Plan

### Step 1: ts-libs Changes (Shared Types and Services)

#### 1a. Extend `AuthValidateUserInput` and `AuthValidateUserOutput`

**File**: Update `packages/core-ts-api-lib/src/types/AuthValidateUser.ts`

Make the existing password fields optional and add a `credential` field for Google sign-in:

```typescript
export interface AuthValidateUserInput {
  /** The username of the user to be validated (password flow). */
  userName?: string;
  /** The password of the user to be validated (password flow). */
  password?: string;
  /** Google ID token received from Google Identity Services (Google flow). */
  credential?: string;
}

export interface AuthValidateUserOutput {
  userInfo?: {
    user: User;
    apiKey: ApiKey;
  };
  /** JWT access token for authenticating API requests. */
  accessToken?: string;
  /** Raw refresh token string for obtaining new access tokens. Not to be confused with the RefreshToken document type which stores the hashed server-side record. */
  refreshToken?: string;
  config?: {
    dashboard?: DashboardConfig;
  };
}
```

#### 1b. Add refresh token API types

**File**: `packages/core-ts-api-lib/src/types/AuthRefreshToken.ts` (new)

> **Naming note**: The field is named `refreshTokenString` to distinguish it from the `RefreshToken` *document* type in `core-ts-db-lib`. The document stores a SHA-256 hash and expiry — never the raw token value. By contrast, `refreshTokenString` is the raw opaque value sent to/from the client. The server hashes it to produce the `tokenHash` field stored on the `RefreshToken` document.

```typescript
export interface AuthRefreshTokenInput {
  /** The raw refresh token string to exchange for new tokens. */
  refreshTokenString: string;
}

export interface AuthRefreshTokenOutput {
  /** New JWT access token. */
  accessToken: string;
  /** New raw refresh token string (rotation — old one is deleted). */
  refreshTokenString: string;
}
```

#### 1c. Add JWT payload type

**File**: `packages/core-ts-api-lib/src/types/JwtPayload.ts` (new)

```typescript
export interface JwtPayload {
  /** The User document _id. */
  userId: string;
  /** The user's email address. */
  email: string;
  /** Issued-at timestamp (set automatically by jsonwebtoken). */
  iat?: number;
  /** Expiration timestamp (set automatically by jsonwebtoken). */
  exp?: number;
}
```

#### 1d. Update `WebSocketHandshakeAuth`

**File**: Update `packages/core-ts-api-lib/src/types/WebSocket.ts`

```typescript
export type WebSocketHandshakeAuth = {
  /** @deprecated Use accessToken instead. Kept for backward compatibility. */
  apiKey?: UUID;
  /** JWT access token for authenticating the WebSocket connection. */
  accessToken?: string;
};
```

#### 1e. Add `Authorization` header support to `GCloudAPIService`

**File**: Update `packages/core-ts-api-lib/src/services/GCloudAPIService/GCloudAPIService.ts`

Add a static `accessToken` field and include it in the `Authorization` header when set:

```typescript
export default class GCloudAPIService {
  static #accessToken: string | null = null;

  /** Sets the JWT access token to attach to all API requests. */
  static setAccessToken(token: string | null): void {
    this.#accessToken = token;
  }

  /** Gets the current access token. */
  static getAccessToken(): string | null {
    return this.#accessToken;
  }

  private static async call<TInput extends object, TOutput>(
    urlPath: string,
    input: TInput
  ): Promise<APIResponse<TOutput>> {
    const headers: Record<string, string> = {
      Connection: 'keep-alive',
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    if (this.#accessToken) {
      headers.Authorization = `Bearer ${this.#accessToken}`;
    }

    const response = await fetch(this.#baseUrl + urlPath, {
      method: 'POST',
      headers,
      body: JSON.stringify(input)
    });
    return this.decodeResponse<TOutput>(response);
  }
}
```

Also add `APIService` facade methods for `refreshToken()` and `setAccessToken()`.

#### 1f. Add refresh token document to `core-ts-db-lib`

**File**: `packages/core-ts-db-lib/src/documents/common/RefreshToken.ts` (new)

Follows the existing document composition pattern:

```typescript
const RefreshToken_docType = 'refreshToken';

export const RefreshTokenSchema = z.object({
  ...BaseDocumentWithTypeSchema.shape,
  ...RequiredUserIdSchema.shape,
  ...BaseDocumentWithUpdatedAndCreatedDatesSchema.shape,
  docType: z.literal(RefreshToken_docType).default(RefreshToken_docType),
  /** SHA-256 hash of the refresh token (never store the raw token). */
  tokenHash: z.string(),
  /** When this refresh token expires. */
  expiresAt: z.date()
});

export type RefreshToken = z.infer<typeof RefreshTokenSchema>;
```

**Only active tokens are stored.** One `RefreshToken` document per active device/session:
- **On rotation**: old document deleted, new one inserted
- **On logout**: document deleted
- **Theft detection**: if no matching `tokenHash` found, delete ALL documents for that `userId` (token was likely stolen and replayed after legitimate client rotated)
- **Expired token cleanup**: on any login or refresh, delete any documents for that `userId` where `expiresAt` has passed

A corresponding `RefreshTokenRepository` and `RefreshTokenValidator` are added in `be-ts-db-lib` following the existing patterns (see `UserRepository`/`UserValidator`). The validator takes `RefreshTokenSchema` and `RefreshTokenSchema.partial()`, with business logic validation for checking `tokenHash` uniqueness.

#### 1g. Hardcode Google Client ID in `core-ts-api-lib`

**File**: `packages/core-ts-api-lib/src/constants/googleClientId.ts` (new)

The Google Client ID is a public value (embedded in the frontend HTML), not a secret. Hardcode it as a constant in `core-ts-api-lib` so both the frontend and backend can import it:

```typescript
/** Google OAuth 2.0 Client ID. This is a public value, not a secret. */
export const GOOGLE_CLIENT_ID = '<client-id-from-google-console>';
```

Export from `browser.ts`.

#### 1h. Add JWT secrets to ConfigService

**File**: Update `packages/be-ts-lib/src/services/ConfigService/ConfigDefinition.ts`

Add `jwtAccessSecret` and `jwtRefreshSecret` to the `Config` interface. Then add the actual values to `local.jsonc`, `dev.jsonc`, and `prod.jsonc` in the private GitHub `config` repo.

### Step 2: gcloud-backend Changes

#### 2a. Install dependencies

```bash
pnpm add @nestjs/jwt google-auth-library
```

#### 2b. Create Google auth service

**File**: `src/routes/auth/GoogleAuth.service.ts` (new)

This NestJS injectable service:
1. Accepts a Google ID token (the `credential` string from the frontend)
2. Verifies it using `OAuth2Client.verifyIdToken()` with `GOOGLE_CLIENT_ID` (imported from `core-ts-api-lib`) as audience
3. Extracts the Google user ID (`sub`), email, and name from the verified token payload
4. **Account linking**: look up user by `auth.googleId` → fall back to `email` → create new user if neither match. When matched by email, sets `auth.googleId` on the existing user (linking the account).
5. Ensures an `ApiKey` exists for the user (find or create)

#### 2c. Create JWT/auth module

**File**: Update `src/routes/auth/Auth.module.ts`

Register `JwtModule` from `@nestjs/jwt` with `ConfigService.config.jwtAccessSecret` and `expiresIn: '15m'`. Register `GoogleAuthService` and `RefreshTokenService` as providers.

#### 2d. Create refresh token service

**File**: `src/routes/auth/RefreshToken.service.ts` (new)

Implements the refresh token lifecycle described in [1f](#1f-add-refresh-token-document-to-core-ts-db-lib): issuing, validating, rotating (delete old + insert new), theft detection, logout deletion, and expired token cleanup.

#### 2e. Update `validateUser` endpoint to handle both flows

**File**: Update `src/routes/auth/Auth.controller.ts`

```typescript
@Public()
@Post('validateUser')
async validateUser(
  @Body() body: AuthValidateUserInput
): Promise<APIResponse<AuthValidateUserOutput>> {
  let user: User;
  let apiKey: ApiKey;

  if (body.credential) {
    // Google sign-in flow
    ({ user, apiKey } = await googleAuthService.verifyAndFindOrCreateUser(body.credential));
  } else if (body.userName && body.password) {
    // Password flow (existing logic, unchanged)
    // ... existing password validation ...
  } else {
    // Neither flow — return error
  }

  // Both flows issue JWTs
  const accessToken = await jwtService.signAsync({ userId: user._id, email: user.email });
  const refreshToken = await refreshTokenService.issueRefreshToken(user._id);

  return {
    success: true,
    errors: [],
    data: { userInfo: { user, apiKey }, accessToken, refreshToken }
  };
}
```

#### 2f. Add refresh and logout endpoints

**File**: Update `src/routes/auth/Auth.controller.ts`

- `POST /auth/refresh` — validates and rotates the refresh token, returns new `accessToken` + `refreshTokenString`
- `POST /auth/logout` — deletes the refresh token for that session

Both endpoints should have the same `@Throttle({ default: { limit: 10, ttl: 60000 } })` decorator as the existing `validateUser` endpoint.

#### 2g. Create an auth guard

**File**: `src/common/guards/Auth.guard.ts` (new)

A `CanActivate` guard that:
1. Skips auth for `@Public()` endpoints (via `Reflector`)
2. Verifies JWT from `Authorization: Bearer` header
3. Attaches decoded `JwtPayload` to `request.user`
4. Falls back to `apiKey` in request body (legacy support during migration)
5. Throws `UnauthorizedException` if neither is valid

**File**: `src/common/decorators/Public.decorator.ts` (new) — `SetMetadata`-based decorator.

#### 2h. Register the auth guard globally

**File**: Update `src/routes/App.module.ts` — register `AuthGuard` via `APP_GUARD`.

#### 2i. Mark public endpoints

Add `@Public()` to: `POST /auth/validateUser`, `POST /auth/refresh`, `POST /auth/checkPassword`, `GET /`. Note: `POST /auth/logout` is NOT public — it requires a valid JWT so the server knows which user's token to delete.

#### 2j. Update WebSocket gateways

The existing gateways authenticate via middleware registered in `afterInit()`. Update that middleware to accept `accessToken` alongside the existing `apiKey`. The JWT is verified once at connection time — the connection is trusted for its lifetime:

```typescript
afterInit(socketServer: Server) {
  socketServer.use(async (socket, next) => {
    const { accessToken, apiKey } = socket.handshake.auth as WebSocketHandshakeAuth;

    if (accessToken) {
      const payload = await jwtService.verifyAsync(accessToken);
      socket.data.userId = payload.userId;
    } else if (apiKey) {
      // Legacy: look up by API key (backward compat)
      const apiKeyDoc = await ApiKeyRepository.getRepo().get({ key: apiKey });
      socket.data.userId = apiKeyDoc?.userId;
    }

    if (!socket.data.userId) {
      return next(new Error('Unauthorized'));
    }
    next();
  });
}
```

### Step 3: Workout App Changes

#### 3a. Install types and create Google GIS loader

```bash
pnpm add -D @types/google.accounts
```

**File**: `src/util/auth/loadGoogleGIS.ts` (new)

A small utility that dynamically loads the Google Identity Services script on demand. Returns `google.accounts` API. Caches the load promise so subsequent calls are instant.

#### 3b. Update the Login component

**File**: Update `src/components/Login/Login.svelte`

Add a Google Sign-In button alongside the existing username/password form:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { loadGoogleGIS } from '$util/auth/loadGoogleGIS';

  let googleButtonRef: HTMLDivElement;

  onMount(async () => {
    const accounts = await loadGoogleGIS();
    accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID, // hardcoded constant in core-ts-api-lib
      callback: handleGoogleCallback
    });
    accounts.id.renderButton(googleButtonRef, {
      theme: 'outline',
      size: 'large',
      width: 384 // match card width
    });
  });

  async function handleGoogleCallback(response: google.accounts.id.CredentialResponse) {
    loginState.set(LoginState.ProcessingCredentials);
    const result = await APIService.validateUser({ credential: response.credential });
    handleLoginResult(result);
  }
</script>

<!-- Existing username/password form stays -->

<div class="flex items-center gap-4">
  <Separator class="flex-1" />
  <span class="text-muted-foreground text-sm">or</span>
  <Separator class="flex-1" />
</div>

<div bind:this={googleButtonRef}></div>
```

#### 3c. Update auth state management

**File**: Update `src/stores/local/userConfig/userConfig.ts`

Add `accessToken` and `refreshToken` fields to `UserConfig`. When tokens are stored, call `APIService.setAccessToken(token)` so all subsequent API calls include the Bearer header.

**File**: Update `src/stores/session/loginState.ts`

Update the initialization check to consider the user logged in if either `accessToken` or `apiKey` exists in `userConfig` (supporting both old and new auth during migration).

#### 3d. Add token refresh logic

**File**: Update `GCloudAPIService` in `core-ts-api-lib`

Add a 401 interceptor via an `onUnauthorized` callback. The workout app's `WorkoutAPIService` already processes API requests sequentially through its queue, so only one request can encounter a 401 at a time — the refresh happens inline within that request's `call()`, and the queue doesn't advance until it completes. No mutex is needed.

The workout app sets the callback at startup:

```typescript
GCloudAPIService.setOnUnauthorized(async () => {
  const refreshResult = await APIService.refreshToken({
    refreshTokenString: userConfig.refreshToken
  });
  if (refreshResult.success) {
    APIService.setAccessToken(refreshResult.data.accessToken);
    userConfig.update({ refreshToken: refreshResult.data.refreshTokenString });
    return true;
  }
  logout();
  return false;
});
```

#### 3e. Update WebSocket connection

Pass `accessToken` in the handshake instead of `apiKey`.

#### 3f. Update logout flow

On logout:
1. Call `POST /auth/logout` to delete the refresh token server-side
2. Clear `accessToken` and `refreshToken` from userConfig
3. Call `APIService.setAccessToken(null)`
4. Call `google.accounts.id.disableAutoSelect()` to prevent auto-sign-in on next visit

---

> **Next**: Once Phase 1 is deployed and verified, proceed to [Phase 2: Deprecation of Old Auth](./google-auth-phase2-deprecation.md).

---

## Security Considerations

### Token Storage

Store both tokens in `localStorage`. This matches the current security posture (API key is already in `localStorage`). The short-lived access token (15 min) and server-side refresh token deletion on rotation/logout limit exposure.

### Refresh Token Security

- **Hashed storage**: Only SHA-256 hashes stored in the database — a breach doesn't expose usable tokens
- **Active tokens only**: Old tokens are deleted on rotation/logout, not accumulated
- **Theft detection**: Unrecognized token → delete ALL tokens for that user → logged out everywhere
- **Expiry**: 7 days, cleaned up lazily on next authentication

### CSRF Protection

`Authorization: Bearer` headers (not cookies) means CSRF is inherently mitigated.

### Google Token Validation

The `google-auth-library` verifies JWT signature, audience, expiration, and issuer against Google's public keys.

### Rate Limiting

The existing throttle on the auth controller (10 requests per minute) applies to `validateUser` and `refresh`.

---

## Deploy Order

1. **ts-libs** (Step 1) — new types + Bearer header support. No breaking changes.
2. **gcloud-backend** (Step 2) — updated `validateUser` + auth guard with API key fallback.
3. **workout app** (Step 3) — Google Sign-In button + token management.
4. **Test end-to-end** — verify both Google and password login flows.

---

## Google Cloud Console Setup Checklist

1. Go to [Google Cloud Console](https://console.cloud.google.com/) > select/create project
2. Go to APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
3. Application type: "Web application", name: "MesoPro Workout App"
4. Authorized JavaScript origins: `http://localhost:5173`, `https://mesopro.tonyneuhold.com`
5. No redirect URIs needed (client-side flow)
6. Copy the Client ID into `core-ts-api-lib/src/constants/googleClientId.ts`
7. Configure OAuth consent screen: External, scopes `email`/`profile`/`openid`, add test users

---

## Files Changed Summary

### ts-libs (`core-ts-api-lib`)

| File | Action |
|------|--------|
| `src/types/AuthValidateUser.ts` | Update (add `credential` to input, add `accessToken`/`refreshToken` to output) |
| `src/types/AuthRefreshToken.ts` | Create |
| `src/types/JwtPayload.ts` | Create |
| `src/types/WebSocket.ts` | Update (`WebSocketHandshakeAuth` adds `accessToken`) |
| `src/services/GCloudAPIService/GCloudAPIService.ts` | Update (add Bearer header, `setAccessToken`, `onUnauthorized`) |
| `src/services/APIService/APIService.ts` | Update (add `refreshToken`, `setAccessToken`) |
| `src/constants/googleClientId.ts` | Create (hardcoded public Google Client ID) |
| `src/browser.ts` | Update (export new types + `GOOGLE_CLIENT_ID`) |

### ts-libs (`core-ts-db-lib`)

| File | Action |
|------|--------|
| `src/documents/common/RefreshToken.ts` | Create (Zod schema for hashed refresh tokens) |
| `src/browser.ts` | Update (export `RefreshTokenSchema`, `RefreshToken` type) |

### ts-libs (`be-ts-db-lib`)

| File | Action |
|------|--------|
| `src/repositories/common/RefreshTokenRepository.ts` | Create (MongoDB repository) |
| `src/validators/common/RefreshTokenValidator.ts` | Create (Zod + business logic validation) |
| `src/index.ts` | Update (export `RefreshTokenRepository`) |

### ts-libs (`be-ts-lib`)

| File | Action |
|------|--------|
| `src/services/ConfigService/ConfigDefinition.ts` | Update (add `jwtAccessSecret`, `jwtRefreshSecret`) |

### gcloud-backend

| File | Action |
|------|--------|
| `package.json` | Update (add `@nestjs/jwt`, `google-auth-library`) |
| `src/routes/auth/Auth.module.ts` | Update (register `JwtModule`, add providers) |
| `src/routes/auth/Auth.controller.ts` | Update (extend `validateUser`, add `refresh`/`logout` endpoints) |
| `src/routes/auth/GoogleAuth.service.ts` | Create (verify Google token, find/create/link user) |
| `src/routes/auth/RefreshToken.service.ts` | Create (issue, validate, rotate, delete refresh tokens) |
| `src/routes/App.module.ts` | Update (register global `AuthGuard`) |
| `src/common/guards/Auth.guard.ts` | Create |
| `src/common/decorators/Public.decorator.ts` | Create |
| WebSocket gateways | Update (accept `accessToken` in handshake) |

### workout

| File | Action |
|------|--------|
| `package.json` | Update (add `@types/google.accounts` dev dep) |
| `src/util/auth/loadGoogleGIS.ts` | Create (dynamic script loader) |
| `src/components/Login/Login.svelte` | Update (add Google Sign-In button) |
| `src/stores/local/userConfig/userConfig.ts` | Update (add `accessToken`, `refreshToken`) |
| `src/stores/session/loginState.ts` | Update (check `accessToken` OR `apiKey` for logged-in state) |
| WebSocket connection setup | Update (use `accessToken` in handshake) |
| Logout logic | Update (delete refresh token, clear tokens) |

### GitHub `config` repo

| File | Action |
|------|--------|
| `local.jsonc`, `dev.jsonc`, `prod.jsonc` | Update (add `jwtAccessSecret`, `jwtRefreshSecret`) |

---

## Sources

- [NestJS Authentication Documentation](https://docs.nestjs.com/security/authentication)
- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Verify Google ID Tokens](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [The Copenhagen Book — Web Auth Reference](https://thecopenhagenbook.com/)
- [Updates to GIS and FedCM Migration](https://developers.googleblog.com/en/updates-to-google-identity-services-gis-and-migration-to-the-credential-manager-api/)
