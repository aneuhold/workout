<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import GoogleSignInButtonPresentational from './GoogleSignInButtonPresentational.svelte';

  const { Story } = defineMeta({
    title: 'Components/GoogleSignInButtonPresentational',
    component: GoogleSignInButtonPresentational,
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
