import { chromium, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { IndexEntry, StoryIndex } from 'storybook/internal/types';
import { pathToFileURL } from 'url';
import { preview } from 'vite';
import { PROJECT_ROOT } from '../../constants/projectRoot';
import scriptCLIService from '../../services/ScriptCLI.service';

/**
 * Renders the Play Store listing images: the feature graphic from its HTML
 * template, and the phone screenshots from the static Storybook build.
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
    'scripts/commands/renderPlayStoreAssets/feature-graphic.html'
  );
  readonly #storybookStaticDir = join(PROJECT_ROOT, 'storybook-static');
  readonly #storyIndexPath = join(this.#storybookStaticDir, 'index.json');
  readonly #screenshotTag = 'playstore-screenshot';

  /**
   * CSS-pixel viewport for screenshots. 540×960 sits below Tailwind's `sm`
   * (640px) breakpoint so the app renders its mobile layout, and the 2×
   * device scale factor produces a 1080×1920 PNG.
   */
  readonly #screenshotViewport = { width: 540, height: 960 };
  readonly #screenshotScaleFactor = 2;

  /**
   * Renders `feature-graphic.html` to a 1024×500 PNG.
   */
  async renderFeatureGraphic(): Promise<void> {
    mkdirSync(this.#outputDir, { recursive: true });
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
      await this.#writeOpaquePng(page, join(this.#outputDir, 'feature-graphic-1024x500.png'));
    } finally {
      await browser.close();
    }
  }

  /**
   * Renders every story tagged `playstore-screenshot` in the static Storybook
   * build to a 1080×1920 PNG named after the story id. Run `pnpm build:sb`
   * first.
   */
  async renderScreenshots(): Promise<void> {
    const stories = this.#readScreenshotStories();
    if (stories.length === 0) {
      console.warn(
        `No stories tagged \`${this.#screenshotTag}\` found in ${this.#storyIndexPath}.`
      );
      return;
    }

    mkdirSync(this.#screenshotDir, { recursive: true });
    const server = await preview({
      configFile: false,
      logLevel: 'warn',
      build: { outDir: this.#storybookStaticDir },
      preview: { port: 0, host: '127.0.0.1' }
    });
    const baseUrl = server.resolvedUrls?.local[0];
    if (!baseUrl) {
      await server.close();
      throw new Error('The Storybook preview server did not report a local URL.');
    }

    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({
        viewport: this.#screenshotViewport,
        deviceScaleFactor: this.#screenshotScaleFactor
      });
      for (const story of stories) {
        const page = await context.newPage();
        await page.goto(`${baseUrl}iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`, {
          waitUntil: 'networkidle'
        });
        await page.waitForFunction(
          () => (document.getElementById('storybook-root')?.children.length ?? 0) > 0
        );
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(500);
        await this.#writeOpaquePng(page, join(this.#screenshotDir, `${story.id}.png`));
        await page.close();
      }
    } finally {
      await browser.close();
      await server.close();
    }
  }

  /**
   * Reads the static Storybook index and returns the story entries tagged
   * `playstore-screenshot`.
   */
  #readScreenshotStories(): IndexEntry[] {
    if (!existsSync(this.#storyIndexPath)) {
      throw new Error(
        `Missing ${this.#storyIndexPath}. Run \`pnpm build:sb\` first to produce the static Storybook build.`
      );
    }
    const parsed: unknown = JSON.parse(readFileSync(this.#storyIndexPath, 'utf8'));
    if (!this.#isStoryIndex(parsed)) {
      throw new Error(`Invalid Storybook index format at ${this.#storyIndexPath}`);
    }
    return Object.values(parsed.entries).filter(
      (entry) => entry.type === 'story' && entry.tags?.includes(this.#screenshotTag)
    );
  }

  /**
   * Shallow check that parsed JSON is a Storybook index. The file is this
   * repo's own build output, so a malformed one is a bug rather than a case to
   * handle field by field.
   *
   * @param value - The parsed contents of `index.json`.
   */
  #isStoryIndex(value: unknown): value is StoryIndex {
    return (
      typeof value === 'object' &&
      value !== null &&
      'entries' in value &&
      typeof value.entries === 'object' &&
      value.entries !== null
    );
  }

  /**
   * Screenshots the page to `outputPath` as a PNG without an alpha channel.
   * Playwright always writes RGBA, so the capture goes to a temporary file
   * that `magick` flattens into the final output.
   *
   * @param page - The page to capture.
   * @param outputPath - Absolute path of the final `.png` file.
   */
  async #writeOpaquePng(page: Page, outputPath: string): Promise<void> {
    const rgbaPath = outputPath.replace(/\.png$/, '.rgba.png');
    await page.screenshot({ path: rgbaPath, type: 'png' });
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
