<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SBSingletonMoveSessionsDialogExample from './SBSingletonMoveSessionsDialogExample.svelte';

  const storyModeEnum = {
    late: 'late',
    severelyLate: 'severelyLate'
  } as const;

  const { Story } = defineMeta({
    tags: ['!autodocs'],
    title: 'Singletons/MoveSessionsDialog',
    component: SBSingletonMoveSessionsDialogExample,
    argTypes: {
      storyMode: {
        control: { type: 'select' },
        options: Object.values(storyModeEnum)
      }
    },
    args: {
      storyMode: 'late'
    }
  });
</script>

<Story name="Late (No Deload)" args={{ storyMode: 'late' }} />

<Story name="Severely Late (With Deload Offer)" args={{ storyMode: 'severelyLate' }} />
