<!--
  @component

  Login screen for the workout app. Prompts the user for username and password,
  validates credentials via the API, and transitions to the logged-in state on success.
-->
<script lang="ts">
  import {
    type APIResponse,
    APIService,
    type AuthValidateUserOutput
  } from '@aneuhold/core-ts-api-lib';
  import { ProjectName } from '@aneuhold/core-ts-db-lib';
  import { IconLoader2 } from '@tabler/icons-svelte';
  import { onMount } from 'svelte';
  import { pushState } from '$app/navigation';
  import { page } from '$app/state';
  import GoogleSignInButton from '$components/GoogleSignInButton';
  import MarketingLinks from '$components/MarketingLinks/MarketingLinks.svelte';
  import googleAuthService from '$services/GoogleAuthService';
  import WorkoutAPIService from '$services/WorkoutAPIService';
  import { password } from '$stores/local/password';
  import { userConfig } from '$stores/local/userConfig/userConfig';
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
  import { createLogger } from '$util/logging/logger';
  import navInfo from '$util/navInfo';

  const log = createLogger('Login.svelte');

  let typedUserName = $state('');
  let typedPassword = $state('');
  let processingCredentials = $derived($loginState === LoginState.ProcessingCredentials);
  let invalidCredentials = $state(false);
  let formIsValid = $derived(typedUserName.trim().length > 0 && typedPassword.trim().length > 0);

  onMount(async () => {
    // Google Sign-In only works when the page URL is the root route. If the user
    // logs out from a deeper page, redirect them to home before initializing.
    if (page.url.pathname !== navInfo.home.url) {
      pushState(navInfo.home.url, '');
    }
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
   * to the backend for validation.
   *
   * @param idToken - The Google-issued ID token JWT.
   */
  async function handleGoogleIdToken(idToken: string) {
    $loginState = LoginState.ProcessingCredentials;
    const result = await APIService.validateUser({
      googleCredentialToken: idToken,
      project: ProjectName.Workout
    });
    handleLoginResult(result);
  }

  /**
   * Handles the login form submission by validating credentials against the API.
   *
   * @param event - The form submission event.
   */
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    $loginState = LoginState.ProcessingCredentials;
    void LocalData.setUsername(typedUserName);
    password.set(typedPassword);

    const validationResponse: APIResponse<AuthValidateUserOutput> = await APIService.validateUser({
      userName: typedUserName,
      password: typedPassword,
      project: ProjectName.Workout
    });

    handleLoginResult(validationResponse);
  }

  /**
   * Processes the validation response, storing tokens and fetching initial
   * data on success, or displaying an error on failure.
   *
   * @param validationResponse - The response from the validate user API call.
   */
  function handleLoginResult(validationResponse: APIResponse<AuthValidateUserOutput>) {
    if (validationResponse.success && validationResponse.data.userInfo) {
      invalidCredentials = false;
      const { user } = validationResponse.data.userInfo;
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
</script>

<form
  class="flex min-h-screen flex-col items-center justify-center gap-6 p-4"
  onsubmit={handleSubmit}
>
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
  <MarketingLinks />
</form>
