<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBMesocyclesPageExample, {
    MesocyclesPageStoryMode
  } from './SBMesocyclesPageExample.svelte';

  const { Story } = defineMeta({
    title: 'Pages/MesocyclesPage',
    tags: ['!autodocs'],
    component: SBMesocyclesPageExample,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      storyMode: createEnumArgType(MesocyclesPageStoryMode)
    },
    args: {
      storyMode: MesocyclesPageStoryMode.Default
    }
  });
</script>

<Story name="Default" />

<Story name="No Active Mesocycle" args={{ storyMode: MesocyclesPageStoryMode.NoActive }} />
