import { FileSystemService } from '@aneuhold/core-ts-lib/node';
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { extname, resolve } from 'path';
import {
  type AggregatedMode,
  type AggregatedResults,
  PERF_TEST_CONSTANTS,
  PerfMode,
  type PerfResultsFile,
  type PerfSample
} from '$testUtils/perfTestUtils';
import { PerfMark } from '$util/perfMarks';

/**
 * How many times it needs to run each mode.
 */
const REPEAT_EACH = 3;
/**
 * Maximum tolerated regression vs baseline before the job fails.
 */
const REGRESSION_THRESHOLD = 0.15;

// === Main flow ===

const labelArg = process.argv.find((a) => a.startsWith('--label='))?.split('=')[1];
const isCompare = process.argv.includes('--compare');

// All measurement modes need a built source under `./build/` that includes
// every PerfMark. If any are missing (e.g. measuring `main` from
// before this branch added the marks), exit cleanly so the compare step
// renders "—" for that side instead of timing out inside Playwright.
if (!isCompare) {
  const missing = await findMissingMarks();
  if (missing.length > 0) {
    console.log(
      `[perf] ${labelArg ?? 'local'}: ./build/ is missing perf marks [${missing.join(', ')}]; skipping measurement.`
    );
    process.exit(0);
  }
}

if (isCompare) {
  // CI compare flow: read the two label files written by prior `--label=...`
  // runs on the same runner and gate on Slow-mode regressions of PR vs main.
  const pr = readResultsFile(PERF_TEST_CONSTANTS.prResultsPath);
  const main = readResultsFile(PERF_TEST_CONSTANTS.mainResultsPath);
  reportComparison(pr, main, 'PR', 'Main');
} else if (labelArg === 'pr' || labelArg === 'main') {
  // CI per-build flow: measure the currently-staged build and write the
  // aggregated medians to a labeled file for the compare step to read back.
  runPlaywrightSuite();
  const path =
    labelArg === 'pr' ? PERF_TEST_CONSTANTS.prResultsPath : PERF_TEST_CONSTANTS.mainResultsPath;
  writeResultsFile(path, aggregateRawSamples());
} else if (labelArg) {
  console.error(`Unknown --label=${labelArg}; expected 'pr' or 'main'.`);
  process.exit(1);
} else {
  // Local flow: measure, compare to the committed `localBaseline.json`, then
  // refresh it so `git diff` surfaces the change for the dev to review and
  // commit.
  runPlaywrightSuite();
  const latest = aggregateRawSamples();
  const baseline = readResultsFile(PERF_TEST_CONSTANTS.localBaselinePath);
  reportComparison(latest, baseline);
  writeResultsFile(PERF_TEST_CONSTANTS.localBaselinePath, latest);
}

// === Helpers ===

/**
 * Walks `./build/` looking for each {@link PerfMark} value as a quoted
 * literal in any HTML or JS file. Mark names are runtime arguments to
 * `performance.mark()`, so the literal survives to the built output, though
 * the surrounding quote character depends on the minifier. Returns the marks
 * that weren't found anywhere, so an empty array means the build is fully
 * instrumented.
 */
async function findMissingMarks(): Promise<PerfMark[]> {
  const buildDir = resolve('build');
  if (!existsSync(buildDir)) return Object.values(PerfMark);

  const remaining = new Set<PerfMark>(Object.values(PerfMark));
  const allFiles = await FileSystemService.getAllFilePaths(buildDir);
  /**
   * Quote characters a minifier may wrap a string literal in. Rolldown emits
   * template literals where esbuild emitted single quotes, so all three need
   * to count as a match.
   */
  const QUOTE_CHARS = ["'", '"', '`'];
  for (const file of allFiles) {
    if (remaining.size === 0) break;
    const ext = extname(file).toLowerCase();
    if (ext !== '.html' && ext !== '.js') continue;
    const content = readFileSync(file, 'utf-8');
    for (const mark of [...remaining]) {
      if (QUOTE_CHARS.some((quote) => content.includes(`${quote}${mark}${quote}`))) {
        remaining.delete(mark);
      }
    }
  }
  return [...remaining];
}

