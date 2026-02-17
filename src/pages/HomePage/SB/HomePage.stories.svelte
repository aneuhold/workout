<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBHomePageExample from './SBHomePageExample.svelte';

  const storyModeEnum = {
    default: 'default',
    empty: 'empty',
    allComplete: 'allComplete',
    review: 'review',
    inProgress: 'inProgress',
    inProgressReview: 'inProgressReview'
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

<Story name="Empty" args={{ storyMode: 'empty' }} />

<Story name="All Complete" args={{ storyMode: 'allComplete' }} />

<Story name="Review Needed" args={{ storyMode: 'review' }} />

<Story name="Session In Progress" args={{ storyMode: 'inProgress' }} />

<Story name="Session In Progress + Review Needed" args={{ storyMode: 'inProgressReview' }} />
