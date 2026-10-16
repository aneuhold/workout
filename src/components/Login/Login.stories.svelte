<script module lang="ts">
  import { APIErrorCode, APIService } from '@aneuhold/core-ts-api-lib';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { spyOn, userEvent, within } from 'storybook/test';
  import googleAuthService from '$services/GoogleAuth.service';
  import { type CurrentUser, currentUser } from '$stores/local/currentUser/currentUser';
  import { LoginState, loginState } from '$stores/session/loginState';
  import Login from './Login.svelte';

  const { Story } = defineMeta({
    title: 'Components/Login',
    tags: ['!autodocs'],
    component: Login,
    parameters: {
      // To remove the padding, because this component is meant to be centered in the viewport
      layout: 'fullscreen'
    },
    beforeEach: () => {
      const spy = spyOn(APIService, 'validateUser').mockResolvedValue({
        success: true,
        errors: [],
        data: {},
        statusCode: 200
      });
      return () => {
        loginState.set(LoginState.LoggedOut);
        spy.mockRestore();
      };
    }
  });

  /**
   * Sets the stored credentials that the login form prefills from.
   *
   * @param credentials The username and password to store.
   */
  const setStoredCredentials = (credentials: Pick<CurrentUser, 'username' | 'password'>) => {
    currentUser.setWithoutPropagation({ ...currentUser.get(), ...credentials });
  };
</script>

<!-- Empty State Story -->
<Story
  name="Empty State"
  beforeEach={() => {
    setStoredCredentials({ username: '', password: '' });
  }}
/>

<!-- Filled In Story -->
<Story
  name="Filled In"
  beforeEach={() => {
    setStoredCredentials({ username: 'test', password: 'test' });
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
      data: {},
      statusCode: 403,
      errorCode: APIErrorCode.NoProjectAccess
    });
    setStoredCredentials({ username: 'test', password: 'test' });
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const loginButton = canvas.getByTestId('login-submit-button');
    await userEvent.click(loginButton);
    // Verify invalid credentials message appears (getByText throws if not found)
    canvas.getByText(/Invalid username or password/i);
  }}
/>

<!-- Google Sign-In Error: signIn rejects so the inline error renders below the Google button. -->
<Story
  name="Google Sign-In Error"
  beforeEach={() => {
    spyOn(googleAuthService, 'init').mockResolvedValue(undefined);
    spyOn(googleAuthService, 'signIn').mockRejectedValue(new Error('Mock sign-in failure'));
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const googleButton = canvas.getByRole('button', { name: /Continue with Google/i });
    await userEvent.click(googleButton);
  }}
/>
