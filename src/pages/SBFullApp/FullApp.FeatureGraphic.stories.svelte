<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    PLAY_STORE_VIEWPORTS,
    playStoreViewportStoryConfig
  } from '../../../scripts/constants/playStoreViewport';
  import SBPlayStoreFeatureGraphic from './SBPlayStoreFeatureGraphic.svelte';

  const viewportConfig = playStoreViewportStoryConfig(PLAY_STORE_VIEWPORTS.featureGraphic);

  /**
   * `pnpm generate:assets` captures this story, which is tagged
   * `playstore-asset`, as the Play Store feature graphic.
   */
  const { Story } = defineMeta({
    title: 'Full App/Feature Graphic',
    component: SBPlayStoreFeatureGraphic,
    tags: ['playstore-asset', '!autodocs'],
    parameters: { layout: 'fullscreen', ...viewportConfig.parameters },
    globals: viewportConfig.globals
  });
</script>

<Story name="Feature Graphic" />
