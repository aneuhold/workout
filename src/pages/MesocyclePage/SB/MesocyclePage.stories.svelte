<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBMesocyclePageExample from './SBMesocyclePageExample.svelte';

  const storyModeEnum = {
    new: 'new',
    edit: 'edit',
    static: 'static',
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
      storyMode: 'new'
    }
  });
</script>

<Story name="New" />

<Story name="Edit (Not Started)" args={{ storyMode: 'edit' }} />

<Story name="View (Started)" args={{ storyMode: 'static' }} />

<Story name="Not Found" args={{ storyMode: 'notFound' }} />
