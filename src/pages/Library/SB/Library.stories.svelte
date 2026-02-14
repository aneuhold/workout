<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createBoolArgTypes } from '$storybook/storybookUtil';
  import SBLibraryExample from './SBLibraryExample.svelte';

  const { Story } = defineMeta({
    title: 'Pages/Library',
    component: SBLibraryExample,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      ...createBoolArgTypes('populateDefaultData')
    },
    args: {
      populateDefaultData: true
    }
  });
</script>

<Story name="Default" />

<Story name="Empty Library" args={{ populateDefaultData: false }} />
