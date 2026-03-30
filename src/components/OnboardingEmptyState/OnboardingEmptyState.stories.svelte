<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBOnboardingEmptyStateExample, {
    OnboardingStoryMode
  } from './SBOnboardingEmptyStateExample.svelte';

  const { Story } = defineMeta({
    title: 'Components/OnboardingEmptyState',
    tags: ['!autodocs'],
    component: SBOnboardingEmptyStateExample,
    argTypes: {
      storyMode: createEnumArgType(OnboardingStoryMode)
    },
    args: {
      storyMode: OnboardingStoryMode.HomePageReady
    }
  });
</script>

<Story
  name="Home Page (No Calibrations)"
  args={{ storyMode: OnboardingStoryMode.HomePageNoCalibrations }}
/>

<Story
  name="Home Page (Few Calibrations)"
  args={{ storyMode: OnboardingStoryMode.HomePageFewCalibrations }}
/>

<Story name="Home Page (Ready)" args={{ storyMode: OnboardingStoryMode.HomePageReady }} />

<Story name="Sessions Page (Ready)" args={{ storyMode: OnboardingStoryMode.SessionsPageReady }} />

<Story
  name="Mesocycles Page (Ready)"
  args={{ storyMode: OnboardingStoryMode.MesocyclesPageReady }}
/>
