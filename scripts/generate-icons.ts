import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'fs';

const SOURCE_SVG = 'docs/officialAssets/logo-dark-icon-circle-gradient-background.svg';
const OUTPUT_DIR = 'static/icons';
const FAVICON_PATH = 'static/favicon.png';

/** PWA manifest icon sizes (px) — Android launcher + Chrome install prompts. */
const ICON_SIZES = [48, 72, 96, 128, 144, 168, 192];

/** Size at which the favicon is rendered. */
const FAVICON_SIZE = 128;

/**
 * Renders the source SVG to a square PNG at the given size using rsvg-convert
 * (librsvg). ImageMagick's built-in MSVG renderer mishandles the brand SVGs'
 * userSpaceOnUse gradients.
 *
 * @param size - Pixel dimension (width and height) of the PNG to produce
 * @param outputPath - Destination path for the PNG
 */
const renderIconAtSize = (size: number, outputPath: string): void => {
  execFileSync('rsvg-convert', [
    '-w',
    String(size),
    '-h',
    String(size),
    SOURCE_SVG,
    '-o',
    outputPath
  ]);
  console.log(`  wrote ${outputPath}`);
};

/**
 * Generates all PWA launcher icon sizes plus the favicon from the source SVG.
 */
const generateIcons = (): void => {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Source: ${SOURCE_SVG}`);

  for (const size of ICON_SIZES) {
    renderIconAtSize(size, `${OUTPUT_DIR}/${size}.png`);
  }

  renderIconAtSize(FAVICON_SIZE, FAVICON_PATH);
};

generateIcons();
