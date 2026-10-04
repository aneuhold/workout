/**
 * A CSS-pixel viewport size.
 */
type PlayStoreViewportSize = { width: number; height: number };

/**
 * CSS-pixel viewport sizes for each Play Store asset.
 */
export const PLAY_STORE_VIEWPORTS = {
  /**
   * A phone screenshot. 540×960 sits below Tailwind's `sm` (640px) breakpoint
   * so the app renders its mobile layout, and a 2× device scale factor turns it
   * into a 1080×1920 capture.
   */
  screenshot: { width: 540, height: 960 },
  /**
   * The feature graphic, which the 2× device scale factor turns into the
   * required 1024×500 capture.
   */
  featureGraphic: { width: 512, height: 250 }
} as const;

/**
 * Builds the Storybook `parameters.viewport` and `globals` that size a story's
 * iframe to `size`, for spreading into a story or `defineMeta`.
 *
 * @param size The CSS-pixel viewport size.
 */
export const playStoreViewportStoryConfig = (size: PlayStoreViewportSize) => ({
  parameters: {
    viewport: {
      options: {
        playStore: {
          name: `Play Store (${size.width}x${size.height})`,
          styles: { width: `${size.width}px`, height: `${size.height}px` },
          type: 'mobile'
        }
      }
    }
  },
  globals: { viewport: { value: 'playStore', isRotated: false } }
});
