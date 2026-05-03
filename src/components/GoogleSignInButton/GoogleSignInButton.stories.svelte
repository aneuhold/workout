<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import GoogleSignInButton from './GoogleSignInButton.svelte';

  const { Story } = defineMeta({
    title: 'Components/GoogleSignInButton',
    component: GoogleSignInButton,
    args: {
      onclick: () => alert('Sign-in clicked'),
      disabled: false
    },
    argTypes: {
      disabled: { control: { type: 'boolean' } }
    }
  });
</script>

<Story name="Default" />

<Story name="Disabled" args={{ disabled: true }} />
