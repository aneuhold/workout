<script lang="ts">
  import {
    type APIResponse,
    APIService,
    type AuthValidateUserOutput
  } from '@aneuhold/core-ts-api-lib';
  import Button, { Label } from '@smui/button';
  import CircularProgress from '@smui/circular-progress';
  import InputBox from '$components/presentational/InputBox/InputBox.svelte';
  import { apiKey } from '$stores/local/apiKey';
  import { dashboardConfig } from '$stores/local/dashboardConfig';
  import { password } from '$stores/local/password';
  import { LoginState, loginState } from '$stores/session/loginState';
  import DashboardAPIService from '$util/api/DashboardAPIService';
  import LocalData from '$util/LocalData/LocalData';
  import { createLogger } from '$util/logging/logger';

  const log = createLogger('Login.svelte');

  let typedUserName = $state(LocalData.username);
  let typedPassword = $state(LocalData.password);
  let processingCredentials = $derived($loginState === LoginState.ProcessingCredentials);
  let invalidCredentials = $state(false);

  function handleSubmit(event: MouseEvent) {
    // Prevent the page from refreshing
    event.preventDefault();

    $loginState = LoginState.ProcessingCredentials;
    LocalData.username = typedUserName;
    password.set(typedPassword);
    APIService.validateUser({
      userName: typedUserName,
      password: typedPassword
    }).then(handleLoginResult);
  }

  function handleLoginResult(validationResponse: APIResponse<AuthValidateUserOutput>) {
    if (
      validationResponse.success &&
      validationResponse.data.userInfo?.apiKey &&
      validationResponse.data.config?.dashboard
    ) {
      dashboardConfig.set(validationResponse.data.config.dashboard);
      invalidCredentials = false;
      const apiKeyValue = validationResponse.data.userInfo.apiKey.key;
      apiKey.set(apiKeyValue);
      if (!$dashboardConfig?.projectDashboardFunctionUrl) {
        log.error('No dashboard function URL found in config');
        return;
      }
      DashboardAPIService.getInitialDataForLogin();
      $loginState = LoginState.LoggedIn;
    } else if (!validationResponse.success) {
      $loginState = LoginState.LoggedOut;
      invalidCredentials = true;
    } else {
      log.error('Unexpected response from validateUser', validationResponse);
    }
  }
</script>

<div class="container">
  <form class="credentialsInputArea">
    <InputBox
      label="Username"
      spellCheck={false}
      autocompleteLabel="username"
      bind:inputValue={typedUserName}
      inputType="text"
    />
    <InputBox
      label="Password"
      spellCheck={false}
      autocompleteLabel="current-password"
      bind:inputValue={typedPassword}
      inputType="password"
    />
    <div class="submitArea">
      <Button
        style="width: 100%;"
        variant="raised"
        class="material-icons dimmed-color"
        onclick={handleSubmit}
        disabled={processingCredentials}
        data-testid="login-submit-button"
      >
        {#if processingCredentials}
          <CircularProgress style="height: 32px; width: 32px;" indeterminate />
        {:else}
          <Label>Submit</Label>
        {/if}
      </Button>
      {#if invalidCredentials}
        <span class="errorMessage"> Invalid username or password </span>
      {/if}
    </div>
  </form>
</div>

<style>
  .container {
    margin-top: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 16px;
  }
  .credentialsInputArea {
    display: grid;
    grid-template-columns: 1fr;
    align-items: center;
    gap: 16px;
    width: 100%;
    max-width: 250px;
  }
  .errorMessage {
    color: var(--mdc-theme-error);
  }
</style>
