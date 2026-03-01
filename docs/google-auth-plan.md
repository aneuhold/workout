# Google Authentication Implementation Plan

This document describes the plan for adding Google Sign-In authentication across the three repositories: **workout** (SvelteKit SPA), **gcloud-backend** (NestJS API), and **ts-libs** (shared types/services).

## Current State

### Authentication Today

- **Workout app**: Username/password login. Credentials sent to `POST /auth/validateUser`. Server returns a `User` object and `ApiKey`. The API key is stored in `localStorage` and sent with every API request (in the request body, not as a header). WebSocket connections also authenticate via the API key in the handshake.
- **gcloud-backend**: No guards, no JWT, no Passport. Manual API key validation inline in each controller/gateway. Hardcoded password check in `checkPassword` endpoint. Plaintext password comparison in `validateUser`.
- **ts-libs**: `User` document already has `auth.googleId` (nullable string) and `auth.password` (nullable string). `ApiKey` document stores a UUID key linked to a userId.

### Key Constraints

- The workout app uses `@sveltejs/adapter-static` (pure SPA, no server-side rendering, no `hooks.server.ts`).
- The existing API key system is used by both the workout app and dashboard app for all CRUD operations and WebSocket auth.
- CORS is already configured for `mesopro.tonyneuhold.com`, `dashboard.tonyneuhold.com`, and `localhost:5173`.

---

## Architecture Overview

```
                 Workout SPA (SvelteKit static)
                 ┌────────────────────────────┐
                 │                            │
                 │  1. Google Identity Services│
                 │     SDK renders "Sign in   │
                 │     with Google" button     │
                 │                            │
                 │  2. User signs in, receives │
                 │     a Google ID token      │
                 │                            │
                 │  3. SPA sends ID token to  │
                 │     NestJS backend         │
                 │                            │
                 └─────────────┬──────────────┘
                               │
                   POST /auth/google
                   { credential: "eyJ..." }
                               │
                               ▼
                 NestJS API (gcloud-backend)
                 ┌────────────────────────────┐
                 │                            │
                 │  4. Verify Google ID token  │
                 │     via google-auth-library │
                 │                            │
                 │  5. Find or create User by  │
                 │     auth.googleId           │
                 │                            │
                 │  6. Find or create ApiKey   │
                 │     for the user            │
                 │                            │
                 │  7. Return JWT (access      │
                 │     token) + user info      │
                 │                            │
                 └─────────────┬──────────────┘
                               │
                   Response: { accessToken, user, apiKey }
                               │
                               ▼
                 Workout SPA
                 ┌────────────────────────────┐
                 │                            │
                 │  8. Store access token +   │
                 │     API key in memory/     │
                 │     localStorage           │
                 │                            │
                 │  9. Use JWT in             │
                 │     Authorization header   │
                 │     for all API calls      │
                 │                            │
                 │  10. Use API key for       │
                 │      WebSocket auth        │
                 │      (unchanged)           │
                 │                            │
                 └────────────────────────────┘
```

### Why This Approach

- **Client-side Google button**: No server redirects needed. Google Identity Services (GIS) SDK handles the consent flow entirely in the browser and returns an ID token. This is the recommended pattern for SPAs.
- **Backend token verification**: The NestJS backend validates the Google ID token using Google's `google-auth-library`. This is Google's officially recommended server-side verification method. It checks the JWT signature against Google's public keys, verifies the audience, expiration, and issuer.
- **JWT access tokens**: Replacing the current "send API key in every request body" pattern with standard `Authorization: Bearer <token>` headers. JWTs are stateless, widely supported, and can carry user identity claims. Short-lived (15 min) access tokens with refresh capability.
- **Preserve API key for WebSocket**: The existing WebSocket auth via API key works well and avoids the complexity of JWT refresh during long-lived socket connections. The API key remains as a stable credential for WebSocket handshakes.

---

## Detailed Implementation Plan

### Phase 1: ts-libs Changes (Shared Types and Services)

#### 1a. Add new auth API types to `core-ts-api-lib`

**File**: `packages/core-ts-api-lib/src/types/AuthGoogleLogin.ts` (new)

```typescript
export interface AuthGoogleLoginInput {
  credential: string; // Google ID token
}

export interface AuthGoogleLoginOutput {
  accessToken: string;
  user: User;
  apiKey: ApiKey;
}
```

**File**: `packages/core-ts-api-lib/src/types/AuthRefreshToken.ts` (new)

```typescript
export interface AuthRefreshTokenInput {
  refreshToken: string;
}

export interface AuthRefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}
```

Export these from the package barrel and add an `APIService.googleLogin()` static method.

#### 1b. Update User document (if needed)

