import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:5173';
const viewport = { width: 1280, height: 800 };

/**
 * As of 5/9/2026 this is setup to be only for the performance tests. That will need to be updated
 * in order to use this for other things.
 */
export default defineConfig({
  testDir: './scripts/commands/perf',
  testMatch: /.*\.spec\.ts$/,
  globalSetup: './testUtils/playwrightGlobalSetup.ts',
  fullyParallel: false,
  workers: 1,
  /**
   * A slow-profile measurement runs about 30 seconds on its own, and each
   * wait inside a measurement caps at 60 seconds, so the 30 second default
   * would cut runs short before those waits ever report.
   */
  timeout: 120_000,
  reporter: [['list']],
  outputDir: 'scripts/commands/perf/perfTemp/test-results',
  use: { baseURL, headless: true, viewport },
  // viewport is specified a second time because devices seems to override it by default.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport } }],
  webServer: {
    command: 'pnpm vite preview --port 5173 --strictPort',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 60_000
  }
});
