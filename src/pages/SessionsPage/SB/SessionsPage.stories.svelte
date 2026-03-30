<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType } from '$storybook/storybookUtil';
  import SBSessionsPageExample, { SessionsPageStoryMode } from './SBSessionsPageExample.svelte';

  const { Story } = defineMeta({
    title: 'Pages/SessionsPage',
    tags: ['!autodocs'],
    component: SBSessionsPageExample,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      storyMode: createEnumArgType(SessionsPageStoryMode)
    },
    args: {
      storyMode: SessionsPageStoryMode.Default
    }
  });
</script>

<Story name="Default" />

<Story name="All Complete" args={{ storyMode: SessionsPageStoryMode.AllComplete }} />

<Story name="Review Needed" args={{ storyMode: SessionsPageStoryMode.Review }} />

<Story name="Free-Form Only" args={{ storyMode: SessionsPageStoryMode.FreeFormOnly }} />

<Story
  name="Free-Form + Mesocycle"
  args={{ storyMode: SessionsPageStoryMode.FreeFormWithMesocycle }}
/>
