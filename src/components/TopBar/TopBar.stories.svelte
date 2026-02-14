<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    createBoolArgTypes,
    createNumberArgTypes,
    createTextArgTypes
  } from '$storybook/storybookUtil';
  import SBTopBarExample from './SBTopBarExample.svelte';

  const { Story } = defineMeta({
    title: 'Components/TopBar',
    tags: ['!autodocs'],
    component: SBTopBarExample,
    argTypes: {
      ...createTextArgTypes('username'),
      ...createBoolArgTypes('timerActive'),
      ...createNumberArgTypes('timerSeconds')
    },
    args: {
      username: 'John Doe',
      timerActive: false,
      timerSeconds: 90
    }
  });
</script>

<!-- Idle state -->
<Story name="Idle" args={{ timerActive: false }} />

<!-- Timer Active -->
<Story name="Timer Active" args={{ timerActive: true, timerSeconds: 90 }} />
