# Google Authentication — Phase 1: Implementation

This document describes the plan for adding Google Sign-In authentication across the three repositories: **workout** (SvelteKit SPA), **gcloud-backend** (NestJS API), and **ts-libs** (shared types/services). The old auth system (API key + password) continues to work alongside the new system throughout this phase.

See also: [Phase 2: Deprecation of Old Auth](./google-auth-phase2-deprecation.md)

## Current State

### Authentication Today

- **Workout app**: Username/password login. Credentials sent to `POST /auth/validateUser`. Server returns a `User` object and `ApiKey`. The API key is stored in `localStorage` and sent in the body of every API POST request. WebSocket connections authenticate via `apiKey` in the handshake (`WebSocketHandshakeAuth`).
- **gcloud-backend**: No guards, no JWT, no Passport. API key validation is inline in each controller/gateway. Plaintext password comparison in `validateUser`.
- **ts-libs**: `User` document already has `auth.googleId` (nullable string), `auth.password` (nullable string), and an `email` field. `ApiKey` document stores a UUID key linked to a userId. All API communication goes through `GCloudAPIService.call()` which sends POST requests with JSON bodies.
- **Configuration**: The `ConfigService` in `be-ts-lib` loads environment-specific config from a private GitHub `config` repo (JSONC files). It currently holds `mongoRootUsername`, `mongoRootPassword`, `mongoUrl`, and `someKey`. The `Config` interface defines the shape.

### Key Constraints

- The workout app uses `@sveltejs/adapter-static` (pure SPA, no SSR, no `hooks.server.ts`).
- The existing API key system is used by both the workout app and dashboard app for all CRUD operations and WebSocket auth.
- All API communication is centralized in `GCloudAPIService` in `core-ts-api-lib` -- all requests are POST calls through `GCloudAPIService.call()`.
- CORS is already configured for `mesopro.tonyneuhold.com`, `dashboard.tonyneuhold.com`, and `localhost:5173`.

---

## Architecture Overview

```
                 Workout SPA (SvelteKit static)
                 ┌──────────────────────────────┐
                 │                              │
                 │  1. Dynamic-load Google GIS   │
                 │     script on Login page      │
                 │     (@types/google.accounts)  │
                 │                              │
                 │  2. User clicks "Sign in      │
                 │     with Google", gets an      │
                 │     ID token from Google       │
                 │                              │
                 │  3. SPA sends ID token to      │
                 │     NestJS via core-ts-api-lib │
                 │                              │
                 └──────────────┬───────────────┘
                                │
                    POST /auth/validateUser
                    { credential: "eyJ..." }
                                │
                                ▼
                 NestJS API (gcloud-backend)
                 ┌──────────────────────────────┐
                 │                              │
                 │  4. Verify Google ID token     │
                 │     via google-auth-library    │
                 │                              │
                 │  5. Find User by email or      │
                 │     auth.googleId, or create   │
                 │     new User (account linking)  │
                 │                              │
                 │  6. Sign JWT access token +     │
                 │     refresh token               │
                 │                              │
                 │  7. Store hashed refresh token   │
                 │     in database                 │
                 │                              │
                 │  8. Return tokens + user info    │
                 │                              │
                 └──────────────┬───────────────┘
                                │
                    Response: { accessToken, refreshToken,
                                userInfo: { user, apiKey } }
                                │
                                ▼
                 Workout SPA
                 ┌──────────────────────────────┐
                 │                              │
                 │  9. Store tokens in            │
                 │     localStorage               │
                 │                              │
                 │  10. GCloudAPIService sends     │
                 │      Authorization: Bearer      │
                 │      header on all API calls    │
                 │                              │
                 │  11. WebSocket handshake uses   │
                 │      accessToken instead of     │
                 │      apiKey                     │
                 │                              │
                 │  12. Auto-refresh on 401         │
                 │                              │
                 └──────────────────────────────┘
```

### Why This Approach

