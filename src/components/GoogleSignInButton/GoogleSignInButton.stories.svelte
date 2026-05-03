<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { fn, spyOn, userEvent, within } from 'storybook/test';
  import googleAuthService from '$services/GoogleAuthService';
  import GoogleSignInButton from './GoogleSignInButton.svelte';

  const { Story } = defineMeta({
    title: 'Components/GoogleSignInButton',
    component: GoogleSignInButton,
    args: {
      onIdToken: fn(),
      disabled: false
    },
    argTypes: {
      disabled: { control: { type: 'boolean' } }
    },
    beforeEach: () => {
      // Stub the auth service so stories don't hit the real Capacitor /
      // Google plugin. Default behavior pretends the user cancelled the
      // popup; specific stories override `signIn` to drive other states.
      const initSpy = spyOn(googleAuthService, 'init').mockResolvedValue(undefined);
      const signInSpy = spyOn(googleAuthService, 'signIn').mockResolvedValue(null);
      return () => {
        initSpy.mockRestore();
        signInSpy.mockRestore();
      };
    }
  });
</script>

<Story name="Default" />

<Story name="Disabled" args={{ disabled: true }} />

<!-- In-flight: signIn never resolves so the button stays disabled mid-click. -->
<Story
  name="Signing In"
  beforeEach={() => {
    spyOn(googleAuthService, 'signIn').mockReturnValue(new Promise(() => {}));
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
  }}
/>

<!-- Error: signIn rejects so the inline error message appears. -->
<Story
  name="Error"
  beforeEach={() => {
    spyOn(googleAuthService, 'signIn').mockRejectedValue(new Error('Mock sign-in failure'));
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
    await canvas.findByText(/Google sign-in failed/i);
  }}
/>
