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
      storyMode: OnboardingStoryMode.NoCalibrations
    }
  });
</script>

<Story name="No Calibrations" args={{ storyMode: OnboardingStoryMode.NoCalibrations }} />

<Story name="Few Calibrations" args={{ storyMode: OnboardingStoryMode.FewCalibrations }} />

<Story name="Ready With Button" args={{ storyMode: OnboardingStoryMode.ReadyWithButton }} />

<Story name="Ready Without Button" args={{ storyMode: OnboardingStoryMode.ReadyWithoutButton }} />
