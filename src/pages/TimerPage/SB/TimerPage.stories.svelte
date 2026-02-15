<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createBoolArgTypes, createNumberArgTypes } from '$storybook/storybookUtil';
  import SBTimerPageExample from './SBTimerPageExample.svelte';

  const { Story } = defineMeta({
    title: 'Pages/TimerPage',
    tags: ['!autodocs'],
    component: SBTimerPageExample,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      ...createBoolArgTypes('timerActive'),
      ...createNumberArgTypes('timerSeconds')
    },
    args: {
      timerActive: false,
      timerSeconds: 90
    }
  });
</script>

<Story name="Idle" />

<Story name="Active" args={{ timerActive: true, timerSeconds: 90 }} />

<Story name="Last 5 Seconds" args={{ timerActive: true, timerSeconds: 4 }} />
