<script module lang="ts">
  import { APIService } from '@aneuhold/core-ts-api-lib';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { spyOn, userEvent, within } from 'storybook/test';
  import { LoginState, loginState } from '$stores/session/loginState';
  import LocalData from '$util/LocalData/LocalData';
  import Login from './Login.svelte';

  const { Story } = defineMeta({
    title: 'Components/Login',
    component: Login,
    beforeEach: () => {
      const spy = spyOn(APIService, 'validateUser').mockResolvedValue({
        success: true,
        errors: [],
        data: {}
      });
      return () => {
        loginState.set(LoginState.LoggedOut);
        spy.mockRestore();
      };
    }
  });
</script>

<!-- Empty State Story -->
<Story
  name="Empty State"
  beforeEach={() => {
    spyOn(LocalData, 'username', 'get').mockReturnValue('');
    spyOn(LocalData, 'password', 'get').mockReturnValue('');
  }}
/>

<!-- Filled In Story -->
<Story
  name="Filled In"
  beforeEach={() => {
    spyOn(LocalData, 'username', 'get').mockReturnValue('test');
    spyOn(LocalData, 'password', 'get').mockReturnValue('test');
  }}
/>

<!-- Processing State Story -->
<Story
  name="Processing State"
  beforeEach={() => {
    loginState.set(LoginState.ProcessingCredentials);
  }}
/>

<!-- Invalid Credentials State with Interaction Testing -->
<Story
  name="Invalid Credentials State"
  beforeEach={() => {
    spyOn(APIService, 'validateUser').mockResolvedValue({
      success: false,
      errors: [],
      data: {}
    });
    spyOn(LocalData, 'username', 'get').mockReturnValue('test');
    spyOn(LocalData, 'password', 'get').mockReturnValue('test');
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const loginButton = canvas.getByTestId('login-submit-button');
    await userEvent.click(loginButton);
    // Verify invalid credentials message appears (getByText throws if not found)
    canvas.getByText(/Invalid username or password/i);
  }}
/>
