import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { formatHex, parse } from 'culori';

/** Directory containing the brand SVG assets. */
export const ASSETS_DIR = 'docs/officialAssets';

/** Path to the app's global CSS, the source of truth for theme tokens. */
const GLOBAL_CSS_PATH = 'src/globalStyles/global.css';

/**
 * Reads the `--background` token from `:root` (light) and `.dark` (dark) in
 * `global.css` and returns each as an sRGB `#rrggbb` hex string. Lets the
 * native Android splash background inherit from the same tokens as the app.
 */
export const readThemeBackgroundColors = (): { light: string; dark: string } => {
  const css = readFileSync(GLOBAL_CSS_PATH, 'utf8');
  const extract = (selector: string): string => {
    const match = css.match(
      new RegExp(`${selector}\\s*\\{[\\s\\S]*?--background\\s*:\\s*([^;]+);`)
    );
    if (!match) {
      throw new Error(`Could not find --background under ${selector} in ${GLOBAL_CSS_PATH}`);
    }
    const hex = formatHex(parse(match[1].trim()));
    if (!hex) {
      throw new Error(`Could not parse "${match[1].trim()}" as a CSS color`);
    }
    return hex;
  };
  return { light: extract(':root'), dark: extract('\\.dark') };
};

/**
 * Renders an arbitrary SVG to a square PNG of the given size via rsvg-convert
 * (librsvg). librsvg is preferred over ImageMagick because the brand SVGs use
 * userSpaceOnUse gradients that ImageMagick's MSVG renderer mishandles.
 *
 * @param sourceSvg - Path to the source SVG
 * @param size - Pixel dimension (width and height)
 * @param outputPath - Destination path for the PNG
 */
export const renderSvgToPng = (sourceSvg: string, size: number, outputPath: string): void => {
  execFileSync('rsvg-convert', [
    '-w',
    String(size),
    '-h',
    String(size),
    sourceSvg,
    '-o',
    outputPath
  ]);
};
