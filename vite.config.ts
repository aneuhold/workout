import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv, type UserConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { defineConfig, mergeConfig } from 'vitest/config';

// Setup the environment file if it exists. Update the list of prefixes as needed to be used either
// in tests or in the Vite build. The prefixes need to be specified for it to pick up stuff.
const envVarPrefixesToLoad = ['SENTRY_AUTH_TOKEN', 'SENTRY_UPLOAD_SOURCE_MAPS', 'PERF_'];
const envFile = loadEnv('', process.cwd(), envVarPrefixesToLoad);
for (const [key, value] of Object.entries(envFile)) {
  if (value) {
    process.env[key] = value;
  }
}

// Source-map upload is gated on both `SENTRY_UPLOAD_SOURCE_MAPS=true` and the
// presence of `SENTRY_AUTH_TOKEN`, so it only runs from the main-branch CI
// workflow and from `pnpm publish:android:build` — never from PR previews
// or local dev.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const shouldUploadSourceMaps =
  process.env.SENTRY_UPLOAD_SOURCE_MAPS === 'true' && !!sentryAuthToken;

// Vitest specific logic to run
if (process.env.VITEST) {
  // Define the list of messages to suppress
  const messagesToSuppress = [/^Sourcemap for .* points to missing source files/];

  // It needs to be suppressed in this way instead of using customLogger from vite or onConsoleLog
  // from vitest because it seems that Vite or Rollup logs these warnings directly to stderr and not
  // through those hooks.
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk, ...args) => {
    const str = chunk.toString();
    if (messagesToSuppress.some((regex) => regex.test(str))) {
      return true;
    }

    // This is a crazy type because process.stderr.write can take different argument types
    return originalStderrWrite(
      chunk,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      ...(args as [BufferEncoding?, ((err?: Error | null) => void)?])
    );
  };
}

const viteConfig: UserConfig = {
  plugins: [
    // Make sure `sentrySvelteKit` is registered before `sveltekit`
    shouldUploadSourceMaps &&
      sentrySvelteKit({
        sourceMapsUploadOptions: {
          org: 'anton-neuhold',
          project: 'workout',
          authToken: sentryAuthToken
        }
      }),
    tailwindcss(),
    sveltekit(),
    // Added so that certain node packages work in the browser. The below
    // 3 are needed specifically for crypto it seems.
    nodePolyfills({
      include: ['crypto', 'util', 'stream'],
      // Version 0.27 started always wiping out the process global. See here for the bug.
      // https://github.com/davidmyersdev/vite-plugin-node-polyfills/issues/159
      // If that is fixed, then `process: false` doesn't need to be specified anymore.
      globals: { process: false }
    })
    /**
     * Bundle visualizer for analyzing the bundle size.
     *
     * Also import `import { visualizer } from 'rollup-plugin-visualizer';` at the top.
     */
    /*
    visualizer({
      open: true,
      filename: 'bundle-analysis.html',
      gzipSize: true,
      brotliSize: true
    })
    */
  ],
  resolve: {
    dedupe: ['svelte'],
    // This is needed to make sure that Svelte uses the browser build when running tests with Vitest
    // even though it is running in Node.
    conditions: process.env.VITEST ? ['browser'] : undefined
  },
  css: {
    postcss: {}
  }
};

const vitestConfig = defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{js,ts,svelte.ts}'],
    environment: 'jsdom',
    setupFiles: ['./testUtils/vitest-setup.ts']
  }
});

export default mergeConfig(viteConfig, vitestConfig);
