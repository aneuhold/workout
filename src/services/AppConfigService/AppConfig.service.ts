import { Capacitor } from '@capacitor/core';

/**
 * Configuration that applies to the whole app rather than to any one user.
 */
class AppConfigService {
  readonly productionHostname = 'mesopro.tonyneuhold.com';

  /**
   * Netlify previews and local web dev are not production. Native always is,
   * including local Android dev builds.
   */
  get isProduction(): boolean {
    return Capacitor.isNativePlatform() || window.location.hostname === this.productionHostname;
  }

  /**
   * Vitest sets Vite's mode to `test` unless `--mode` overrides it
   * ([Vitest `mode`](https://vitest.dev/config)),
   *
   * "Use process.env.VITEST or mode property on defineConfig (will be set to test if not
   * overridden with --mode)"
   *
   * and Vite compiles the
   * mode into the code, so this holds in Node and browser test runs alike
   * ([Vite env and modes](https://vite.dev/guide/env-and-mode)).
   */
  get isVitest(): boolean {
    return import.meta.env.MODE === 'test';
  }
}

const appConfigService = new AppConfigService();
export default appConfigService;
