import type { BrowserContext, Page } from '@playwright/test';
import { Protocol } from 'devtools-protocol';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const PERF_TEMP_DIR = resolve('scripts/perf/perfTemp');

/**
 * Filesystem locations the perf pipeline reads and writes. Co-located so the
 * orchestrator, spec, seed, and global setup all agree on a single layout.
 * Only `baselinePath` is committed; everything else lives under
 * `scripts/perf/perfTemp/` and is gitignored.
 */
export const PERF_TEST_CONSTANTS = {
  /**
   * Root of all throwaway perf outputs. Gitignored, so a `rm -rf` here
   * cleans every artifact a run produces.
   */
  tempDir: PERF_TEMP_DIR,

  /**
   * Parent directory for the aggregated outputs of a run: `latest.json`,
   * `pr-comment.md`, and the `raw/` subdir of per-repetition samples.
   */
  resultsDir: resolve(PERF_TEMP_DIR, 'results'),

  /**
   * One JSON file per measurement repetition, written by
   * `perfTestUtils.writeSample()` from inside the spec. `runPerf.ts` reads
   * every file here back to compute medians, then wipes the directory at the
   * start of the next run.
   */
  rawResultsDir: resolve(PERF_TEMP_DIR, 'results/raw'),

  /**
   * Playwright `storageState` file written by `playwrightGlobalSetup` after
   * authenticating the perf user. Each spec opens its context with this
   * state so the page boots already logged in (no per-test auth round-trip).
   */
  storageStatePath: resolve(PERF_TEMP_DIR, 'auth/storageState.json'),

  /**
   * Aggregated medians (and raw sample arrays) from the most recent run,
   * grouped by throttling mode. Produced by `runPerf.ts` and copied to
   * `baselinePath` at the end of the run.
   */
  latestPath: resolve(PERF_TEMP_DIR, 'results/latest.json'),

  /**
   * Rendered markdown body for the sticky PR comment. `runPerf.ts` writes
   * it; the `marocchino/sticky-pull-request-comment` action reads it via
   * its `path:` input and posts/updates the PR comment.
   */
  prCommentPath: resolve(PERF_TEMP_DIR, 'results/pr-comment.md'),

  /**
   * The committed baseline that throttled metrics are gated against.
   * `runPerf.ts` reads it at the start (for comparison) and overwrites it
   * with the run's `latest.json` at the end. Locally, `git diff` shows the
   * change so the dev decides whether to commit; in CI the overwrite lives
   * on the runner only.
   */
  baselinePath: resolve('scripts/perf/baseline.json')
} as const;

/**
 * Throttling profile applied to a perf measurement run. Both modes apply
 * throttling — `Fast` is meant to simulate a decent home connection so local
 * and CI numbers are directly comparable, while `Slow` mirrors Chrome's
 * Slow 4G + heavy-CPU preset and is the gate for regression detection.
 */
export enum PerfMode {
  Fast = 'fast',
  Slow = 'slow'
}

/**
 * One repetition's metrics for a given throttling mode, persisted as a single
 * JSON file under `rawResultsDir` for the orchestrator to aggregate.
 */
export type PerfSample = {
  mode: PerfMode;
  metrics: Record<string, number>;
};

/**
 * Aggregated samples + median for a single named metric across all repetitions.
 */
export type AggregatedMetric = { samples: number[]; median: number };

/**
 * Map of metric name → aggregated stats for one throttling mode. `Partial`
 * because metric keys vary between current and baseline runs.
 */
export type AggregatedMode = Partial<Record<string, AggregatedMetric>>;

/**
 * Aggregated results split by throttling mode.
 */
export type AggregatedResults = Record<PerfMode, AggregatedMode>;

type ThrottlingProfile = {
  /**
   * Inputs to CDP `Network.emulateNetworkConditions`. Throughput is bytes/sec
   * — the `Kbps * 1024 / 8` shape converts from Kbps for readability.
   */
  network: Protocol.Network.EmulateNetworkConditionsRequest;
  /** CPU slowdown factor passed to CDP `Emulation.setCPUThrottlingRate`. */
  cpuRate: Protocol.Emulation.SetCPUThrottlingRateRequest['rate'];
};

