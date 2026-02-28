<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBHomePageExample from './SBHomePageExample.svelte';

  const storyModeEnum = {
    default: 'default',
    allComplete: 'allComplete',
    review: 'review',
    inProgress: 'inProgress',
    inProgressReview: 'inProgressReview',
    microcycleComplete: 'microcycleComplete',
    microcycleCompleteBlocked: 'microcycleCompleteBlocked',
    mesocycleStart: 'mesocycleStart',
    lateSession: 'lateSession',
    severelyLateSession: 'severelyLateSession'
  } as const;

  const { Story } = defineMeta({
    title: 'Pages/HomePage',
    tags: ['!autodocs'],
    component: SBHomePageExample,
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

<Story name="All Complete" args={{ storyMode: 'allComplete' }} />

<Story name="Review Needed" args={{ storyMode: 'review' }} />

<Story name="Session In Progress" args={{ storyMode: 'inProgress' }} />

<Story name="Session In Progress + Review Needed" args={{ storyMode: 'inProgressReview' }} />

<Story name="Microcycle Complete" args={{ storyMode: 'microcycleComplete' }} />

<Story name="Microcycle Complete (Blocked)" args={{ storyMode: 'microcycleCompleteBlocked' }} />

<Story name="Mesocycle Start" args={{ storyMode: 'mesocycleStart' }} />

<Story name="Late Session (1-2 Days)" args={{ storyMode: 'lateSession' }} />

<Story name="Severely Late Session (3+ Days)" args={{ storyMode: 'severelyLateSession' }} />
