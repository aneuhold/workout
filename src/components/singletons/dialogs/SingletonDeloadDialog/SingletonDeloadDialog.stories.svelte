<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { userEvent, within } from 'storybook/test';
  import SBSingletonDeloadDialogExample from './SBSingletonDeloadDialogExample.svelte';

  const storyModeEnum = {
    withScheduled: 'withScheduled',
    immediateOnly: 'immediateOnly',
    error: 'error',
    suggested: 'suggested',
    recommended: 'recommended',
    urgent: 'urgent'
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

<Story
  name="Error State"
  args={{ storyMode: 'error' }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openButton = canvas.getByTestId('open-dialog-button');
    await userEvent.click(openButton);
    const confirmButton = await within(document.body).findByText('Start Deload');
    await userEvent.click(confirmButton);
  }}
/>

<Story name="Fatigue Warning - Suggested" args={{ storyMode: 'suggested' }} />

<Story name="Fatigue Warning - Recommended" args={{ storyMode: 'recommended' }} />

<Story name="Fatigue Warning - Urgent" args={{ storyMode: 'urgent' }} />