/**
 * Per-mode throttling. `Fast` simulates a decent home broadband connection
 * (10 Mbps down / 5 Mbps up / 50 ms / 2× CPU) so local and CI runners
 * converge on similar numbers. `Slow` mirrors Chrome DevTools' Slow 4G +
 * 4× CPU preset to surface regressions on cold mid-tier mobile hardware.
 */
const THROTTLING_PROFILES: Record<PerfMode, ThrottlingProfile> = {
  [PerfMode.Fast]: {
    network: {
      offline: false,
      latency: 50,
      downloadThroughput: (10_240 * 1024) / 8,
      uploadThroughput: (5_120 * 1024) / 8
    },
    cpuRate: 2
  },
  [PerfMode.Slow]: {
    network: {
      offline: false,
      latency: 400,
      downloadThroughput: (400 * 1024) / 8,
      uploadThroughput: (400 * 1024) / 8
    },
    cpuRate: 4
  }
};

/**
 * Helpers shared between the perf seed test, Playwright spec, and orchestrator.
 * Singleton so callers can `import perfTestUtils from '$testUtils/perfTestUtils'`.
 */
class PerfTestUtils {
  /**
   * Reads the perf user credentials from `process.env`. Loaded into the
   * environment by `vite.config.ts` from `.env`.
   */
  getPerfCreds(): { username: string; password: string } {
    const username = process.env.PERF_TEST_USERNAME;
    const password = process.env.PERF_TEST_PASSWORD;
    if (!username || !password) {
      throw new Error('PERF_TEST_USERNAME and PERF_TEST_PASSWORD must be set in .env.');
    }
    return { username, password };
  }

  /**
   * Applies the network + CPU throttling profile for the given mode. Both
   * modes throttle (just to different degrees) so local-machine and CI
   * runner numbers are directly comparable.
   *
   * @param context Playwright BrowserContext used to open the CDP session.
   * @param page Page being throttled.
   * @param mode Profile to apply (see {@link THROTTLING_PROFILES}).
   */
  async applyThrottling(context: BrowserContext, page: Page, mode: PerfMode): Promise<void> {
    // CDP = Chrome DevTools Protocol. Lets us drive low-level browser controls
    // (network conditions, CPU rate) that aren't exposed on Playwright's
    // standard surface.
    const profile = THROTTLING_PROFILES[mode];
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', profile.network);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuRate });
  }

  /**
   * Clears every `v4-*` localStorage key except `v4-userConfig` before any
   * page script runs, forcing a full network hydration on the next navigation.
   *
   * @param page Page to attach the init script to.
   */
  async clearDocCachesExceptAuth(page: Page): Promise<void> {
    await page.addInitScript(() => {
      const keep = 'v4-userConfig';
      const toRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('v4-') && key !== keep) toRemove.push(key);
      }
      for (const key of toRemove) window.localStorage.removeItem(key);
    });
  }

  /**
   * Reads all `performance.mark` entries from the page as a name → startTime
   * map (ms relative to `performance.timeOrigin`).
   *
   * @param page Page to read marks from.
   */
  async readMarks(page: Page): Promise<Record<string, number>> {
    return page.evaluate(() => {
      const result: Record<string, number> = {};
      for (const entry of performance.getEntriesByType('mark')) {
        result[entry.name] = entry.startTime;
      }
      return result;
    });
  }

  /**
   * Persists a single perf sample to a uniquely-named file under
   * `rawResultsDir` so the orchestrator can aggregate medians across all
   * repetitions.
   *
   * @param sample The sample to write.
   */
  writeSample(sample: PerfSample): void {
    mkdirSync(PERF_TEST_CONSTANTS.rawResultsDir, { recursive: true });
    const filename = `${sample.mode}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
    writeFileSync(resolve(PERF_TEST_CONSTANTS.rawResultsDir, filename), JSON.stringify(sample));
  }
}

export default new PerfTestUtils();
