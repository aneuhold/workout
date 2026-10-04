import coreJsBuilder from 'core-js-builder';
import type { Plugin } from 'vite';

/**
 * The oldest browser versions the app supports, and the build settings derived
 * from them.
 */
class BrowserSupportService {
  /**
   * Tailwind v4 sets this floor, because its CSS depends on these versions and
   * CSS can't be polyfilled. See https://tailwindcss.com/docs/compatibility.
   */
  readonly supportedBrowsers = {
    chrome: '111',
    edge: '111',
    firefox: '128',
    safari: '16.4',
    ios: '16.4'
  };

  /** `supportedBrowsers` in esbuild's format, for Vite's `build.target`. */
  readonly buildTarget = Object.entries(this.supportedBrowsers).map(
    ([browser, version]) => `${browser}${version}`
  );

  readonly #polyfillsModuleId = 'virtual:core-js-polyfills';

  /**
   * Creates a Vite plugin serving `virtual:core-js-polyfills`, which imports
   * every stable `core-js` polyfill that `supportedBrowsers` lacks. Vite only
   * lowers syntax for the build target, so built-in methods newer than the
   * floor need these.
   *
   * The resolved id is prefixed with `\0` so other plugins skip it and
   * sourcemaps treat it as virtual.
   *
   * @see https://github.com/zloirock/core-js/tree/master/packages/core-js-builder
   * @see https://rolldown.rs/apis/plugin-api#virtual-modules
   */
  polyfillsPlugin(): Plugin {
    const resolvedId = `\0${this.#polyfillsModuleId}`;
    return {
      name: 'core-js-polyfills',
      resolveId: (id) => (id === this.#polyfillsModuleId ? resolvedId : undefined),
      load: async (id) =>
        id === resolvedId
          ? await coreJsBuilder({
              modules: 'core-js/stable',
              targets: this.supportedBrowsers,
              format: 'esm'
            })
          : undefined
    };
  }
}

const browserSupportService = new BrowserSupportService();
export default browserSupportService;