The `User` schema already has `auth.googleId` -- no changes needed. If we want to store additional Google profile data (email, display name, profile picture URL), we could add optional fields, but this is not required for the initial implementation. The existing `email` field on User can store the Google-provided email.

#### 1c. Add JWT payload type

**File**: `packages/core-ts-api-lib/src/types/JwtPayload.ts` (new)

```typescript
export interface JwtPayload {
  sub: string;      // User _id
  userName: string;
  iat?: number;     // Issued at (set automatically)
  exp?: number;     // Expiration (set automatically)
}
```

### Phase 2: gcloud-backend Changes

#### 2a. Install dependencies

```bash
pnpm add @nestjs/jwt google-auth-library
```

- `@nestjs/jwt` -- NestJS wrapper around `jsonwebtoken` for signing/verifying JWTs.
- `google-auth-library` -- Google's official library for verifying ID tokens server-side.

#### 2b. Add environment variables

Add to `.env` and any deployment configuration:

```env
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
JWT_ACCESS_SECRET=<random-256-bit-secret>
JWT_REFRESH_SECRET=<random-256-bit-secret>
```

The Google Client ID is obtained from the Google Cloud Console (APIs & Services > Credentials > OAuth 2.0 Client IDs). You will create a "Web application" type credential.

#### 2c. Create Google auth service

**File**: `src/routes/auth/GoogleAuth.service.ts` (new)

This service:
1. Accepts a Google ID token (the `credential` string from the frontend)
2. Verifies it using `OAuth2Client.verifyIdToken()` with the Google Client ID as audience
3. Extracts the Google user ID (`sub`), email, and name from the token payload
4. Looks up the user by `auth.googleId` in the database
5. If no user exists, creates a new User with the Google ID, email, and a generated username
6. Finds or creates an ApiKey for the user
7. Returns the user and API key

#### 2d. Create JWT service / module

**File**: Update `src/routes/auth/Auth.module.ts`

Register `JwtModule` from `@nestjs/jwt`:

```typescript
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: '15m' }
    })
  ],
  controllers: [AuthController],
  providers: [GoogleAuthService]
})
export class AuthModule {}
```

#### 2e. Add Google login endpoint

**File**: Update `src/routes/auth/Auth.controller.ts`

Add a new endpoint:

```typescript
@Post('google')
async googleLogin(@Body() body: AuthGoogleLoginInput): Promise<APIResponse<AuthGoogleLoginOutput>> {
  // 1. Verify Google ID token
  // 2. Find or create user
  // 3. Get API key
  // 4. Sign JWT access token with { sub: user._id, userName: user.userName }
  // 5. Return { accessToken, user, apiKey }
}
```

This endpoint is public (no auth guard needed -- it IS the auth endpoint).

#### 2f. Create an auth guard

**File**: `src/common/guards/Auth.guard.ts` (new)

A `CanActivate` guard that:
1. Checks for `@Public()` decorator -- if present, skips auth
2. Extracts the JWT from the `Authorization: Bearer <token>` header
3. Verifies the JWT using `JwtService.verifyAsync()`
4. Attaches the decoded payload to `request.user`
5. Throws `UnauthorizedException` on failure

**File**: `src/common/decorators/Public.decorator.ts` (new)

```typescript
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

#### 2g. Register the auth guard globally

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

#### 2h. Mark public endpoints

Add `@Public()` to:
- `POST /auth/google` (the new Google login endpoint)
- `POST /auth/checkPassword` (existing, if still needed)
- `POST /auth/validateUser` (existing, if still needed during migration)
- `GET /` (the hello world endpoint)

#### 2i. Migrate existing controllers to use JWT

The existing Workout and Dashboard controllers currently extract `apiKey` from the request body and validate it inline. With the global auth guard:

1. The guard validates the JWT and puts user info on `request.user`
2. Controllers no longer need to manually validate API keys for HTTP requests
3. The API key is still sent for the purpose of identifying the user (the JWT `sub` claim now serves this purpose)
4. WebSocket gateways continue using API key auth in the handshake (this remains unchanged initially)

**Migration approach**: During the transition period, controllers can accept both patterns:
- JWT in `Authorization` header (new pattern, validated by guard)
- API key in request body (legacy pattern, for backwards compatibility)

Once all clients are updated, the legacy API key validation in controllers can be removed.

#### 2j. Add refresh token endpoint (optional, recommended)

**File**: Update `src/routes/auth/Auth.controller.ts`

```typescript
@Public()
@Post('refresh')
async refreshToken(@Body() body: AuthRefreshTokenInput): Promise<APIResponse<AuthRefreshTokenOutput>> {
  // 1. Verify the refresh token using JWT_REFRESH_SECRET
  // 2. Look up the user to ensure they still exist
  // 3. Issue a new access token + new refresh token (rotation)
  // 4. Return both
}
```

The refresh token has a longer expiry (7 days) and is signed with a separate secret. Refresh token rotation (issuing a new refresh token each time) prevents replay attacks.

### Phase 3: Workout App Changes

#### 3a. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials
2. Create an OAuth 2.0 Client ID (type: "Web application")
3. Authorized JavaScript origins: `http://localhost:5173`, `https://mesopro.tonyneuhold.com`
4. No redirect URIs needed (we use the client-side token flow, not the redirect flow)
5. Note the Client ID -- this goes in the frontend

