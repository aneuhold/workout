# Google Authentication — Phase 1.5: Workout App Integration

This document describes the workout app (SvelteKit SPA) changes needed to integrate with the Google Sign-In and JWT-based authentication system built in Phase 1.

**Prerequisite**: Phase 1 (ts-libs + gcloud-backend) must be deployed and verified first.

See also:
- [Phase 1: Implementation](./google-auth-plan.md)
- [Phase 2: Deprecation of Old Auth](./google-auth-phase2-deprecation.md)

---

## Steps

### 1a. Install types and create Google GIS loader

```bash
pnpm add -D @types/google.accounts
```

**File**: `src/util/auth/loadGoogleGIS.ts` (new)

A small utility that dynamically loads the Google Identity Services script on demand. Returns `google.accounts` API. Caches the load promise so subsequent calls are instant.

### 1b. Update the Login component

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
    const result = await APIService.validateUser({ googleCredentialToken: response.credential });
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

### 1c. Update auth state management

**File**: Update `src/stores/local/userConfig/userConfig.ts`

Add `accessToken` and `refreshTokenString` fields to `UserConfig`. When tokens are stored, call `APIService.setAccessToken(token)` so all subsequent API calls include the Bearer header. Also call `APIService.setRefreshTokenString(token)` so the auto-refresh mechanism works.

**File**: Update `src/stores/session/loginState.ts`

Update the initialization check to consider the user logged in if either `accessToken` or `apiKey` exists in `userConfig` (supporting both old and new auth during migration).

### 1d. Configure token persistence callback

At app startup, register a callback so that when `GCloudAPIService` auto-refreshes tokens, the new values are persisted to `userConfig`:

```typescript
APIService.setOnTokensRefreshed((accessToken, refreshTokenString) => {
  userConfig.update({ accessToken, refreshTokenString });
});
```

### 1e. Update WebSocket connection

Pass `accessToken` in the handshake instead of `apiKey`.

### 1f. Update logout flow

On logout:
1. Call `APIService.logout({ refreshTokenString: userConfig.refreshTokenString })` to delete the refresh token server-side
2. Clear `accessToken` and `refreshTokenString` from userConfig
3. Call `google.accounts.id.disableAutoSelect()` to prevent auto-sign-in on next visit

---

## Files Changed Summary

| File | Action |
|------|--------|
| `package.json` | Update (add `@types/google.accounts` dev dep) |
| `src/util/auth/loadGoogleGIS.ts` | Create (dynamic script loader) |
| `src/components/Login/Login.svelte` | Update (add Google Sign-In button) |
| `src/stores/local/userConfig/userConfig.ts` | Update (add `accessToken`, `refreshTokenString`) |
| `src/stores/session/loginState.ts` | Update (check `accessToken` OR `apiKey` for logged-in state) |
| WebSocket connection setup | Update (use `accessToken` in handshake) |
| Logout logic | Update (delete refresh token, clear tokens) |
