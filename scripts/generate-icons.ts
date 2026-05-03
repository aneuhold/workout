import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'fs';

const SOURCE_SVG = 'docs/officialAssets/logo-dark-icon-circle-gradient-background.svg';
const OUTPUT_DIR = 'static/icons';
const FAVICON_PATH = 'static/favicon.png';

/** PWA manifest icon sizes (px) — Android launcher + Chrome install prompts. */
const ICON_SIZES = [48, 72, 96, 128, 144, 168, 192];

/** Size whose PNG is also copied to static/favicon.png. */
const FAVICON_SOURCE_SIZE = 128;

/**
 * Renders the source SVG to a PNG of the given size using rsvg-convert
 * (librsvg). ImageMagick seems to not handle the gradients well.
 *
 * @param size - Pixel dimension (width and height) of the PNG to produce
 */
const renderIconAtSize = (size: number): void => {
  const outputPath = `${OUTPUT_DIR}/${size}.png`;
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
 * Generates all PWA icon sizes from the source SVG and copies the
 * favicon-sized variant to static/favicon.png.
 */
const generateIcons = (): void => {
  console.log(`Source: ${SOURCE_SVG}`);
  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const size of ICON_SIZES) {
    renderIconAtSize(size);
  }

  copyFileSync(`${OUTPUT_DIR}/${FAVICON_SOURCE_SIZE}.png`, FAVICON_PATH);
  console.log(`Copied ${FAVICON_SOURCE_SIZE}.png → ${FAVICON_PATH}`);
};

generateIcons();