#### 3b. Add Google Identity Services SDK

Load the Google GIS script. Two options:

**Option A**: Add to `app.html`:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

**Option B**: Dynamically load in the Login component (avoids loading the script on every page if the user is already logged in).

#### 3c. Update the Login component

**File**: Update `src/components/Login/Login.svelte`

Replace or augment the existing username/password form with a Google Sign-In button:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    google.accounts.id.initialize({
      client_id: 'YOUR_GOOGLE_CLIENT_ID',
      callback: handleGoogleCallback
    });
    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      { theme: 'outline', size: 'large', width: '100%' }
    );
  });

  async function handleGoogleCallback(response: { credential: string }) {
    // 1. Send response.credential to POST /auth/google
    // 2. Receive { accessToken, user, apiKey }
    // 3. Store in userConfig / auth store
    // 4. Transition to LoggedIn state
  }
</script>

<div id="google-signin-button"></div>
```

The Google button renders as a native-looking "Sign in with Google" button with the user's Google profile picture. It handles the entire consent flow.

#### 3d. Update auth state management

**File**: Update `src/stores/local/userConfig/userConfig.ts`

Add `accessToken` to the stored user config:

```typescript
interface UserConfig {
  userId: string;
  username: string;
  apiKey: string | null;
  accessToken: string | null; // JWT access token (new)
}
```

#### 3e. Update API service to use Bearer token

**File**: Update the API communication layer

Currently the API key is sent in the POST body. Update to send the JWT as a Bearer token in the `Authorization` header:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`
}
```

The API key continues to be sent in the body for WebSocket identification and for backward compatibility during migration.

#### 3f. Add token refresh logic

When an API call receives a 401 response:
1. Attempt to refresh the access token using the refresh token
2. If successful, retry the original request with the new token
3. If refresh fails, log the user out and show the login screen

This can be implemented as a wrapper around the existing `WorkoutAPIService.queryApi()` method.

#### 3g. Update logout flow

On logout:
1. Clear `accessToken` from userConfig
2. Call `google.accounts.id.disableAutoSelect()` to prevent auto-sign-in on next visit
3. Existing logout logic (clear localStorage, disconnect WebSocket) remains the same

### Phase 4: Deprecation and Cleanup

Once Google auth is working and all users are migrated:

1. **Remove the password field from User**: Set `auth.password` to nullable/removed in the schema
2. **Remove `POST /auth/validateUser`**: No longer needed
3. **Remove `POST /auth/checkPassword`**: No longer needed
4. **Remove password storage**: Delete `src/stores/local/password.ts` from the workout app
5. **Remove the username/password form**: Clean up Login.svelte

This phase is optional and can be done later. The old endpoints can coexist with the new Google auth flow indefinitely.

---

## Security Considerations

### Token Storage in SPA

Since the app is a static SPA, tokens must be stored client-side. The options and tradeoffs:

| Storage | XSS Risk | CSRF Risk | Persistence |
|---------|----------|-----------|-------------|
| `localStorage` | Vulnerable (JS can read) | Not vulnerable | Survives refresh |
| `sessionStorage` | Vulnerable (JS can read) | Not vulnerable | Lost on tab close |
| In-memory (Svelte store) | Safest (not in storage) | Not vulnerable | Lost on refresh |
| `httpOnly` cookie | Not readable by JS | Needs `SameSite` | Survives refresh |

**Recommendation**: Store the access token in `localStorage` (same pattern as the current API key). This is a pragmatic choice for an SPA -- the current system already stores the API key in `localStorage`, so the security posture does not change. The short-lived JWT (15 min) limits the window of exposure compared to the current long-lived API key.

For a future improvement, the NestJS backend could set the refresh token as an `httpOnly` cookie (since CORS already has `credentials: true`). This would protect the refresh token from XSS while keeping the access token in memory/localStorage for API calls.

### CSRF Protection

Since the app uses `Authorization: Bearer` headers (not cookies) for API authentication, CSRF is inherently mitigated -- browsers do not automatically attach custom headers on cross-origin requests.

### Google Token Validation

The `google-auth-library` verifies:
- JWT signature against Google's public keys (fetched and cached automatically)
- `aud` (audience) matches your Client ID
- `exp` (expiration) -- tokens are short-lived
- `iss` (issuer) is `accounts.google.com` or `https://accounts.google.com`

