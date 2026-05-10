<!--
  @component

  Login screen for the workout app. Prompts the user for username and password,
  validates credentials via the API, and transitions to the logged-in state on success.
-->
<script lang="ts">
  import { IconLoader2 } from '@tabler/icons-svelte';
  import { onMount } from 'svelte';
  import GoogleSignInButton from '$components/GoogleSignInButton';
  import authService from '$services/AuthService';
  import googleAuthService from '$services/GoogleAuthService';
  import { LoginState, loginState } from '$stores/session/loginState';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardFooter from '$ui/Card/CardFooter.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import Input from '$ui/Input/Input.svelte';
  import Label from '$ui/Label/Label.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import LocalData from '$util/LocalData/LocalData';

  let typedUserName = $state('');
  let typedPassword = $state('');
  let processingCredentials = $derived($loginState === LoginState.ProcessingCredentials);
  let invalidCredentials = $state(false);
  let formIsValid = $derived(typedUserName.trim().length > 0 && typedPassword.trim().length > 0);

  onMount(async () => {
    // This happens here because if it happens inline with sign-in, it captures the URL of the popup
    // for some reason and doesn't return the user to the app after completion.
    void googleAuthService.init();
    const [storedUsername, storedPassword] = await Promise.all([
      LocalData.getUsername(),
      LocalData.getPassword()
    ]);
    typedUserName = storedUsername;
    typedPassword = storedPassword;
  });

  /**
   * Receives the Google ID token from `GoogleSignInButton` and forwards it
   * to the auth service for validation.
   *
   * @param idToken - The Google-issued ID token JWT.
   */
  async function handleGoogleIdToken(idToken: string) {
    const response = await authService.loginWithGoogle(idToken);
    invalidCredentials = !response.success;
  }

  /**
   * Handles the login form submission by delegating to the auth service.
   *
   * @param event - The form submission event.
   */
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const response = await authService.loginWithPassword(typedUserName, typedPassword);
    invalidCredentials = !response.success;
  }
</script>

<form class="flex min-h-screen items-center justify-center p-4" onsubmit={handleSubmit}>
  <Card class="w-full max-w-sm">
    <CardHeader>
      <CardTitle>Login</CardTitle>
      <CardDescription>Enter your credentials to continue.</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
      <GoogleSignInButton onIdToken={handleGoogleIdToken} disabled={processingCredentials} />
      <div class="flex items-center gap-4">
        <Separator class="flex-1" />
        <span class="text-muted-foreground text-sm">or</span>
        <Separator class="flex-1" />
      </div>
      <div class="flex flex-col gap-2">
        <Label for="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="Username"
          autocomplete="username"
          spellcheck={false}
          bind:value={typedUserName}
          disabled={processingCredentials}
        />
      </div>
      <div class="flex flex-col gap-2">
        <Label for="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Password"
          autocomplete="current-password"
          spellcheck={false}
          bind:value={typedPassword}
          disabled={processingCredentials}
        />
      </div>
      {#if invalidCredentials}
        <p class="text-destructive text-sm">Invalid username or password.</p>
      {/if}
    </CardContent>
    <CardFooter>
      <Button
        type="submit"
        class="w-full"
        disabled={processingCredentials || !formIsValid}
        data-testid="login-submit-button"
      >
        {#if processingCredentials}
          <IconLoader2 class="animate-spin" />
          Logging in...
        {:else}
          Login
        {/if}
      </Button>
    </CardFooter>
  </Card>
</form>
