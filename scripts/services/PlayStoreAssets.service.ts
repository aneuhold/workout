import { chromium } from '@playwright/test';
import { mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { PROJECT_ROOT } from '../constants/projectRoot';
import scriptCLIService from './ScriptCLI.service';

/**
 * Writes the Play Store listing images: the feature graphic rendered from its
 * HTML template, and the phone screenshots captured from Storybook stories.
 *
 * Every output is a 24-bit PNG with no alpha channel, which Google's
 * [asset specs](https://support.google.com/googleplay/android-developer/answer/9866151)
 * require.
 */
class PlayStoreAssetsService {
  readonly #outputDir = join(PROJECT_ROOT, 'android/play-store-assets');
  readonly #screenshotDir = join(this.#outputDir, 'screenshots');
  readonly #featureGraphicHtmlPath = join(
    PROJECT_ROOT,
    'scripts/commands/renderFeatureGraphic/feature-graphic.html'
  );

  /**
   * Renders `feature-graphic.html` to a 1024×500 PNG.
   */
  async renderFeatureGraphic(): Promise<void> {
    mkdirSync(this.#outputDir, { recursive: true });
    const outputPath = join(this.#outputDir, 'feature-graphic-1024x500.png');
    const rgbaPath = outputPath.replace(/\.png$/, '.rgba.png');
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({
        viewport: { width: 1024, height: 500 },
        deviceScaleFactor: 1
      });
      const page = await context.newPage();
      await page.goto(pathToFileURL(this.#featureGraphicHtmlPath).href, {
        waitUntil: 'networkidle'
      });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: rgbaPath, type: 'png' });
    } finally {
      await browser.close();
    }
    this.#flattenToOpaquePng(rgbaPath, outputPath);
  }

  /**
   * Writes a captured screenshot into the Play Store screenshots folder as
   * `<name>.png` without an alpha channel.
   *
   * @param png - The RGBA PNG capture.
   * @param name - File name for the output, without the extension.
   */
  writeScreenshot(png: Buffer, name: string): void {
    mkdirSync(this.#screenshotDir, { recursive: true });
    const outputPath = join(this.#screenshotDir, `${name}.png`);
    const rgbaPath = outputPath.replace(/\.png$/, '.rgba.png');
    writeFileSync(rgbaPath, png);
    this.#flattenToOpaquePng(rgbaPath, outputPath);
  }

  /**
   * Converts an RGBA PNG to `outputPath` with the alpha channel removed, then
   * deletes the source. Browsers always capture RGBA, so every output passes
   * through `magick`.
   *
   * @param rgbaPath - Absolute path of the RGBA PNG to convert.
   * @param outputPath - Absolute path of the final `.png` file.
   */
  #flattenToOpaquePng(rgbaPath: string, outputPath: string): void {
    try {
      scriptCLIService.run(`magick "${rgbaPath}" -alpha off "${outputPath}"`, PROJECT_ROOT);
    } finally {
      unlinkSync(rgbaPath);
    }
    console.log(`wrote ${outputPath}`);
  }
}

const playStoreAssetsService = new PlayStoreAssetsService();
export default playStoreAssetsService;
