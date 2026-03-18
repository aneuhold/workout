# Google Authentication — Phase 1.5: Workout App Integration

This document describes the workout app (SvelteKit SPA) changes needed to integrate with the Google Sign-In and JWT-based authentication system built in Phase 1.

**Prerequisite**: Phase 1 (ts-libs + gcloud-backend) must be deployed and verified first.

See also:

- [Phase 1: Implementation](./google-auth-plan.md)
- [Phase 2: Deprecation of Old Auth](./google-auth-phase2-deprecation.md)

---

## Current State Summary

The workout app currently authenticates via username/password → `APIService.validateUser({ userName, password })`. The server returns `{ userInfo: { user, apiKey } }`. The `apiKey` is stored in `userConfig` (persisted to localStorage via `LocalData`) and sent in the body of every API POST request. WebSocket connections authenticate via `apiKey` in the handshake.

### What Phase 1 Added (already deployed)

- **`AuthValidateUserOutput`** now also returns `accessToken` (JWT string) and `refreshTokenString` (opaque UUID string) alongside the existing `userInfo`.
- **`AuthValidateUserInput`** accepts optional `googleCredentialToken` for Google sign-in alongside the existing optional `userName`/`password`.
- **`APIService`** has new methods: `setAccessToken(token)`, `setRefreshTokenString(token)`, `setOnTokensRefreshed(callback)`, `logout()`.
- **`GCloudAPIService`** automatically attaches the `Authorization: Bearer` header when an access token is set, auto-refreshes on 401 using the stored refresh token, and notifies via `onTokensRefreshed` callback.
- **`ProjectWorkoutPrimaryInput.apiKey`** is now optional (deprecated). The auth guard accepts JWT Bearer header as the primary auth method, with body `apiKey` as legacy fallback.
- **`WebSocketHandshakeAuth`** now accepts `accessToken` alongside the deprecated `apiKey`.
- **`GOOGLE_CLIENT_ID`** is exported from `@aneuhold/core-ts-db-lib`.

---

## Steps

### Step 1: Install Google Identity Services types

```bash
pnpm add -D @types/google.accounts
```

### Step 2: Create Google GIS script loader

**File**: `src/util/auth/loadGoogleGIS.ts` (new)

Dynamically loads the Google Identity Services SDK script on demand. Caches the load promise so subsequent calls return immediately.

```typescript
let loadPromise: Promise<typeof google.accounts> | undefined;

/**
 * Lazily loads the Google Identity Services SDK and returns the
 * `google.accounts` API.
 */
export function loadGoogleGIS(): Promise<typeof google.accounts> {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve(google.accounts);
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
```

### Step 3: Update `UserConfig` type and store

**File**: `src/stores/local/userConfig/userConfig.ts`

Add `accessToken` and `refreshTokenString` to the `UserConfig` type. These will be persisted to localStorage alongside the existing fields.

```typescript
export type UserConfig = {
  userId: UUID;
  username: string;
  /** @deprecated Use accessToken instead. Kept for backward compatibility. */
  apiKey: UUID | null;
  /** JWT access token for authenticating API requests. */
  accessToken: string | null;
  /** Raw refresh token string for automatic token refresh. */
  refreshTokenString: string | null;
};
```

Update the `clear()` method to also clear the new fields:

```typescript
clear: () => {
  updateUserConfig(() => ({
    userId: '' as UUID,
    username: '',
    apiKey: null,
    accessToken: null,
    refreshTokenString: null
  }));
}
```

### Step 4: Update `loginState` initialization

**File**: `src/stores/session/loginState.ts`

Update the initialization check to consider `accessToken` alongside `apiKey`. When an `accessToken` exists at startup, call `APIService.setAccessToken()` and `APIService.setRefreshTokenString()` to restore the auth state on `GCloudAPIService`:

```typescript
const config = userConfig.get();
if (browser && (config.accessToken || config.apiKey)) {
  if (config.accessToken) {
    APIService.setAccessToken(config.accessToken);
  }
  if (config.refreshTokenString) {
    APIService.setRefreshTokenString(config.refreshTokenString);
  }
  setLoginState(LoginState.LoggedIn);
  WorkoutAPIService.getInitialDataIfNeeded();
}
```

### Step 5: Register token persistence callback

**File**: `src/stores/session/loginState.ts` (or a new auth initialization module)

Register the `onTokensRefreshed` callback so that when `GCloudAPIService` auto-refreshes tokens (on 401), the new values are persisted to `userConfig` / localStorage:

```typescript
APIService.setOnTokensRefreshed((accessToken, refreshTokenString) => {
  userConfig.update((config) => ({ ...config, accessToken, refreshTokenString }));
});
```

This should be registered once at app startup, in the same place where `loginState` is initialized.

### Step 6: Update Login component

**File**: `src/components/Login/Login.svelte`

#### 6a: Update `handleLoginResult` to store JWT tokens

Update `handleLoginResult` to store `accessToken` and `refreshTokenString` alongside `apiKey`, and call the `APIService` setters:

```typescript
function handleLoginResult(validationResponse: APIResponse<AuthValidateUserOutput>) {
  if (validationResponse.success && validationResponse.data.userInfo) {
    invalidCredentials = false;
    const { user, apiKey: userApiKey } = validationResponse.data.userInfo;
    const { accessToken, refreshTokenString } = validationResponse.data;

    // Store tokens for the auto-refresh mechanism
    if (accessToken) {
      APIService.setAccessToken(accessToken);
    }
    if (refreshTokenString) {
      APIService.setRefreshTokenString(refreshTokenString);
    }

    userConfig.set({
      userId: user._id,
      username: user.userName,
      apiKey: userApiKey.key,
      accessToken: accessToken ?? null,
      refreshTokenString: refreshTokenString ?? null
    });
    WorkoutAPIService.getInitialDataForLogin();
    $loginState = LoginState.LoggedIn;
  } else if (!validationResponse.success) {
    $loginState = LoginState.LoggedOut;
    invalidCredentials = true;
  } else {
    log.error('Unexpected response from validateUser', validationResponse);
  }
}
```

#### 6b: Add Google Sign-In button

Add the Google Sign-In button below the existing username/password form. Add these imports to the existing `<script>` block (alongside the existing imports):

```typescript
import { GOOGLE_CLIENT_ID } from '@aneuhold/core-ts-db-lib';
import { onMount } from 'svelte';
import { loadGoogleGIS } from '$util/auth/loadGoogleGIS';
import Separator from '$ui/Separator/Separator.svelte';
```

Add this state and lifecycle logic to the `<script>` block:

```typescript
let googleButtonRef: HTMLDivElement | undefined = $state();

onMount(async () => {
  const accounts = await loadGoogleGIS();
  accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCallback
  });
  if (googleButtonRef) {
    accounts.id.renderButton(googleButtonRef, {
      theme: 'outline',
      size: 'large',
      width: 384
    });
  }
});

async function handleGoogleCallback(response: google.accounts.id.CredentialResponse) {
  $loginState = LoginState.ProcessingCredentials;
  const result = await APIService.validateUser({
    googleCredentialToken: response.credential
  });
  handleLoginResult(result);
}
```

Add the separator and Google button in the template, after `CardContent` and before `CardFooter`:

```svelte
<div class="flex items-center gap-4 px-6">
  <Separator class="flex-1" />
  <span class="text-muted-foreground text-sm">or</span>
  <Separator class="flex-1" />
</div>

<div class="flex justify-center px-6 py-4">
  <div bind:this={googleButtonRef}></div>
</div>
```

### Step 7: Update WebSocket connection

**File**: `src/services/WebSocketService.ts`

Update the `connect()` method to pass `accessToken` in the handshake auth alongside `apiKey`:

```typescript
static connect() {
  if (this.#socket) {
    return;
  }

  const config = userConfig.get();
  this.#socket = io(`${APIService.getCurrentAPIUrl()}workout`, {
    auth: {
      accessToken: config.accessToken ?? undefined,
      apiKey: config.apiKey ?? undefined  // Legacy fallback
    }
  });

  // ... existing event handlers
}
```

The backend gateway accepts both `accessToken` and `apiKey` in the handshake, preferring JWT.

### Step 8: Update logout flow

**File**: `src/components/TopBar/TopBar.svelte`

Add the `APIService` import and update `handleLogout` to call the server-side logout endpoint (deletes the refresh token hash from the user document) before clearing local state:

```typescript
import { APIService } from '@aneuhold/core-ts-api-lib';
```

```typescript
async function handleLogout() {
  // Delete refresh token server-side
  await APIService.logout();

  // Clear local state
  userConfig.clear();
  loginState.set(LoginState.LoggedOut);

  // Prevent Google auto-sign-in on next visit
  try {
    google.accounts.id.disableAutoSelect();
  } catch {
    // Google GIS may not be loaded if user didn't use Google sign-in
  }
}
```

Note: `APIService.logout()` uses the stored refresh token string internally — no arguments needed.

---

## Important Implementation Notes

- **`GOOGLE_CLIENT_ID`** is imported from `@aneuhold/core-ts-db-lib`.
- **`APIService.logout()`** takes no arguments — it uses the internally stored refresh token string.
- **`APIService.setAccessToken(token)`** only accepts `string`. Only call it when you have a token.
- **Auto-refresh** is handled entirely inside `GCloudAPIService`. On 401, it calls the refresh endpoint, updates its internal tokens, and notifies via `onTokensRefreshed`. The app just needs to register the callback to persist new tokens.
- **Both auth paths work simultaneously** during migration. The backend `AuthGuard` accepts either a JWT Bearer header or a body `apiKey`. The frontend should send both (JWT via header + apiKey in body) until Phase 2 removes the legacy path.
- **WebSocket auth** also supports both paths. The gateway tries JWT first, then falls back to apiKey.

---

## Files Changed Summary

| File | Action |
|------|--------|
| `package.json` | Update (add `@types/google.accounts` dev dep) |
| `src/util/auth/loadGoogleGIS.ts` | Create (dynamic GIS script loader) |
| `src/stores/local/userConfig/userConfig.ts` | Update (add `accessToken`, `refreshTokenString` to `UserConfig`) |
| `src/stores/session/loginState.ts` | Update (check `accessToken` OR `apiKey`, restore tokens on startup, register `onTokensRefreshed`) |
| `src/components/Login/Login.svelte` | Update (store JWT tokens on login, add Google Sign-In button) |
| `src/services/WebSocketService.ts` | Update (pass `accessToken` in handshake auth) |
| `src/components/TopBar/TopBar.svelte` | Update (call `APIService.logout()`, `disableAutoSelect()`) |
