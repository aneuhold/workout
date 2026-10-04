import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';
import type { BrowserCommand } from 'vitest/node';
import { PLAY_STORE_VIEWPORTS } from '../../scripts/constants/playStoreViewport';
import playStoreAssetsService from '../../scripts/services/PlayStoreAssets.service';
import { viteConfig } from '../../vite.config';

/**
 * Captures the test iframe as rendered, clipped to its viewport, and saves it
 * as a Play Store asset.
 *
 * @param context - Vitest's command context for the Playwright provider.
 * @param name - The capture's name, without the extension.
 */
const writePlayStoreAsset: BrowserCommand<[name: string]> = async (context, name) => {
  const iframe = await (await context.frame()).frameElement();
  playStoreAssetsService.writeAsset(await iframe.screenshot({ type: 'png' }), name);
};

const assetViewports = Object.values(PLAY_STORE_VIEWPORTS);

/**
 * Vitest config that renders every story tagged `playstore-asset` in headless
 * Chromium, runs its play function, and saves a capture of each one for the
 * Play Store listing.
 *
 * The stories size the test iframe to their asset's viewport, and the browser
 * window covers the largest of them, because Vitest scales an iframe down when
 * the window is smaller, which would shrink the capture. The 2× device scale
 * factor doubles the capture's pixels.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [storybookTest({ configDir: '.storybook', tags: { include: ['playstore-asset'] } })],
    test: {
      name: 'playstore-assets',
      // Each stories file resizes its iframe to its asset's viewport. Running files in parallel
      // detaches one file's iframe while another is being captured.
      fileParallelism: false,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright({
          contextOptions: {
            viewport: {
              width: Math.max(...assetViewports.map(({ width }) => width)),
              height: Math.max(...assetViewports.map(({ height }) => height))
            },
            deviceScaleFactor: 2
          }
        }),
        instances: [{ browser: 'chromium' }],
        // Custom commands run in Node.js, where the file system is available,
        // while the tests only have access to the browser.
        commands: { writePlayStoreAsset }
      },
      setupFiles: ['./testUtils/vitest-screenshots-setup.ts']
    }
  })
);