- **Client-side Google button**: No server redirects needed. Google Identity Services (GIS) SDK handles the consent flow entirely in the browser and returns an ID token. This is the recommended approach for SPAs.
- **Dynamic script loading**: The GIS script is loaded lazily only on the Login page (not on every page load) using a small utility function. Type safety provided by `@types/google.accounts`.
- **Backend token verification**: The NestJS backend validates the Google ID token using `google-auth-library`. This checks JWT signature against Google's public keys, verifies audience, expiration, and issuer.
- **JWT access + refresh tokens**: Short-lived access tokens (15 min) sent via `Authorization: Bearer` header. Longer-lived refresh tokens (7 days) with rotation and server-side deletion via hashed storage in the database. Only active tokens are stored.
- **Account linking by email**: When a Google user signs in, the backend first looks up by `auth.googleId`, then falls back to matching by `email`. This links existing password-based accounts to Google automatically.
- **WebSocket uses JWT**: The `WebSocketHandshakeAuth` type is updated to accept an `accessToken` instead of `apiKey`, unifying auth across HTTP and WebSocket.
- **ConfigService for secrets**: Google Client ID and JWT secrets are stored in the existing ConfigService system (private GitHub `config` repo) rather than `.env` files, keeping configuration centralized.

---

## Detailed Implementation Plan

### Step 1: ts-libs Changes (Shared Types and Services)

#### 1a. Extend `AuthValidateUserInput` and `AuthValidateUserOutput`

**File**: Update `packages/core-ts-api-lib/src/types/AuthValidateUser.ts`

Make the existing password fields optional and add a `credential` field for Google sign-in. The same type and endpoint handle both flows -- the backend determines which flow based on which fields are present:

```typescript
export interface AuthValidateUserInput {
  /** The username of the user to be validated (password flow). */
  userName?: string;
  /** The password of the user to be validated (password flow). */
  password?: string;
  /** Google ID token received from Google Identity Services (Google flow). */
  credential?: string;
}
```

Add `accessToken` and `refreshToken` to the output:

```typescript
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

Both the password flow and the Google flow use `POST /auth/validateUser` and return the same shape. No new endpoint or input type needed.

#### 1b. Add refresh token types

**File**: `packages/core-ts-api-lib/src/types/AuthRefreshToken.ts` (new)

> **Naming note**: The field is named `refreshTokenString` to distinguish it from the `RefreshToken` *document* type in `core-ts-db-lib`. The document represents a server-side database record (storing a SHA-256 hash and expiry — never the raw token value). By contrast, `refreshTokenString` is the raw opaque value sent to/from the client. The server hashes it to produce the `tokenHash` field stored on the `RefreshToken` document.

```typescript
/**
 * Interface representing the input to the token refresh endpoint.
 */
export interface AuthRefreshTokenInput {
  /** The raw refresh token string to exchange for new tokens. */
  refreshTokenString: string;
}

/**
 * Interface representing the output of the token refresh endpoint.
 */
export interface AuthRefreshTokenOutput {
  /** New JWT access token. */
  accessToken: string;
  /** New raw refresh token string (rotation -- old one is invalidated). */
  refreshTokenString: string;
}
```

#### 1c. Add JWT payload type

**File**: `packages/core-ts-api-lib/src/types/JwtPayload.ts` (new)

```typescript
/**
 * The decoded payload of a JWT access token issued by the backend.
 */
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

During migration, WebSocket gateways accept either field. Once migration is complete, `apiKey` is removed.

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

Also add `APIService` facade methods:

```typescript
// APIService.ts
static async refreshToken(input: AuthRefreshTokenInput): Promise<APIResponse<AuthRefreshTokenOutput>> {
  return GCloudAPIService.authRefreshToken(input);
}

static setAccessToken(token: string | null): void {
  GCloudAPIService.setAccessToken(token);
}
```

The existing `APIService.validateUser()` already delegates to `GCloudAPIService.authValidateUser()` -- no changes needed there since the input type is the same (just with new optional fields).