### Rate Limiting

The existing throttle on the auth controller (10 requests per minute) applies to the new Google login endpoint as well. This prevents abuse of the token exchange endpoint.

---

## Migration Strategy

The implementation should be **additive**, not a replacement, so both old and new auth work simultaneously during the transition:

1. **Deploy ts-libs changes** -- New types, no breaking changes
2. **Deploy gcloud-backend changes** -- New endpoint + guard with `@Public()` on existing endpoints, so they continue working without JWT
3. **Deploy workout app changes** -- New Google login button alongside existing form
4. **Test end-to-end** -- Verify Google login works in production
5. **Deprecate old auth** -- Remove username/password endpoints and UI (Phase 4)

During migration, the global auth guard should also accept API key authentication (check both `Authorization` header for JWT and request body for API key). This ensures the dashboard app and any other clients continue working without changes.

---

## Google Cloud Console Setup Checklist

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Enable the "Google Identity" API (it may already be enabled)
4. Go to APIs & Services > Credentials
5. Click "Create Credentials" > "OAuth 2.0 Client ID"
6. Application type: "Web application"
7. Name: "MesoPro Workout App" (or similar)
8. Authorized JavaScript origins:
   - `http://localhost:5173`
   - `https://mesopro.tonyneuhold.com`
9. Authorized redirect URIs: (none needed for client-side flow)
10. Copy the Client ID
11. Configure the OAuth consent screen:
    - User type: External
    - App name, support email, developer email
    - Scopes: `email`, `profile`, `openid`
    - Test users (while in "Testing" status): add your Google account

---

## Files Changed Summary

### ts-libs (`core-ts-api-lib`)
| File | Action |
|------|--------|
| `src/types/AuthGoogleLogin.ts` | Create |
| `src/types/AuthRefreshToken.ts` | Create |
| `src/types/JwtPayload.ts` | Create |
| `src/services/APIService/APIService.ts` | Update (add `googleLogin` method) |
| `src/index.ts` / barrel exports | Update |

### gcloud-backend
| File | Action |
|------|--------|
| `package.json` | Update (add `@nestjs/jwt`, `google-auth-library`) |
| `.env` | Update (add `GOOGLE_CLIENT_ID`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) |
| `src/routes/auth/Auth.module.ts` | Update (register `JwtModule`, add providers) |
| `src/routes/auth/Auth.controller.ts` | Update (add `google` and `refresh` endpoints) |
| `src/routes/auth/GoogleAuth.service.ts` | Create |
| `src/routes/App.module.ts` | Update (register global `AuthGuard`) |
| `src/common/guards/Auth.guard.ts` | Create |
| `src/common/decorators/Public.decorator.ts` | Create |
| `src/routes/project/workout/Workout.controller.ts` | Update (remove inline API key validation) |
| `src/routes/project/dashboard/Dashboard.controller.ts` | Update (remove inline API key validation) |

### workout
| File | Action |
|------|--------|
| `src/app.html` | Update (add Google GIS script tag) |
| `src/components/Login/Login.svelte` | Update (add Google Sign-In button) |
| `src/stores/local/userConfig/userConfig.ts` | Update (add `accessToken` field) |
| `src/util/api/WorkoutAPIService.ts` | Update (send Bearer token in headers) |
| API communication layer in `core-ts-api-lib` | Update (add Authorization header support) |

---

## Open Questions

1. **Keep username/password as a fallback?** The plan assumes we keep it during migration and remove it later. If you want to keep both permanently, the Login page would show both options.

2. **Dashboard app**: The dashboard app also uses the same backend. It would need similar changes to send JWTs. The migration strategy accounts for this by keeping API key auth working during transition.

3. **User account linking**: If an existing user (created via username/password) signs in with Google, should we link the accounts? This requires matching by email or prompting the user. The simplest approach is to treat Google-auth users as new accounts and handle linking manually if needed.

4. **Refresh token storage**: The plan uses a simple refresh token approach. For higher security, the refresh token could be stored as a hashed value in the database, enabling server-side revocation. This adds complexity but is recommended for production.

## Sources

- [NestJS Official Authentication Documentation](https://docs.nestjs.com/security/authentication)
- [NestJS Authentication without Passport - Trilon](https://trilon.io/blog/nestjs-authentication-without-passport)
- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Verify Google ID Tokens - Google Developers](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [SvelteKit Official Auth Guide](https://svelte.dev/docs/kit/auth)
- [The Copenhagen Book - Web Auth Reference](https://thecopenhagenbook.com/)
- [Lucia Auth (educational resource, post-deprecation)](https://lucia-auth.com/)
- [Handling Auth with JWT in SvelteKit - Okupter](https://www.okupter.com/blog/handling-auth-with-jwt-in-sveltekit)
