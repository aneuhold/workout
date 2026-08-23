import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import svg2vectordrawable from 'svg2vectordrawable/src/svg-to-vectordrawable';
import { ASSETS_DIR, readThemeBackgroundColors } from './generate-icons-utils';

/**
 * Single-source-of-truth for Android asset generation. Drives `@capacitor/assets`
 * in Custom Mode for the launcher icons (mipmap-*); the Android 12+ splash
 * (`windowSplashScreenBackground` color + `windowSplashScreenAnimatedIcon`
 * vector drawable) is generated directly without going through cap-assets.
 *
 * See https://github.com/ionic-team/capacitor-assets
 */
function createAndroidAssetsSettings() {
  const themeBackground = readThemeBackgroundColors();
  return {
    outputDir: 'android/capacitor-assets',
    /** Android resource root where generated XML resources land. */
    resDir: 'android/app/src/main/res',
    /** Icon canvas size required by `@capacitor/assets` Custom Mode (≥1024). */
    iconCanvasSize: 1024,
    /**
     * Fraction of `windowSplashScreenAnimatedIcon`'s 432 dp canvas that is
     * guaranteed unmasked (the inner 288 dp). Source SVGs that fill the canvas
     * edge-to-edge must be inset to this ratio or their edges get clipped by
     * the device's adaptive-icon mask.
     * https://developer.android.com/develop/ui/views/launch/splash-screen
     */
    splashIconVisibleRatio: 288 / 432,
    sources: {
      iconOnly: `${ASSETS_DIR}/logo-dark-icon-circle-gradient-background.svg`,
      iconForeground: `${ASSETS_DIR}/logo-dark-icon-circle-gradient-background.svg`,
      /** Source for the Android 12+ splash icon (windowSplashScreenAnimatedIcon). */
      splashIconLight: `${ASSETS_DIR}/logo-light-square.svg`,
      splashIconDark: `${ASSETS_DIR}/logo-dark-square.svg`
    },
    colors: {
      iconBackground: '#06120f',
      splashBackgroundLight: themeBackground.light,
      splashBackgroundDark: themeBackground.dark
    }
  };
}

const ANDROID_ASSETS_SETTINGS = createAndroidAssetsSettings();

/**
 * Wraps the source SVG in an outer `<g>` that scales it to the inner safe area
 * of the canvas (centered), compensating for Android's adaptive-icon mask.
 *
 * Implemented as a nested group rather than a compound transform: svg2vectordrawable
 * composes multiple translate/scale ops in a single transform string by naive
 * sum/multiply (order-incorrect), but emits separate `<group>` elements for each
 * nested `<g>`, which Android's vector renderer then composes correctly via its
 * group hierarchy.
 *
 * @param svg - Raw source SVG markup with a square `viewBox`
 */
const insetSvgForAndroidSplashMasking = (svg: string): string => {
  const viewBoxMatch = svg.match(/viewBox\s*=\s*"([^"]+)"/);
  if (!viewBoxMatch) {
    throw new Error('Splash icon SVG missing viewBox attribute');
  }
  const [, , widthStr, heightStr] = viewBoxMatch[1].trim().split(/\s+/);
  const width = Number(widthStr);
  const height = Number(heightStr);
  if (width !== height) {
    throw new Error(`Splash icon SVG must be square; got ${width}x${height}`);
  }
  const scale = ANDROID_ASSETS_SETTINGS.splashIconVisibleRatio;
  const offset = (width * (1 - scale)) / 2;
  return svg.replace(
    /(<svg[^>]*>)([\s\S]*)(<\/svg>\s*)$/,
    `$1<g transform="translate(${offset},${offset}) scale(${scale})">$2</g>$3`
  );
};

/**
 * Converts a logo SVG into an Android `<vector>` drawable suitable for the
 * Splash Screen API's `windowSplashScreenAnimatedIcon`. The source SVG must
 * already be background-free and use a single (non-compound) group transform —
 * the inset wrapper added here introduces a second group, which is fine because
 * SVGO collapses the pair before svg2vectordrawable parses transforms.
 *
 * @param sourceSvgPath - Path to a square logo SVG with no background rect
 */
const buildSplashIconVectorDrawable = async (sourceSvgPath: string): Promise<string> => {
  const sourceSvg = readFileSync(sourceSvgPath, 'utf8');
  const insetSvg = insetSvgForAndroidSplashMasking(sourceSvg);
  return svg2vectordrawable(insetSvg, { floatPrecision: 3 });
};

/**
 * Writes light + dark variants of the splash icon vector drawable. Android
 * auto-selects between them based on the OS theme (drawable/ vs drawable-night/).
 */
const writeSplashIconDrawables = async (): Promise<void> => {
  const { resDir, sources } = ANDROID_ASSETS_SETTINGS;
  mkdirSync(`${resDir}/drawable-night`, { recursive: true });
  writeFileSync(
    `${resDir}/drawable/splash_icon.xml`,
    await buildSplashIconVectorDrawable(sources.splashIconLight)
  );
  writeFileSync(
    `${resDir}/drawable-night/splash_icon.xml`,
    await buildSplashIconVectorDrawable(sources.splashIconDark)
  );
};

/**
 * Writes `splash_screen_background` color resources for the Android 12+ splash
 * API (referenced by `windowSplashScreenBackground` in `styles.xml`).
 * Light variant goes in `values/colors.xml`, dark in `values-night/colors.xml`.
 */
const writeSplashColorsXml = (): void => {
  const buildColorsXml = (color: string): string =>
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="splash_screen_background">${color}</color>\n</resources>\n`;

  const { resDir, colors } = ANDROID_ASSETS_SETTINGS;
  mkdirSync(`${resDir}/values-night`, { recursive: true });
  writeFileSync(`${resDir}/values/colors.xml`, buildColorsXml(colors.splashBackgroundLight));
  writeFileSync(`${resDir}/values-night/colors.xml`, buildColorsXml(colors.splashBackgroundDark));
};

/**
 * Generates Android launcher icons via `@capacitor/assets` Custom Mode, plus
 * the Android 12+ splash (color + animated vector) directly. Stages icon
 * source SVGs into `android/capacitor-assets/` (committed alongside the
 * generated `android/app/src/main/res/` outputs so inputs are auditable).
 */
export const generateCapacitorAndroidAssets = async (): Promise<void> => {
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
      ANDROID_ASSETS_SETTINGS.colors.iconBackground
    ],
    { stdio: 'inherit' }
  );

  writeSplashColorsXml();
  await writeSplashIconDrawables();
};
