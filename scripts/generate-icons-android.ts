import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { ASSETS_DIR, renderSvgToPng } from './generate-icons-utils';

const ANDROID_RES_PATH = 'android/app/src/main/res';

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
    /**
     * Adaptive icon densities (108dp scaled per density). cap-assets ships its
     * foreground/background PNGs at the *legacy* launcher size (48dp safe-zone)
     * and wraps them in `<inset android:inset="16.7%">`. That's correct for a
     * loose logo, but our source SVGs are complete branded icons designed to
     * fill the entire 108dp frame — the inset shrinks them into the safe zone
     * and the launcher fills the resulting transparent ring with a default tint.
     *
     * We fix this by re-rendering the foreground/background PNGs at the proper
     * 108dp adaptive size and rewriting the launcher XMLs to drop the inset, so
     * the icon fills the OS mask edge-to-edge.
     */
    adaptiveIconDensities: [
      { density: 'ldpi', size: 81 },
      { density: 'mdpi', size: 108 },
      { density: 'hdpi', size: 162 },
      { density: 'xhdpi', size: 216 },
      { density: 'xxhdpi', size: 324 },
      { density: 'xxxhdpi', size: 432 }
    ],
    /** Replacement adaptive-icon XML written after cap-assets runs. */
    adaptiveIconXml: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`,
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
 * Rewrites cap-assets's adaptive icon outputs so the icon fills the entire
 * 108dp frame: re-renders foreground + background PNGs at the proper
 * adaptive sizes, and replaces the inset-wrapping launcher XMLs.
 */
const fixAdaptiveIconLayers = (): void => {
  const foregroundSrc = `${ANDROID_ASSETS_SETTINGS.outputDir}/icon-foreground.svg`;
  const backgroundSrc = `${ANDROID_ASSETS_SETTINGS.outputDir}/icon-background.svg`;

  for (const { density, size } of ANDROID_ASSETS_SETTINGS.adaptiveIconDensities) {
    renderSvgToPng(
      foregroundSrc,
      size,
      `${ANDROID_RES_PATH}/mipmap-${density}/ic_launcher_foreground.png`
    );
    renderSvgToPng(
      backgroundSrc,
      size,
      `${ANDROID_RES_PATH}/mipmap-${density}/ic_launcher_background.png`
    );
  }

  writeFileSync(
    `${ANDROID_RES_PATH}/mipmap-anydpi-v26/ic_launcher.xml`,
    ANDROID_ASSETS_SETTINGS.adaptiveIconXml
  );
  writeFileSync(
    `${ANDROID_RES_PATH}/mipmap-anydpi-v26/ic_launcher_round.xml`,
    ANDROID_ASSETS_SETTINGS.adaptiveIconXml
  );
  console.log('  rewrote adaptive icon layers (no inset, 108dp-sized PNGs)');
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

  fixAdaptiveIconLayers();
};
