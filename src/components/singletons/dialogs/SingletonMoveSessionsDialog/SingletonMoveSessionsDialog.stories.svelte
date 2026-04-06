<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { userEvent, within } from 'storybook/test';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBSingletonMoveSessionsDialogExample, {
    MoveSessionsStoryMode
  } from './SBSingletonMoveSessionsDialogExample.svelte';

  const { Story } = defineMeta({
    tags: ['!autodocs'],
    title: 'Singletons/MoveSessionsDialog',
    component: SBSingletonMoveSessionsDialogExample,
    argTypes: {
      storyMode: createEnumArgType(MoveSessionsStoryMode)
    },
    args: {
      storyMode: MoveSessionsStoryMode.Late
    }
  });
</script>

<Story name="Late (No Deload)" args={{ storyMode: MoveSessionsStoryMode.Late }} />

<Story
  name="Severely Late (With Deload Offer)"
  args={{ storyMode: MoveSessionsStoryMode.SeverelyLate }}
/>

<Story
  name="Error State"
  args={{ storyMode: MoveSessionsStoryMode.Error }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openButton = canvas.getByTestId('open-dialog-button');
    await userEvent.click(openButton);
    const confirmButton = await within(document.body).findByText('Confirm');
    await userEvent.click(confirmButton);
  }}
/>
