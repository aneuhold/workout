<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBMesocyclesPageExample from './SBMesocyclesPageExample.svelte';

  const storyModeEnum = {
    default: 'default',
    empty: 'empty',
    emptyFewCalibrations: 'emptyFewCalibrations',
    emptyReady: 'emptyReady',
    noActive: 'noActive'
  } as const;

  const { Story } = defineMeta({
    title: 'Pages/MesocyclesPage',
    tags: ['!autodocs'],
    component: SBMesocyclesPageExample,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      storyMode: createEnumArgType(storyModeEnum)
    },
    args: {
      storyMode: 'default'
    }
  });
</script>

<Story name="Default" />

<Story name="Empty (No Calibrations)" args={{ storyMode: 'empty' }} />

<Story name="Empty (Few Calibrations)" args={{ storyMode: 'emptyFewCalibrations' }} />

<Story name="Empty (Ready)" args={{ storyMode: 'emptyReady' }} />

<Story name="No Active Mesocycle" args={{ storyMode: 'noActive' }} />
