<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SBSettingsPageExample from './SBSettingsPageExample.svelte';

  const { Story } = defineMeta({
    title: 'Pages/SettingsPage',
    tags: ['!autodocs'],
    component: SBSettingsPageExample,
    parameters: {
      layout: 'fullscreen'
    }
  });
</script>

<Story name="Default" />
