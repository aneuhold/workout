<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBOnboardingEmptyStateExample from './SBOnboardingEmptyStateExample.svelte';

  const storyModeEnum = {
    noCalibrations: 'noCalibrations',
    fewCalibrations: 'fewCalibrations',
    readyWithButton: 'readyWithButton',
    readyWithoutButton: 'readyWithoutButton'
  } as const;

  const { Story } = defineMeta({
    title: 'Components/OnboardingEmptyState',
    tags: ['!autodocs'],
    component: SBOnboardingEmptyStateExample,
    argTypes: {
      storyMode: createEnumArgType(storyModeEnum)
    },
    args: {
      storyMode: 'noCalibrations'
    }
  });
</script>

<Story name="No Calibrations" args={{ storyMode: 'noCalibrations' }} />

<Story name="Few Calibrations" args={{ storyMode: 'fewCalibrations' }} />

<Story name="Ready With Button" args={{ storyMode: 'readyWithButton' }} />

<Story name="Ready Without Button" args={{ storyMode: 'readyWithoutButton' }} />
