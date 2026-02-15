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
  import { IconLoader2 } from '@tabler/icons-svelte';
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
  import WorkoutAPIService from '$util/api/WorkoutAPIService';
  import LocalData from '$util/LocalData/LocalData';
  import { createLogger } from '$util/logging/logger';

  const log = createLogger('Login.svelte');

  let typedUserName = $state(LocalData.username);
  let typedPassword = $state(LocalData.password);
  let processingCredentials = $derived($loginState === LoginState.ProcessingCredentials);
  let invalidCredentials = $state(false);
  let formIsValid = $derived(typedUserName.trim().length > 0 && typedPassword.trim().length > 0);

  /**
   * Handles the login form submission by validating credentials against the API.
   *
   * @param event - The form submission event.
   */
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    $loginState = LoginState.ProcessingCredentials;
    LocalData.username = typedUserName;
    password.set(typedPassword);

    const validationResponse: APIResponse<AuthValidateUserOutput> = await APIService.validateUser({
      userName: typedUserName,
      password: typedPassword
    });

    handleLoginResult(validationResponse);
  }

  /**
   * Processes the validation response, storing the API key and fetching initial
   * data on success, or displaying an error on failure.
   *
   * @param validationResponse - The response from the validate user API call.
   */
  function handleLoginResult(validationResponse: APIResponse<AuthValidateUserOutput>) {
    if (validationResponse.success && validationResponse.data.userInfo?.apiKey) {
      invalidCredentials = false;
      const { user, apiKey: userApiKey } = validationResponse.data.userInfo;
      userConfig.set({
        userId: user._id,
        username: user.userName,
        apiKey: userApiKey.key
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

<form class="flex min-h-screen items-center justify-center p-4" onsubmit={handleSubmit}>
  <Card class="w-full max-w-sm">
    <CardHeader>
      <CardTitle>Login</CardTitle>
      <CardDescription>Enter your credentials to continue.</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
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
