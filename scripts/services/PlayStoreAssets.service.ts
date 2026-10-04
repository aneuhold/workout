import { mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { PROJECT_ROOT } from '../constants/projectRoot';
import scriptCLIService from './ScriptCLI.service';

/**
 * Writes the Play Store listing images captured from Storybook stories: the
 * feature graphic and the phone screenshots.
 *
 * Every output is a 24-bit PNG with no alpha channel, which Google's
 * [asset specs](https://support.google.com/googleplay/android-developer/answer/9866151)
 * require.
 */
class PlayStoreAssetsService {
  readonly #outputDir = join(PROJECT_ROOT, 'android/play-store-assets');
  readonly #screenshotDir = join(this.#outputDir, 'screenshots');
  /** Capture name of the feature graphic story, which isn't a screenshot. */
  readonly #featureGraphicName = 'feature-graphic';

  /**
   * Writes a story capture without an alpha channel. The feature graphic goes
   * to `feature-graphic-1024x500.png`, and every other capture to the
   * screenshots folder as `<name>.png`.
   *
   * @param png - The RGBA PNG capture.
   * @param name - The capture's name, from its story's export name in kebab case.
   */
  writeAsset(png: Buffer, name: string): void {
    const outputPath =
      name === this.#featureGraphicName
        ? join(this.#outputDir, 'feature-graphic-1024x500.png')
        : join(this.#screenshotDir, `${name}.png`);
    mkdirSync(dirname(outputPath), { recursive: true });
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
