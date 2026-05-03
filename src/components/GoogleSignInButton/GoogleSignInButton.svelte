<!--
  @component

  "Continue with Google" button with sign-in logic and inline error feedback
  baked in. Wraps `GoogleSignInButtonPresentational.svelte` for visuals.

  Calls `googleAuthService.signIn()` on click and hands the resulting ID token
  back to the parent via `onIdToken`. Manages its own in-flight state and
  surfaces sign-in failures inline. See `docs/sign-in-error-feedback.md` for
  the rationale on the inline error pattern.
-->
<script lang="ts">
  import googleAuthService from '$services/GoogleAuthService';
  import { createLogger } from '$util/logging/logger';
  import GoogleSignInButtonPresentational from './GoogleSignInButtonPresentational.svelte';

  const log = createLogger('GoogleSignInButton.svelte');

  let {
    onIdToken,
    disabled = false
  }: {
    onIdToken: (idToken: string) => void | Promise<void>;
    disabled?: boolean;
  } = $props();

  let signingIn = $state(false);
  let signInError = $state(false);

  async function handleClick() {
    if (signingIn) return;
    signingIn = true;
    signInError = false;
    try {
      let idToken: string | null;
      try {
        idToken = await googleAuthService.signIn();
      } catch (e) {
        log.error('Google sign-in failed', e);
        signInError = true;
        return;
      }
      if (idToken) {
        await onIdToken(idToken);
      }
    } finally {
      signingIn = false;
    }
  }
</script>

<GoogleSignInButtonPresentational onclick={handleClick} disabled={disabled || signingIn} />
{#if signInError}
  <p class="text-destructive text-sm">Google sign-in failed. Please try again.</p>
{/if}
