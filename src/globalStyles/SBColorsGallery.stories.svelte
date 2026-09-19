<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SBColorsGallery from './SBColorsGallery.svelte';

  const { Story } = defineMeta({
    title: 'Design System/Colors',
    component: SBColorsGallery,
    tags: ['!autodocs']
  });
</script>

<Story name="Colors" />
