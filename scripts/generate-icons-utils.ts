import { execFileSync } from 'node:child_process';

/** Directory containing the brand SVG assets. */
export const ASSETS_DIR = 'docs/officialAssets';

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
