<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { userEvent, within } from 'storybook/test';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBSingletonDeloadDialogExample, {
    DeloadDialogStoryMode
  } from './SBSingletonDeloadDialogExample.svelte';

  const { Story } = defineMeta({
    tags: ['!autodocs'],
    title: 'Singletons/DeloadDialog',
    component: SBSingletonDeloadDialogExample,
    argTypes: {
      storyMode: createEnumArgType(DeloadDialogStoryMode)
    },
    args: {
      storyMode: DeloadDialogStoryMode.WithScheduled
    }
  });
</script>

<Story name="Both Date Options" args={{ storyMode: DeloadDialogStoryMode.WithScheduled }} />

<Story name="Immediate Only" args={{ storyMode: DeloadDialogStoryMode.ImmediateOnly }} />

<Story
  name="Error State"
  args={{ storyMode: DeloadDialogStoryMode.Error }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openButton = canvas.getByTestId('open-dialog-button');
    await userEvent.click(openButton);
    const confirmButton = await within(document.body).findByText('Start Deload');
    await userEvent.click(confirmButton);
  }}
/>

<Story name="Fatigue Warning - Suggested" args={{ storyMode: DeloadDialogStoryMode.Suggested }} />

<Story
  name="Fatigue Warning - Recommended"
  args={{ storyMode: DeloadDialogStoryMode.Recommended }}
/>

<Story name="Fatigue Warning - Urgent" args={{ storyMode: DeloadDialogStoryMode.Urgent }} />
