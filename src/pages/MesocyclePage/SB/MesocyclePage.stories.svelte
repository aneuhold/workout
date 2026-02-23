<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBMesocyclePageExample from './SBMesocyclePageExample.svelte';

  const storyModeEnum = {
    new: 'new',
    newWithExisting: 'newWithExisting',
    newOverlapping: 'newOverlapping',
    edit: 'edit',
    static: 'static',
    completed: 'completed',
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

<Story name="New (After Existing Mesocycle)" args={{ storyMode: 'newWithExisting' }} />

<Story name="New (Overlapping with Future Mesocycle)" args={{ storyMode: 'newOverlapping' }} />

<Story name="Edit (Not Started)" args={{ storyMode: 'edit' }} />

<Story name="View (Active)" args={{ storyMode: 'static' }} />

<Story name="View (Completed)" args={{ storyMode: 'completed' }} />

<Story name="Not Found" args={{ storyMode: 'notFound' }} />
