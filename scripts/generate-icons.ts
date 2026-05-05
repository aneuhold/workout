import { copyFileSync, mkdirSync } from 'fs';
import { generateCapacitorAndroidAssets } from './generate-icons-android';
import { ASSETS_DIR, renderSvgToPng } from './generate-icons-utils';

const STATIC_DIR = 'static';
const ICONS_DIR = `${STATIC_DIR}/icons`;
const FAVICON_PATH = `${STATIC_DIR}/favicon.png`;

/** Source SVG used for the PWA launcher icons + favicon. */
const ICON_SOURCE_SVG = `${ASSETS_DIR}/logo-dark-icon-circle-gradient-background.svg`;

/** Wide logos copied to /static so they're servable as /logo-{light,dark}.svg. */
const WIDE_LOGOS = [
  { source: `${ASSETS_DIR}/logo-light.svg`, dest: `${STATIC_DIR}/logo-light.svg` },
  { source: `${ASSETS_DIR}/logo-dark.svg`, dest: `${STATIC_DIR}/logo-dark.svg` }
] as const;

/** PWA manifest icon sizes (px) — Android launcher + Chrome install prompts. */
const ICON_SIZES = [48, 72, 96, 128, 144, 168, 192];

/** Size at which the favicon is rendered. */
const FAVICON_SIZE = 128;

/**
 * Renders the PWA icon source SVG to a square PNG and logs the destination.
 *
 * @param size - Pixel dimension (width and height) of the PNG to produce
 * @param outputPath - Destination path for the PNG
 */
const renderIconAtSize = (size: number, outputPath: string): void => {
  renderSvgToPng(ICON_SOURCE_SVG, size, outputPath);
  console.log(`  wrote ${outputPath}`);
};

/**
 * Generates all PWA launcher icon sizes plus the favicon.
 */
const generateIcons = (): void => {
  mkdirSync(ICONS_DIR, { recursive: true });
  console.log(`Icons from: ${ICON_SOURCE_SVG}`);

  for (const size of ICON_SIZES) {
    renderIconAtSize(size, `${ICONS_DIR}/${size}.png`);
  }

  renderIconAtSize(FAVICON_SIZE, FAVICON_PATH);
};

/**
 * Copies the wide light + dark logos into /static so the app can swap between
 * them at runtime based on the current theme (see TopBar.svelte).
 */
const copyWideLogos = (): void => {
  console.log('Wide logos:');
  for (const { source, dest } of WIDE_LOGOS) {
    copyFileSync(source, dest);
    console.log(`  copied ${dest}`);
  }
};

// Run all the thangs
generateIcons();
copyWideLogos();
await generateCapacitorAndroidAssets();
