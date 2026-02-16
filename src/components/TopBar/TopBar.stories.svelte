<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ApiActivityState } from '$services/ApiActivityService/ApiActivityService.svelte';
  import {
    createBoolArgTypes,
    createEnumArgType,
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
      ...createNumberArgTypes('timerSeconds'),
      syncState: createEnumArgType(ApiActivityState)
    },
    args: {
      username: 'John Doe',
      timerActive: false,
      timerSeconds: 90,
      syncState: ApiActivityState.Idle
    }
  });
</script>

<!-- Idle state -->
<Story name="Idle" args={{ timerActive: false }} />

<!-- Timer Active -->
<Story name="Timer Active" args={{ timerActive: true, timerSeconds: 90 }} />

<!-- Syncing -->
<Story name="Syncing" args={{ syncState: ApiActivityState.Syncing }} />

<!-- Sync Complete -->
<Story name="Sync Complete" args={{ syncState: ApiActivityState.Success }} />

<!-- Sync Error -->
<Story name="Sync Error" args={{ syncState: ApiActivityState.Error }} />
