<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBMesocyclePageExample from './SBMesocyclePageExample.svelte';

  const storyModeEnum = {
    default: 'default',
    noId: 'noId',
    notFound: 'notFound'
  } as const;

  const { Story } = defineMeta({
    title: 'Pages/MesocyclePage',
    tags: ['!autodocs'],
    component: SBMesocyclePageExample,
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

<Story name="No ID" args={{ storyMode: 'noId' }} />

<Story name="Not Found" args={{ storyMode: 'notFound' }} />