#### 1f. Add refresh token document to `core-ts-db-lib`

**File**: `packages/core-ts-db-lib/src/documents/common/RefreshToken.ts` (new)

Follows the existing document composition pattern (see `WorkoutSession`, `WorkoutExercise`, etc.):

```typescript
const RefreshToken_docType = 'RefreshToken';

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

> **How `refreshTokenString` relates to `tokenHash`**: When the server issues a refresh token, it generates a cryptographically random string (the `refreshTokenString` sent to the client) and stores only its SHA-256 hash as `tokenHash` in the `RefreshToken` document. On each refresh request, the server hashes the incoming `refreshTokenString` and looks up the matching `tokenHash`. This means a database breach never exposes usable token values.

**Only active tokens are stored.** The collection contains one `RefreshToken` document per active device/session. There is no `revoked` field — tokens are deleted rather than marked:
- **On rotation**: the old document is deleted and a new one is inserted
- **On logout**: the document for that session is deleted
- **Theft detection**: if an unrecognized token is presented (no matching `tokenHash` found), delete ALL `RefreshToken` documents for that `userId` — this logs the user out everywhere, because the token was likely stolen and replayed after the legitimate client already rotated it
- **Expired token cleanup**: when a user authenticates (login or refresh), delete any of their `RefreshToken` documents where `expiresAt` has passed — this cleans up abandoned sessions (e.g. the user uninstalled the app on a device without logging out)

This keeps the collection small — bounded to the number of active devices per user (typically 2-3).

A corresponding `RefreshTokenRepository` is added in `be-ts-db-lib` following the existing repository pattern.

#### 1g. Add `googleClientId`, `jwtAccessSecret`, `jwtRefreshSecret` to ConfigService

**File**: Update `packages/be-ts-lib/src/services/ConfigService/ConfigDefinition.ts`

```typescript
export default interface Config {
  someKey: string;
  mongoRootUsername: string;
  mongoRootPassword: string;
  mongoUrl: string;
  /** Google OAuth 2.0 Client ID for verifying Google ID tokens. */
  googleClientId: string;
  /** Secret key for signing JWT access tokens. */
  jwtAccessSecret: string;
  /** Secret key for signing JWT refresh tokens (separate from access secret). */
  jwtRefreshSecret: string;
}
```

Then add the actual values to `local.jsonc`, `dev.jsonc`, and `prod.jsonc` in the private GitHub `config` repo.

### Step 2: gcloud-backend Changes

#### 2a. Install dependencies

```bash
pnpm add @nestjs/jwt google-auth-library
```

- `@nestjs/jwt` -- NestJS wrapper around `jsonwebtoken` for signing/verifying JWTs.
- `google-auth-library` -- Google's official library for verifying ID tokens server-side.

#### 2b. Create Google auth service

**File**: `src/routes/auth/GoogleAuth.service.ts` (new)

This NestJS injectable service:
1. Accepts a Google ID token (the `credential` string from the frontend)
2. Verifies it using `OAuth2Client.verifyIdToken()` with `ConfigService.config.googleClientId` as audience
3. Extracts the Google user ID (`sub`), email, and name from the verified token payload
4. **Account linking logic**:
   - First, look up user by `auth.googleId` -- if found, return that user
   - If not found, look up user by `email` -- if found, set `auth.googleId` on that user (linking the account) and return
   - If neither found, create a new `User` with `auth.googleId`, `email`, and a username derived from the Google profile name
5. Ensures an `ApiKey` exists for the user (find or create)
6. Returns the `User` and `ApiKey`

#### 2c. Create JWT/auth module

**File**: Update `src/routes/auth/Auth.module.ts`

Register `JwtModule` from `@nestjs/jwt`:

```typescript
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@aneuhold/be-ts-lib';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: ConfigService.config.jwtAccessSecret,
      signOptions: { expiresIn: '15m' }
    })
  ],
  controllers: [AuthController],
  providers: [GoogleAuthService]
})
export class AuthModule {}
```

#### 2d. Create refresh token service

**File**: `src/routes/auth/RefreshToken.service.ts` (new)

This service handles:
1. **Issuing refresh tokens**: Generate a cryptographically random token, hash it with SHA-256, store the hash + userId + expiresAt in the `RefreshToken` collection, return the raw token (`refreshTokenString`) to the client
2. **Validating refresh tokens**: Hash the incoming `refreshTokenString`, look it up in the database by `tokenHash`, check `expiresAt`
3. **Rotating refresh tokens**: On successful refresh, delete the old `RefreshToken` document and insert a new one
4. **Theft detection**: If no matching `tokenHash` is found for the user, delete ALL `RefreshToken` documents for that `userId` (the token was likely stolen and replayed after the legitimate client already rotated)
5. **Deleting on logout**: Delete the `RefreshToken` document for that session
6. **Expired token cleanup**: On any authentication attempt (login or refresh), delete any `RefreshToken` documents for that `userId` where `expiresAt` has passed

#### 2e. Update `validateUser` endpoint to handle both flows

**File**: Update `src/routes/auth/Auth.controller.ts`

The existing `POST /auth/validateUser` endpoint is updated to detect which auth flow based on the input fields:

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
    // 1. GoogleAuthService.verifyAndFindOrCreateUser(body.credential)
    //    → verifies token, finds/creates/links user, ensures ApiKey
    //    → returns { user, apiKey }
    ({ user, apiKey } = await googleAuthService.verifyAndFindOrCreateUser(body.credential));
  } else if (body.userName && body.password) {
    // Password flow (existing logic, unchanged)
    // ... existing password validation ...
  } else {
    // Neither flow — return error
  }

  // Both flows now issue JWTs
  const accessToken = await jwtService.signAsync({ userId: user._id, email: user.email });
  const refreshToken = await refreshTokenService.issueRefreshToken(user._id);

  return {
    success: true,
    errors: [],
    data: { userInfo: { user, apiKey }, accessToken, refreshToken }
  };
}
```

