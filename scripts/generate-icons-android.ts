import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { ASSETS_DIR } from './generate-icons-utils';

/**
 * Single-source-of-truth for Android asset generation. Drives `@capacitor/assets`
 * in Custom Mode: the four named source SVGs land in `outputDir`, and the
 * background colors are passed as CLI flags. Swap any field to change the
 * launcher / splash assets without touching the generation logic.
 *
 * See https://github.com/ionic-team/capacitor-assets
 */
function createAndroidAssetsSettings() {
  const splashCanvasSize = 2732;
  const splashLogoSize = Math.round(splashCanvasSize * 0.37);
  return {
    outputDir: 'android/capacitor-assets',
    /** Icon canvas size required by `@capacitor/assets` Custom Mode (≥1024). */
    iconCanvasSize: 1024,
    /** Splash canvas size required by `@capacitor/assets` Custom Mode. */
    splashCanvasSize,
    /** Logo footprint inside the splash canvas. */
    splashLogoSize,
    sources: {
      iconOnly: `${ASSETS_DIR}/logo-dark-icon-circle-gradient-background.svg`,
      iconForeground: `${ASSETS_DIR}/logo-dark-icon-circle-gradient-background.svg`,
      splashLogoLight: `${ASSETS_DIR}/logo-light-icon-circle-gradient-background.svg`,
      splashLogoDark: `${ASSETS_DIR}/logo-dark-icon-circle-gradient-background.svg`
    },
    colors: {
      iconBackground: '#06120f',
      splashBackgroundLight: '#bfdbcb',
      splashBackgroundDark: '#0a1814'
    }
  };
}

const ANDROID_ASSETS_SETTINGS = createAndroidAssetsSettings();

/**
 * Wraps an icon SVG in a 2732×2732 splash canvas with a solid background.
 * Extracts the source SVG's inner content (everything between the outer
 * <svg> tags) and embeds it in a nested <svg> centered on the canvas.
 *
 * @param sourceSvgPath - Path to a 512×512-viewBox icon SVG
 * @param backgroundColor - CSS color used to fill the full canvas
 */
const buildSplashWrapperSvg = (sourceSvgPath: string, backgroundColor: string): string => {
  const sourceSvg = readFileSync(sourceSvgPath, 'utf8');
  const innerMatch = sourceSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!innerMatch) {
    throw new Error(`Could not extract inner SVG content from ${sourceSvgPath}`);
  }
  const innerContent = innerMatch[1];
  const { splashCanvasSize, splashLogoSize } = ANDROID_ASSETS_SETTINGS;
  const splashLogoOffset = (splashCanvasSize - splashLogoSize) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${splashCanvasSize} ${splashCanvasSize}">
  <rect width="${splashCanvasSize}" height="${splashCanvasSize}" fill="${backgroundColor}"/>
  <svg x="${splashLogoOffset}" y="${splashLogoOffset}" width="${splashLogoSize}" height="${splashLogoSize}" viewBox="0 0 512 512">${innerContent}</svg>
</svg>
`;
};

/**
 * Generates Android launcher + splash assets via `@capacitor/assets` Custom Mode.
 * Stages the four source SVGs into `android/capacitor-assets/` (committed
 * alongside the generated `android/app/src/main/res/` outputs so inputs are
 * auditable), then invokes the cap-assets CLI to rasterize them.
 */
export const generateCapacitorAndroidAssets = (): void => {
  console.log('Android assets:');
  mkdirSync(ANDROID_ASSETS_SETTINGS.outputDir, { recursive: true });

  copyFileSync(
    ANDROID_ASSETS_SETTINGS.sources.iconOnly,
    `${ANDROID_ASSETS_SETTINGS.outputDir}/icon-only.svg`
  );
  copyFileSync(
    ANDROID_ASSETS_SETTINGS.sources.iconForeground,
    `${ANDROID_ASSETS_SETTINGS.outputDir}/icon-foreground.svg`
  );
  // cap-assets's foreground writer references @mipmap/ic_launcher_background regardless,
  // so we must emit a matching background asset to avoid a broken resource reference.
  // A solid-color square is enough — any sliver exposed by the OS mask blends with the
  // gradient icon's outer edge color.
  writeFileSync(
    `${ANDROID_ASSETS_SETTINGS.outputDir}/icon-background.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANDROID_ASSETS_SETTINGS.iconCanvasSize} ${ANDROID_ASSETS_SETTINGS.iconCanvasSize}"><rect width="${ANDROID_ASSETS_SETTINGS.iconCanvasSize}" height="${ANDROID_ASSETS_SETTINGS.iconCanvasSize}" fill="${ANDROID_ASSETS_SETTINGS.colors.iconBackground}"/></svg>\n`
  );
  writeFileSync(
    `${ANDROID_ASSETS_SETTINGS.outputDir}/splash.svg`,
    buildSplashWrapperSvg(
      ANDROID_ASSETS_SETTINGS.sources.splashLogoLight,
      ANDROID_ASSETS_SETTINGS.colors.splashBackgroundLight
    )
  );
  writeFileSync(
    `${ANDROID_ASSETS_SETTINGS.outputDir}/splash-dark.svg`,
    buildSplashWrapperSvg(
      ANDROID_ASSETS_SETTINGS.sources.splashLogoDark,
      ANDROID_ASSETS_SETTINGS.colors.splashBackgroundDark
    )
  );

  execFileSync(
    'pnpm',
    [
      'exec',
      'capacitor-assets',
      'generate',
      '--android',
      '--assetPath',
      ANDROID_ASSETS_SETTINGS.outputDir,
      '--iconBackgroundColor',
      ANDROID_ASSETS_SETTINGS.colors.iconBackground,
      '--iconBackgroundColorDark',
      ANDROID_ASSETS_SETTINGS.colors.iconBackground,
      '--splashBackgroundColor',
      ANDROID_ASSETS_SETTINGS.colors.splashBackgroundLight,
      '--splashBackgroundColorDark',
      ANDROID_ASSETS_SETTINGS.colors.splashBackgroundDark
    ],
    { stdio: 'inherit' }
  );
};
