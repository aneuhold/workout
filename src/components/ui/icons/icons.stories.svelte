<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SBIconsGallery from './SBIconsGallery.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Icons',
    component: SBIconsGallery,
    tags: ['!autodocs']
  });
</script>

<Story name="Gallery" />
