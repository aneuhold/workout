/**
 * Single source of truth for `performance.mark` names emitted by the app.
 * Runtime call sites use `performance.mark(PerfMark.X)`; the perf
 * orchestrator (`scripts/commands/perf/runPerf.ts`) reads `Object.values(PerfMark)`
 * to validate that a built artifact contains every expected mark before
 * launching Playwright.
 *
 * Note: `src/app.html` emits {@link PerfMark.Boot} as a string literal in a
 * plain `<script>` tag and cannot import this enum. Keep its literal
 * (`'boot'`) in lockstep with the enum value.
 */
export enum PerfMark {
  Boot = 'boot',
  HomeRendered = 'home-rendered',
  SessionsListRendered = 'sessions-list-rendered',
  HydrationNetworkComplete = 'hydration-network-complete'
}