#### 2f. Add refresh endpoint

**File**: Update `src/routes/auth/Auth.controller.ts`

```typescript
@Public()
@Post('refresh')
async refreshToken(
  @Body() body: AuthRefreshTokenInput
): Promise<APIResponse<AuthRefreshTokenOutput>> {
  // 1. RefreshTokenService.validateAndRotate(body.refreshTokenString)
  //    → hashes the string, looks up matching tokenHash in DB
  //    → deletes old RefreshToken document, inserts new one
  //    → if no match found, deletes ALL tokens for user (theft detection)
  //    → returns { userId, newRefreshTokenString }
  // 2. Look up user to ensure they still exist
  // 3. JwtService.signAsync({ userId, email })
  //    → returns new accessToken
  // 4. Return { accessToken, refreshTokenString: newRefreshTokenString }
}
```

#### 2g. Create an auth guard

**File**: `src/common/guards/Auth.guard.ts` (new)

A `CanActivate` guard that:
1. Checks for `@Public()` decorator via `Reflector` -- if present, skips auth
2. Extracts the JWT from the `Authorization: Bearer <token>` header
3. Verifies the JWT using `JwtService.verifyAsync()` with `ConfigService.config.jwtAccessSecret`
4. Attaches the decoded `JwtPayload` to `request.user`
5. Falls back to checking `apiKey` in the request body (legacy support during migration)
6. Throws `UnauthorizedException` if neither is valid

**File**: `src/common/decorators/Public.decorator.ts` (new)

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks an endpoint as publicly accessible (no auth guard). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

#### 2h. Register the auth guard globally

**File**: Update `src/routes/App.module.ts`

```typescript
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '../common/guards/Auth.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ]
})
```

#### 2i. Mark public endpoints

