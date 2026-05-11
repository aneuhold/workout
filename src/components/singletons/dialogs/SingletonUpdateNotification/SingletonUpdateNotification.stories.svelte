<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { userEvent, within } from 'storybook/test';
  import SBSingletonUpdateNotificationExample from './SBSingletonUpdateNotificationExample.svelte';

  const { Story } = defineMeta({
    tags: ['!autodocs'],
    title: 'Singletons/UpdateNotificationDialog',
    component: SBSingletonUpdateNotificationExample
  });
</script>

<Story
  name="Default"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openButton = canvas.getByTestId('open-dialog-button');
    await userEvent.click(openButton);
  }}
/>
