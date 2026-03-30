<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBMesocyclePageExample, { MesocyclePageStoryMode } from './SBMesocyclePageExample.svelte';

  const { Story } = defineMeta({
    title: 'Pages/MesocyclePage',
    tags: ['!autodocs'],
    component: SBMesocyclePageExample,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      storyMode: createEnumArgType(MesocyclePageStoryMode)
    },
    args: {
      storyMode: MesocyclePageStoryMode.New
    }
  });
</script>

<Story name="New" />

<Story
  name="New (After Existing Mesocycle)"
  args={{ storyMode: MesocyclePageStoryMode.NewWithExisting }}
/>

<Story
  name="New (Overlapping with Future Mesocycle)"
  args={{ storyMode: MesocyclePageStoryMode.NewOverlapping }}
/>

<Story name="Edit (Not Started)" args={{ storyMode: MesocyclePageStoryMode.Edit }} />

<Story name="View (Active)" args={{ storyMode: MesocyclePageStoryMode.Static }} />

<Story name="View (Completed)" args={{ storyMode: MesocyclePageStoryMode.Completed }} />

<Story name="Not Found" args={{ storyMode: MesocyclePageStoryMode.NotFound }} />