Add `@Public()` to:
- `POST /auth/validateUser` (handles both password and Google flows)
- `POST /auth/refresh` (new token refresh)
- `POST /auth/checkPassword` (existing, kept during migration)
- `GET /` (health check / hello world)

#### 2j. Update WebSocket gateways

Update the workout and dashboard WebSocket gateways to accept `accessToken` in the handshake alongside the existing `apiKey`:

```typescript
// In the handleConnection method:
const { accessToken, apiKey } = client.handshake.auth as WebSocketHandshakeAuth;

if (accessToken) {
  // Verify JWT and extract userId
  const payload = await jwtService.verifyAsync(accessToken);
  // Use payload.userId
} else if (apiKey) {
  // Legacy: look up by API key (backward compat)
}
```

### Step 3: Workout App Changes

#### 3a. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials
2. Create an OAuth 2.0 Client ID (type: "Web application")
3. Authorized JavaScript origins: `http://localhost:5173`, `https://mesopro.tonyneuhold.com`
4. No redirect URIs needed (client-side token flow)
5. Copy the Client ID into the GitHub `config` repo JSONC files
6. Configure the OAuth consent screen:
   - User type: External
   - App name, support email, developer email
   - Scopes: `email`, `profile`, `openid`
   - Test users (while in "Testing" status): add your Google account

#### 3b. Install types and create Google GIS loader

```bash
pnpm add -D @types/google.accounts
```

**File**: `src/util/auth/loadGoogleGIS.ts` (new)

A small utility (~15 lines) that dynamically loads the Google Identity Services script on demand:

```typescript
let loadPromise: Promise<typeof google.accounts> | null = null;

/**
 * Lazily loads the Google Identity Services script and returns the
 * `google.accounts` API. Subsequent calls return the same promise.
 */
export function loadGoogleGIS(): Promise<typeof google.accounts> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.accounts) {
      resolve(window.google.accounts);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve(window.google.accounts);
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
```

This avoids loading the script on every page -- it only loads when the Login component mounts. The `@types/google.accounts` package provides full type coverage for `google.accounts.id.initialize()`, `renderButton()`, etc.

#### 3c. Update the Login component

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
      client_id: GOOGLE_CLIENT_ID, // from env/config
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

#### 3d. Update auth state management

**File**: Update `src/stores/local/userConfig/userConfig.ts`

Add token fields to the stored user config:

```typescript
interface UserConfig {
  userId: string;
  username: string;
  apiKey: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}
```

When tokens are stored, also call `APIService.setAccessToken(token)` so all subsequent API calls include the Bearer header automatically.

#### 3e. Add token refresh logic

**File**: Update the API communication layer (in `core-ts-api-lib` `GCloudAPIService`)

Add a 401 interceptor to the `call` method:

```typescript
private static async call<TInput extends object, TOutput>(
  urlPath: string,
  input: TInput
): Promise<APIResponse<TOutput>> {
  let response = await this.rawCall(urlPath, input);

  // If 401 and we have a refresh mechanism, try to refresh
  if (response.status === 401 && this.#onUnauthorized) {
    const refreshed = await this.#onUnauthorized();
    if (refreshed) {
      response = await this.rawCall(urlPath, input);
    }
  }

  return this.decodeResponse<TOutput>(response);
}
```

The workout app sets the `onUnauthorized` callback at startup:

```typescript
GCloudAPIService.setOnUnauthorized(async () => {
  const refreshResult = await APIService.refreshToken({
    refreshTokenString: userConfig.refreshToken
  });
  if (refreshResult.success) {
    // Store new tokens
    APIService.setAccessToken(refreshResult.data.accessToken);
    userConfig.update({ refreshToken: refreshResult.data.refreshTokenString });
    return true;
  }
  // Refresh failed -- log user out
  logout();
  return false;
});
```

#### 3f. Update WebSocket connection

Update the WebSocket connection to pass `accessToken` in the handshake:

```typescript
const socket = io(url, {
  auth: {
    accessToken: userConfig.accessToken
  } satisfies WebSocketHandshakeAuth
});
```

