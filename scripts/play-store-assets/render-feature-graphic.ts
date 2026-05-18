import { execFileSync } from 'node:child_process';
import { mkdirSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..');
const HTML_PATH = resolve(SCRIPT_DIR, 'feature-graphic.html');
const OUTPUT_DIR = resolve(REPO_ROOT, 'android/play-store-assets');
const RGBA_PATH = resolve(OUTPUT_DIR, 'feature-graphic-1024x500.rgba.png');
const FINAL_PATH = resolve(OUTPUT_DIR, 'feature-graphic-1024x500.png');

/**
 * Renders the feature-graphic.html template to a 1024×500 24-bit PNG.
 * Playwright produces an RGBA PNG; magick strips the (fully opaque) alpha
 * channel so the output matches Play's "24-bit PNG, no alpha" spec.
 */
const render = async (): Promise<void> => {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(HTML_PATH).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: RGBA_PATH, type: 'png', omitBackground: false });
  await browser.close();

  execFileSync('magick', [RGBA_PATH, '-alpha', 'off', FINAL_PATH]);
  unlinkSync(RGBA_PATH);
  console.log(`wrote ${FINAL_PATH}`);
};

await render();
