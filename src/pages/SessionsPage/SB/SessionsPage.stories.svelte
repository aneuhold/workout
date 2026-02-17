<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBSessionsPageExample from './SBSessionsPageExample.svelte';

  const storyModeEnum = {
    default: 'default',
    empty: 'empty',
    allComplete: 'allComplete',
    review: 'review'
  } as const;

  const { Story } = defineMeta({
    title: 'Pages/SessionsPage',
    tags: ['!autodocs'],
    component: SBSessionsPageExample,
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