/**
 * Wipes any prior raw samples and runs the perf spec under Playwright with
 * `REPEAT_EACH` repetitions per mode.
 */
function runPlaywrightSuite(): void {
  if (existsSync(PERF_TEST_CONSTANTS.rawResultsDir)) {
    rmSync(PERF_TEST_CONSTANTS.rawResultsDir, { recursive: true, force: true });
  }
  mkdirSync(PERF_TEST_CONSTANTS.rawResultsDir, { recursive: true });
  const result = spawnSync('pnpm', ['exec', 'playwright', 'test', `--repeat-each=${REPEAT_EACH}`], {
    stdio: 'inherit',
    shell: false
  });
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
 * Reads a {@link PerfResultsFile} from disk and returns just the inner
 * medians. Returns empty buckets when the file is missing (first-ever run).
 *
 * @param path Path to a {@link PerfResultsFile} on disk.
 */
function readResultsFile(path: string): AggregatedResults {
  if (!existsSync(path)) {
    return { [PerfMode.Fast]: {}, [PerfMode.Slow]: {} };
  }
  const file: PerfResultsFile = JSON.parse(readFileSync(path, 'utf-8'));
  return file.results;
}

/**
 * Wraps `results` with a fresh ISO timestamp and writes the
 * {@link PerfResultsFile} to `path`. Creates the parent directory if needed.
 *
 * @param path Destination path.
 * @param results Aggregated medians to persist.
 */
function writeResultsFile(path: string, results: AggregatedResults): void {
  const file: PerfResultsFile = { timestamp: new Date().toISOString(), results };
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, JSON.stringify(file, null, 2));
}

/**
 * Renders the PR comment, writes it to disk, prints it, and exits non-zero
 * if any Slow-mode metric exceeds {@link REGRESSION_THRESHOLD}. Shared by
 * the local and CI-compare flows.
 *
 * @param current Aggregated results from this run (or the PR build in CI).
 * @param prev Comparison target (local baseline, or the main build in CI).
 * @param currentLabel Column header for `current`.
 * @param prevLabel Column header for `prev`.
 */
function reportComparison(
  current: AggregatedResults,
  prev: AggregatedResults,
  currentLabel = 'Current',
  prevLabel = 'Baseline'
): void {
  mkdirSync(PERF_TEST_CONSTANTS.resultsDir, { recursive: true });
  const comment = renderComment(current, prev, currentLabel, prevLabel);
  writeFileSync(PERF_TEST_CONSTANTS.prCommentPath, comment);
  console.log(comment);

  const regressions = detectRegressions(current, prev);
  if (regressions.length > 0) {
    console.error('\nPerf regressions detected:');
    for (const failure of regressions) console.error(`  - ${failure}`);
    process.exit(1);
  }
}

/**
 * Builds the markdown body posted as the sticky PR comment.
 *
 * @param current Aggregated results from this run.
 * @param prev Comparison target.
 * @param currentLabel Column header for `current`.
 * @param prevLabel Column header for `prev`.
 */
function renderComment(
  current: AggregatedResults,
  prev: AggregatedResults,
  currentLabel: string,
  prevLabel: string
): string {
  return [
    '🚦 Perf Results',
    '',
    renderTable(
      'Fast — 10 Mbps / 50 ms / 2x CPU',
      current[PerfMode.Fast],
      prev[PerfMode.Fast],
      currentLabel,
      prevLabel
    ),
    renderTable(
      'Slow — Slow 4G + 4x CPU',
      current[PerfMode.Slow],
      prev[PerfMode.Slow],
      currentLabel,
      prevLabel
    )
  ].join('\n');
}

function renderTable(
  title: string,
  current: AggregatedMode,
  prev: AggregatedMode,
  currentLabel: string,
  prevLabel: string
): string {
  const names = new Set([...Object.keys(current), ...Object.keys(prev)]);
  const rows = [...names].sort().map((name) => {
    const c = current[name]?.median;
    const b = prev[name]?.median;
    return `| ${name} | ${formatMs(c)} | ${formatMs(b)} | ${formatDelta(c, b)} |`;
  });
  return [
    `### ${title}`,
    '',
    `| Metric | ${currentLabel} | ${prevLabel} | Δ |`,
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