#### 3g. Update logout flow

On logout:
1. Call `POST /auth/logout` (new endpoint) to delete the refresh token server-side
2. Clear `accessToken` and `refreshToken` from userConfig
3. Call `APIService.setAccessToken(null)`
4. Call `google.accounts.id.disableAutoSelect()` to prevent auto-sign-in on next visit
5. Existing logout logic (clear localStorage, disconnect WebSocket) remains the same

---

> **Next**: Once Phase 1 is deployed and verified in production, proceed to [Phase 2: Deprecation of Old Auth](./google-auth-phase2-deprecation.md).

---

## Security Considerations

### Token Storage in SPA

| Storage | XSS Risk | CSRF Risk | Persistence |
|---------|----------|-----------|-------------|
| `localStorage` | Vulnerable (JS can read) | Not vulnerable | Survives refresh |
| `sessionStorage` | Vulnerable (JS can read) | Not vulnerable | Lost on tab close |
| In-memory (Svelte store) | Safest (not in storage) | Not vulnerable | Lost on refresh |
| `httpOnly` cookie | Not readable by JS | Needs `SameSite` | Survives refresh |

**Decision**: Store both tokens in `localStorage`. This matches the current security posture (API key is already in `localStorage`). The short-lived access token (15 min) and server-side refresh token deletion on rotation/logout limit exposure.

### Refresh Token Security

- **Hashed storage**: Only the SHA-256 hash of the refresh token is stored in the database. A database breach does not expose usable tokens.
- **Active tokens only**: Only valid, active tokens are stored. Old tokens are deleted on rotation and logout — no revoked records accumulate.
- **Rotation**: Every refresh request deletes the old token and issues a new one. A stolen token can only be used once.
- **Theft detection**: If an unrecognized token is presented (no matching `tokenHash`), ALL tokens for that user are deleted. This catches the case where an attacker replays a stolen token after the legitimate user has already rotated it. The user is logged out everywhere.
- **Expiry**: Refresh tokens expire after 7 days regardless of rotation. Expired tokens are cleaned up lazily when the user next authenticates.
- **Logout deletion**: Explicit logout deletes the refresh token server-side.

### CSRF Protection

Since the app uses `Authorization: Bearer` headers (not cookies) for API authentication, CSRF is inherently mitigated -- browsers do not automatically attach custom headers on cross-origin requests.

### Google Token Validation

The `google-auth-library` verifies:
- JWT signature against Google's public keys (fetched and cached automatically)
- `aud` (audience) matches your Client ID
- `exp` (expiration) -- Google ID tokens are short-lived
- `iss` (issuer) is `accounts.google.com` or `https://accounts.google.com`

### Rate Limiting

The existing throttle on the auth controller (10 requests per minute) applies to the `validateUser` and `refresh` endpoints.

---

## Account Linking Strategy

When a user signs in with Google, the backend resolves their identity in this order:

1. **By `auth.googleId`**: If a user already has this Google ID linked, return them immediately.
2. **By `email`**: If no user has this Google ID but a user exists with the same email, link the Google ID to that user (set `auth.googleId`) and return them. This seamlessly links existing password-based accounts.
3. **New user**: If neither match, create a new `User` with the Google ID, email, and a username derived from the Google profile name.

This means existing users who sign in with the same email they used for their password account will be automatically linked without any extra steps.

---

## Deploy Order

The implementation is **additive** -- both old and new auth work simultaneously:

1. **Deploy ts-libs changes** (Step 1) -- New types + updated `GCloudAPIService` with Bearer header support. No breaking changes; the header is only sent when an access token is set.
2. **Deploy gcloud-backend changes** (Step 2) -- Updated `validateUser` endpoint handles both flows + global auth guard. Existing endpoints marked `@Public()` so they keep working. The guard also falls back to API key validation in the request body.
3. **Deploy workout app changes** (Step 3) -- Google Sign-In button alongside existing form. Both login methods go through the same `validateUser` endpoint and receive JWTs.
4. **Test end-to-end** -- Verify Google login and token refresh in production.

