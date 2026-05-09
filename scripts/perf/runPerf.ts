import { spawnSync } from 'child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'fs';
import { resolve } from 'path';
import {
  type AggregatedMode,
  type AggregatedResults,
  PERF_TEST_CONSTANTS,
  PerfMode,
  type PerfSample
} from '$testUtils/perfTestUtils';

/**
 * How many times it needs to run each mode.
 */
const REPEAT_EACH = 3;
/**
 * Maximum tolerated regression vs baseline before the job fails.
 */
const REGRESSION_THRESHOLD = 0.15;

// === Main flow ===

runPlaywrightSuite();

const latest = aggregateRawSamples();
mkdirSync(PERF_TEST_CONSTANTS.resultsDir, { recursive: true });
writeFileSync(PERF_TEST_CONSTANTS.latestPath, JSON.stringify(latest, null, 2));

const baseline = readBaseline();
const comment = renderComment(latest, baseline);
writeFileSync(PERF_TEST_CONSTANTS.prCommentPath, comment);
console.log(comment);

// Promote latest → baseline. The comparison above already ran against the
// committed baseline (read into memory before this overwrite), so this just
// stages a candidate baseline on disk. Locally, `git diff` shows the change
// and the dev decides whether to commit. In CI it lives on the runner only.
copyFileSync(PERF_TEST_CONSTANTS.latestPath, PERF_TEST_CONSTANTS.baselinePath);

const regressions = detectRegressions(latest, baseline);
if (regressions.length > 0) {
  console.error('\nPerf regressions detected:');
  for (const failure of regressions) console.error(`  - ${failure}`);
  process.exit(1);
}

// === Helpers ===

/**
 * Wipes any prior raw samples and runs the perf spec under Playwright with
 * `REPEAT_EACH` repetitions per mode.
 */
function runPlaywrightSuite(): void {
  if (existsSync(PERF_TEST_CONSTANTS.rawResultsDir)) {
    rmSync(PERF_TEST_CONSTANTS.rawResultsDir, { recursive: true, force: true });
  }
  mkdirSync(PERF_TEST_CONSTANTS.rawResultsDir, { recursive: true });
  const result = spawnSync(
    'pnpm',
    ['exec', 'playwright', 'test', 'scripts/perf/perf.spec.ts', `--repeat-each=${REPEAT_EACH}`],
    { stdio: 'inherit', shell: false }
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

/**
 * Reads every raw sample file the spec wrote and groups them by throttling
 * mode and metric name, computing the median per metric.
 */
function aggregateRawSamples(): AggregatedResults {
  const aggregated: AggregatedResults = {
    [PerfMode.Fast]: {},
    [PerfMode.Slow]: {}
  };
  if (!existsSync(PERF_TEST_CONSTANTS.rawResultsDir)) return aggregated;

  for (const file of readdirSync(PERF_TEST_CONSTANTS.rawResultsDir)) {
    if (!file.endsWith('.json')) continue;
    const sample: PerfSample = JSON.parse(
      readFileSync(resolve(PERF_TEST_CONSTANTS.rawResultsDir, file), 'utf-8')
    );
    const bucket = aggregated[sample.mode];
    for (const [name, value] of Object.entries(sample.metrics)) {
      if (Number.isNaN(value)) continue;
      const existing = bucket[name] ?? { samples: [], median: 0 };
      existing.samples.push(value);
      bucket[name] = existing;
    }
  }

  for (const mode of Object.values(PerfMode)) {
    for (const metric of Object.values(aggregated[mode])) {
      if (metric) metric.median = median(metric.samples);
    }
  }
  return aggregated;
}

/**
 * Reads the committed baseline. Returns empty buckets if the file is missing
 * (first-ever run on a fresh checkout).
 */
function readBaseline(): AggregatedResults {
  if (!existsSync(PERF_TEST_CONSTANTS.baselinePath)) {
    return { [PerfMode.Fast]: {}, [PerfMode.Slow]: {} };
  }
  return JSON.parse(readFileSync(PERF_TEST_CONSTANTS.baselinePath, 'utf-8'));
}

/**
 * Builds the markdown body posted as the sticky PR comment.
 *
 * @param current Aggregated results from this run.
 * @param prev Committed baseline to compare against.
 */
function renderComment(current: AggregatedResults, prev: AggregatedResults): string {
  return [
    '🚦 Perf Results',
    '',
    renderTable(
      'Fast — 10 Mbps / 50 ms / 2× CPU (dashboard)',
      current[PerfMode.Fast],
      prev[PerfMode.Fast]
    ),
    renderTable('Slow — Slow 4G + 4× CPU (gate)', current[PerfMode.Slow], prev[PerfMode.Slow])
  ].join('\n');
}

function renderTable(title: string, current: AggregatedMode, prev: AggregatedMode): string {
  const names = new Set([...Object.keys(current), ...Object.keys(prev)]);
  const rows = [...names].sort().map((name) => {
    const c = current[name]?.median;
    const b = prev[name]?.median;
    return `| ${name} | ${formatMs(c)} | ${formatMs(b)} | ${formatDelta(c, b)} |`;
  });
  return [
    `### ${title}`,
    '',
    '| Metric | Current | Baseline | Δ |',
    '| --- | --- | --- | --- |',
    ...rows,
    ''
  ].join('\n');
}

/**
 * Returns one line per slow-mode metric whose current median exceeds the
 * baseline by more than {@link REGRESSION_THRESHOLD}. Empty array → CI passes.
 *
 * @param current Aggregated results from this run.
 * @param prev Committed baseline to compare against.
 */
function detectRegressions(current: AggregatedResults, prev: AggregatedResults): string[] {
  const failures: string[] = [];
  for (const [name, metric] of Object.entries(current[PerfMode.Slow])) {
    if (!metric) continue;
    const baselineMedian = prev[PerfMode.Slow][name]?.median;
    if (baselineMedian === undefined || baselineMedian === 0) continue;
    const delta = (metric.median - baselineMedian) / baselineMedian;
    if (delta > REGRESSION_THRESHOLD) {
      failures.push(
        `${name}: ${metric.median.toFixed(0)}ms vs baseline ${baselineMedian.toFixed(0)}ms (+${(
          delta * 100
        ).toFixed(1)}% > ${(REGRESSION_THRESHOLD * 100).toFixed(0)}%)`
      );
    }
  }
  return failures;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function formatMs(value: number | undefined): string {
  return value === undefined ? '—' : `${value.toFixed(0)} ms`;
}

function formatDelta(current: number | undefined, prev: number | undefined): string {
  if (current === undefined || prev === undefined || prev === 0) return '—';
  const delta = (current - prev) / prev;
  return `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`;
}
