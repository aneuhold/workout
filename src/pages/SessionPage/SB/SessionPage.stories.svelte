<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBSessionPageExample from './SBSessionPageExample.svelte';

  const storyModes = {
    activeEarly: 'activeEarly',
    activeMid: 'activeMid',
    review: 'review',
    viewOnly: 'viewOnly'
  };

  const { Story } = defineMeta({
    title: 'Pages/SessionPage',
    tags: ['!autodocs'],
    component: SBSessionPageExample,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      storyMode: createEnumArgType(storyModes)
    },
    args: {
      storyMode: 'activeEarly'
    }
  });
</script>

<Story name="Active (Early)" args={{ storyMode: 'activeEarly' }} />

<Story name="Active (Mid-Session)" args={{ storyMode: 'activeMid' }} />

<Story name="Post-Session Review" args={{ storyMode: 'review' }} />

<Story name="View Only" args={{ storyMode: 'viewOnly' }} />
