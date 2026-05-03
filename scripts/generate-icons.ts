import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'fs';

/** Polished gradient-bg circle — used for PWA launcher icons. */
const ICONS_SOURCE_SVG = 'docs/officialAssets/logo-dark-icon-circle-gradient-background.svg';

/** Solid-bg circle — favicon stays crisp at 16-32px where gradients smear. */
const FAVICON_SOURCE_SVG = 'docs/officialAssets/logo-dark-icon-circle.svg';

const OUTPUT_DIR = 'static/icons';
const FAVICON_PATH = 'static/favicon.png';

/** PWA manifest icon sizes (px) — Android launcher + Chrome install prompts. */
const ICON_SIZES = [48, 72, 96, 128, 144, 168, 192];

/** Size at which the favicon is rendered. */
const FAVICON_SIZE = 128;

/**
 * Renders an SVG to a square PNG using rsvg-convert (librsvg). ImageMagick's
 * built-in MSVG renderer mishandles the brand SVGs' userSpaceOnUse gradients.
 *
 * @param sourceSvg - Path to the source SVG
 * @param size - Pixel dimension (width and height) of the PNG to produce
 * @param outputPath - Destination path for the PNG
 */
const renderSvgToPng = (sourceSvg: string, size: number, outputPath: string): void => {
  execFileSync('rsvg-convert', [
    '-w',
    String(size),
    '-h',
    String(size),
    sourceSvg,
    '-o',
    outputPath
  ]);
  console.log(`  wrote ${outputPath}`);
};

/**
 * Generates all PWA launcher icons from the gradient-bg SVG and renders a
 * separate favicon from the solid-bg SVG so it stays legible at small sizes.
 */
const generateIcons = (): void => {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`PWA icons from: ${ICONS_SOURCE_SVG}`);
  for (const size of ICON_SIZES) {
    renderSvgToPng(ICONS_SOURCE_SVG, size, `${OUTPUT_DIR}/${size}.png`);
  }

  console.log(`Favicon from:   ${FAVICON_SOURCE_SVG}`);
  renderSvgToPng(FAVICON_SOURCE_SVG, FAVICON_SIZE, FAVICON_PATH);
};

generateIcons();
