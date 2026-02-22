<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SBSingletonDeloadDialogExample from './SBSingletonDeloadDialogExample.svelte';

  const storyModeEnum = {
    withScheduled: 'withScheduled',
    immediateOnly: 'immediateOnly'
  } as const;

  const { Story } = defineMeta({
    tags: ['!autodocs'],
    title: 'Singletons/DeloadDialog',
    component: SBSingletonDeloadDialogExample,
    argTypes: {
      storyMode: {
        control: { type: 'select' },
        options: Object.values(storyModeEnum)
      }
    },
    args: {
      storyMode: 'withScheduled'
    }
  });
</script>

<Story name="Both Date Options" args={{ storyMode: 'withScheduled' }} />

<Story name="Immediate Only" args={{ storyMode: 'immediateOnly' }} />