---

## Google Cloud Console Setup Checklist

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Enable the "Google Identity" API (may already be enabled)
4. Go to APIs & Services > Credentials
5. Click "Create Credentials" > "OAuth 2.0 Client ID"
6. Application type: "Web application"
7. Name: "MesoPro Workout App" (or similar)
8. Authorized JavaScript origins:
   - `http://localhost:5173`
   - `https://mesopro.tonyneuhold.com`
9. Authorized redirect URIs: (none needed for client-side flow)
10. Copy the Client ID
11. Add Client ID to `local.jsonc`, `dev.jsonc`, `prod.jsonc` in the private GitHub `config` repo
12. Configure the OAuth consent screen:
    - User type: External
    - App name, support email, developer email
    - Scopes: `email`, `profile`, `openid`
    - Test users (while in "Testing" status): add your Google account

---

## Files Changed Summary

### ts-libs (`core-ts-api-lib`)

| File | Action |
|------|--------|
| `src/types/AuthValidateUser.ts` | Update (add `credential` to input, add `accessToken`/`refreshToken` to output) |
| `src/types/AuthRefreshToken.ts` | Create |
| `src/types/JwtPayload.ts` | Create (with `userId`, `email`) |
| `src/types/WebSocket.ts` | Update (`WebSocketHandshakeAuth` adds `accessToken`) |
| `src/services/GCloudAPIService/GCloudAPIService.ts` | Update (add Bearer header, `setAccessToken`, `onUnauthorized`) |
| `src/services/APIService/APIService.ts` | Update (add `refreshToken`, `setAccessToken`) |
| Barrel exports | Update |

### ts-libs (`core-ts-db-lib`)

| File | Action |
|------|--------|
| `src/documents/common/RefreshToken.ts` | Create (Zod schema for hashed refresh tokens) |

### ts-libs (`be-ts-db-lib`)

| File | Action |
|------|--------|
| `src/repositories/RefreshTokenRepository.ts` | Create (MongoDB repository) |

### ts-libs (`be-ts-lib`)

| File | Action |
|------|--------|
| `src/services/ConfigService/ConfigDefinition.ts` | Update (add `googleClientId`, `jwtAccessSecret`, `jwtRefreshSecret`) |

### gcloud-backend

| File | Action |
|------|--------|
| `package.json` | Update (add `@nestjs/jwt`, `google-auth-library`) |
| `src/routes/auth/Auth.module.ts` | Update (register `JwtModule`, add providers) |
| `src/routes/auth/Auth.controller.ts` | Update (extend `validateUser` for Google flow, add `refresh`/`logout` endpoints) |
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
| WebSocket connection setup | Update (use `accessToken` in handshake) |
| Logout logic | Update (delete refresh token, clear tokens) |

### GitHub `config` repo

| File | Action |
|------|--------|
| `local.jsonc` | Update (add `googleClientId`, `jwtAccessSecret`, `jwtRefreshSecret`) |
| `dev.jsonc` | Update (same) |
| `prod.jsonc` | Update (same) |

---

## Sources

- [NestJS Official Authentication Documentation](https://docs.nestjs.com/security/authentication)
- [NestJS Authentication without Passport - Trilon](https://trilon.io/blog/nestjs-authentication-without-passport)
- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Verify Google ID Tokens - Google Developers](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [SvelteKit Official Auth Guide](https://svelte.dev/docs/kit/auth)
- [The Copenhagen Book - Web Auth Reference](https://thecopenhagenbook.com/)
- [@types/google.accounts on npm](https://www.npmjs.com/package/@types/google.accounts)
- [Updates to GIS and FedCM Migration](https://developers.googleblog.com/en/updates-to-google-identity-services-gis-and-migration-to-the-credential-manager-api/)
