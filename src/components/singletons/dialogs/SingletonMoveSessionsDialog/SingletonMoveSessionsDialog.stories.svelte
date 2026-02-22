<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { userEvent, within } from 'storybook/test';
  import SBSingletonMoveSessionsDialogExample from './SBSingletonMoveSessionsDialogExample.svelte';

  const storyModeEnum = {
    late: 'late',
    severelyLate: 'severelyLate',
    error: 'error'
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

<Story
  name="Error State"
  args={{ storyMode: 'error' }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openButton = canvas.getByTestId('open-dialog-button');
    await userEvent.click(openButton);
    const confirmButton = await within(document.body).findByText('Confirm');
    await userEvent.click(confirmButton);
  }}
/>
