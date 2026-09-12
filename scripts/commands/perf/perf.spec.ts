import { type Browser, expect, test } from '@playwright/test';
import perfTestUtils, { PERF_TEST_CONSTANTS, PerfMode } from '$testUtils/perfTestUtils';
import { PerfMark } from '$util/perfMarks';

/**
 * Runs a single cold-boot through the home page and on to the sessions list,
 * capturing all three performance metrics from one navigation. Persists the
 * sample so the orchestrator can aggregate medians across repetitions.
 *
 * @param browser Playwright Browser instance shared across tests.
 * @param mode Throttling mode being measured.
 */
const measure = async (browser: Browser, mode: PerfMode): Promise<void> => {
  const context = await browser.newContext({
    storageState: PERF_TEST_CONSTANTS.storageStatePath
  });
  try {
    const page = await context.newPage();
    await perfTestUtils.clearDocCachesExceptAuth(page);
    await perfTestUtils.applyThrottling(context, page, mode);

    // Boot and wait for the home page to finish rendering
    await page.goto('/');
    await page.waitForFunction(
      (mark) => performance.getEntriesByName(mark).length > 0,
      PerfMark.HomeRendered,
      { timeout: 60_000 }
    );

    // Wait for the sessions navigation to finish
    await page.locator('a[href="/sessions"]').first().click();
    await page.waitForFunction(
      (mark) => performance.getEntriesByName(mark).length > 0,
      PerfMark.SessionsListRendered,
      { timeout: 60_000 }
    );

    const marks = await perfTestUtils.readMarks(page);
    expect(marks[PerfMark.Boot]).toBeDefined();
    expect(marks[PerfMark.HomeRendered]).toBeDefined();
    expect(marks[PerfMark.SessionsListRendered]).toBeDefined();

    perfTestUtils.writeSample({
      mode,
      metrics: {
        bootToHydrationNetworkComplete:
          (marks[PerfMark.HydrationNetworkComplete] ?? NaN) - marks[PerfMark.Boot],
        bootToHomeRendered: marks[PerfMark.HomeRendered] - marks[PerfMark.Boot],
        homeRenderedToSessionsListRendered:
          marks[PerfMark.SessionsListRendered] - marks[PerfMark.HomeRendered]
      }
    });
  } finally {
    await context.close();
  }
};

for (const mode of Object.values(PerfMode)) {
  test(`perf — ${mode}`, async ({ browser }) => {
    await measure(browser, mode);
  });
}
