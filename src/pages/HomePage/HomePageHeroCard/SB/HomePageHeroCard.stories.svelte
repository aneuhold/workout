<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBHomePageHeroCardExample, {
    HomePageHeroCardStoryMode
  } from './SBHomePageHeroCardExample.svelte';

  const { Story } = defineMeta({
    title: 'Components/HomePageHeroCard',
    tags: ['!autodocs'],
    component: SBHomePageHeroCardExample,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      storyMode: createEnumArgType(HomePageHeroCardStoryMode)
    },
    args: {
      storyMode: HomePageHeroCardStoryMode.StartSession
    }
  });
</script>

<Story name="Continue Session" args={{ storyMode: HomePageHeroCardStoryMode.ContinueSession }} />

<Story
  name="Free-Form In Progress"
  args={{ storyMode: HomePageHeroCardStoryMode.FreeFormInProgress }}
/>

<Story
  name="Free-Form + Active Mesocycle"
  args={{ storyMode: HomePageHeroCardStoryMode.FreeFormWithMesocycle }}
/>

<Story name="Start Session" args={{ storyMode: HomePageHeroCardStoryMode.StartSession }} />

<Story
  name="Start Session (Late)"
  args={{ storyMode: HomePageHeroCardStoryMode.StartSessionLate }}
/>

<Story
  name="Start Session (Severely Late)"
  args={{ storyMode: HomePageHeroCardStoryMode.StartSessionSeverelyLate }}
/>

<Story
  name="Complete Microcycle"
  args={{ storyMode: HomePageHeroCardStoryMode.CompleteMicrocycle }}
/>

<Story
  name="Complete Microcycle (Blocked)"
  args={{ storyMode: HomePageHeroCardStoryMode.CompleteMicrocycleBlocked }}
/>

<Story name="Edit Mesocycle" args={{ storyMode: HomePageHeroCardStoryMode.EditMesocycle }} />

<Story name="Start Mesocycle" args={{ storyMode: HomePageHeroCardStoryMode.StartMesocycle }} />

<Story
  name="Complete Mesocycle"
  args={{ storyMode: HomePageHeroCardStoryMode.CompleteMesocycle }}
/>

<Story
  name="Complete Mesocycle (Blocked)"
  args={{ storyMode: HomePageHeroCardStoryMode.CompleteMesocycleBlocked }}
/>
