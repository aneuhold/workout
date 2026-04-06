<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBHomePageExample, { HomePageStoryMode } from './SBHomePageExample.svelte';

  const { Story } = defineMeta({
    title: 'Pages/HomePage',
    tags: ['!autodocs'],
    component: SBHomePageExample,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      storyMode: createEnumArgType(HomePageStoryMode)
    },
    args: {
      storyMode: HomePageStoryMode.Default
    }
  });
</script>

<Story name="Default" />

<Story name="All Complete" args={{ storyMode: HomePageStoryMode.AllComplete }} />

<Story
  name="Mesocycle Complete (Blocked)"
  args={{ storyMode: HomePageStoryMode.AllCompleteBlocked }}
/>

<Story name="Review Needed" args={{ storyMode: HomePageStoryMode.Review }} />

<Story name="Session In Progress" args={{ storyMode: HomePageStoryMode.InProgress }} />

<Story
  name="Session In Progress + Review Needed"
  args={{ storyMode: HomePageStoryMode.InProgressReview }}
/>

<Story name="Microcycle Complete" args={{ storyMode: HomePageStoryMode.MicrocycleComplete }} />

<Story
  name="Microcycle Complete (Blocked)"
  args={{ storyMode: HomePageStoryMode.MicrocycleCompleteBlocked }}
/>

<Story
  name="Microcycle Complete (Deload Trigger)"
  args={{ storyMode: HomePageStoryMode.MicrocycleCompleteDeload }}
/>

<Story name="Mesocycle Start" args={{ storyMode: HomePageStoryMode.MesocycleStart }} />

<Story name="Late Session (1-2 Days)" args={{ storyMode: HomePageStoryMode.LateSession }} />

<Story
  name="Severely Late Session (3+ Days)"
  args={{ storyMode: HomePageStoryMode.SeverelyLateSession }}
/>

<Story name="Free-Form (No Mesocycle)" args={{ storyMode: HomePageStoryMode.FreeFormEmpty }} />

<Story
  name="Free-Form In Progress (No Mesocycle)"
  args={{ storyMode: HomePageStoryMode.FreeFormInProgress }}
/>

<Story
  name="Free-Form + Active Mesocycle"
  args={{ storyMode: HomePageStoryMode.FreeFormWithMesocycle }}
/>

<Story name="Free-Form Planned" args={{ storyMode: HomePageStoryMode.FreeFormPlanned }} />

<Story
  name="Free-Form In Progress + Planned"
  args={{ storyMode: HomePageStoryMode.FreeFormInProgressAndPlanned }}
/>
