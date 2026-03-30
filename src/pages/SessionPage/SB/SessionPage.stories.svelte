<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBSessionPageExample, { SessionPageStoryMode } from './SBSessionPageExample.svelte';

  const { Story } = defineMeta({
    title: 'Pages/SessionPage',
    tags: ['!autodocs'],
    component: SBSessionPageExample,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      storyMode: createEnumArgType(SessionPageStoryMode)
    },
    args: {
      storyMode: SessionPageStoryMode.ActiveEarly
    }
  });
</script>

<Story name="Active (Early)" args={{ storyMode: SessionPageStoryMode.ActiveEarly }} />

<Story name="Active (Mid-Session)" args={{ storyMode: SessionPageStoryMode.ActiveMid }} />

<Story
  name="Active (Previous Soreness)"
  args={{ storyMode: SessionPageStoryMode.ActivePrevSoreness }}
/>

<Story name="Deload Session" args={{ storyMode: SessionPageStoryMode.Deload }} />

<Story name="Recovery Exercises" args={{ storyMode: SessionPageStoryMode.Recovery }} />

<Story name="Post-Session Review" args={{ storyMode: SessionPageStoryMode.Review }} />

<Story name="View Only" args={{ storyMode: SessionPageStoryMode.ViewOnly }} />

<Story
  name="View (Soreness Editable)"
  args={{ storyMode: SessionPageStoryMode.ViewSorenessEditable }}
/>

<Story name="Free-Form (Empty)" args={{ storyMode: SessionPageStoryMode.FreeFormEmpty }} />

<Story
  name="Free-Form (Mid-Workout)"
  args={{ storyMode: SessionPageStoryMode.FreeFormMidWorkout }}
/>

<Story name="Free-Form (All Done)" args={{ storyMode: SessionPageStoryMode.FreeFormAllDone }} />

<Story name="Free-Form (Completed)" args={{ storyMode: SessionPageStoryMode.FreeFormCompleted }} />
