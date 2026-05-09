import baseConfig from './vite.config';

/**
 * Vitest config used by the perf seed script. Reuses the base SvelteKit /
 * Tailwind / Sentry plugin pipeline so `.svelte.ts` files compile correctly,
 * but narrows `test.include` to the single seed entrypoint.
 */
export default {
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['scripts/perf/seed.ts']
  }
};
