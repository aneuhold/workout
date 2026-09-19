import baseConfig from './vite.config';

/**
 * Vitest config used by the perf seed script. Reuses the base SvelteKit /
 * Tailwind / Sentry plugin pipeline so `.svelte.ts` files compile correctly,
 * but narrows `test.include` to the single seed entrypoint. The shared setup
 * file is left out because it installs the network-free API, and the seed
 * talks to the real one. Its IndexedDB stand-in is kept, because building the
 * scenario writes documents through `LocalData`.
 */
export default {
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['scripts/commands/perf/seed.ts'],
    setupFiles: ['fake-indexeddb/auto']
  }
};
