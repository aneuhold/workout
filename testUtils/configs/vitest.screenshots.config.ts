import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';
import type { BrowserCommand } from 'vitest/node';
import { PLAY_STORE_VIEWPORT } from '../../scripts/constants/playStoreViewport';
import playStoreAssetsService from '../../scripts/services/PlayStoreAssets.service';
import { viteConfig } from '../../vite.config';

/**
 * Captures the test iframe as rendered, clipped to its viewport, and saves it
 * as a Play Store screenshot.
 *
 * @param context - Vitest's command context for the Playwright provider.
 * @param name - File name for the screenshot, without the extension.
 */
const writePlayStoreScreenshot: BrowserCommand<[name: string]> = async (context, name) => {
  const iframe = await (await context.frame()).frameElement();
  playStoreAssetsService.writeScreenshot(await iframe.screenshot({ type: 'png' }), name);
};

/**
 * Vitest config that renders every story tagged `playstore-screenshot` in
 * headless Chromium, runs its play function, and saves a screenshot of each
 * one for the Play Store listing.
 *
 * The stories size the test iframe to `PLAY_STORE_VIEWPORT`, and the browser
 * window here matches it, because Vitest scales the iframe down whenever the
 * window is smaller. The 2× device scale factor doubles the capture's pixels.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [
      storybookTest({ configDir: '.storybook', tags: { include: ['playstore-screenshot'] } })
    ],
    test: {
      name: 'playstore-screenshots',
      browser: {
        enabled: true,
        headless: true,
        provider: playwright({
          contextOptions: { viewport: PLAY_STORE_VIEWPORT, deviceScaleFactor: 2 }
        }),
        instances: [{ browser: 'chromium' }],
        // Custom commands run in Node.js, where the file system is available,
        // while the tests only have access to the browser.
        commands: { writePlayStoreScreenshot }
      },
      setupFiles: ['./testUtils/vitest-screenshots-setup.ts']
    }
  })
);
