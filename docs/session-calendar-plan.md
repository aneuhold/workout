# WorkoutSessionCalendar Plan

A unified monthly calendar view that displays all workout sessions — both mesocycle-based and free-form — in a single-month grid with month/year navigation.

## Goal

Create a `WorkoutSessionCalendar` component that shows one calendar month at a time. It displays every scheduled and completed session for that month regardless of source (mesocycle or free-form). Users navigate months via left/right arrows or a month/year picker. The implementation shares as many components as possible with the existing `MesocycleCalendar`, which is renamed to `WorkoutMesocycleCalendar` as part of this work.

## Prerequisite

This plan assumes the shadcn `Calendar` component has been updated with a `hideGrid` prop per `docs/calendar-month-year-picker-plan.md`. That change must land first so `WorkoutSessionCalendar` can reuse the existing Calendar component as a month/year picker without the day grid.

## Naming Convention

To avoid collisions with the existing shadcn `$ui/Calendar/Calendar.svelte` (a date-picker widget), the workout-calendar components live under a distinct top-level folder and carry a `WorkoutCalendar` / `WorkoutMesocycleCalendar` / `WorkoutSessionCalendar` prefix on every file, component, and type.

## File Structure After Implementation

```
src/components/WorkoutCalendar/
  shared/
    workoutCalendarTypes.ts              ← shared types
    workoutCalendarUtils.ts              ← shared date helpers
    WorkoutCalendarDayHeaders.svelte     ← Sun–Sat header row
    WorkoutCalendarDayCell.svelte        ← generic day cell
    WorkoutCalendarDayDetailDialog.svelte← session detail dialog
  MesocycleCalendar/
    WorkoutMesocycleCalendar.svelte
    WorkoutMesocycleCalendarLabelRow.svelte ← cycle/month labels (mesocycle-only)
    workoutMesocycleCalendarTypes.ts     ← mesocycle-specific types
    workoutMesocycleCalendarUtils.ts     ← buildCalendarData (date helpers moved to shared)
    workoutMesocycleCalendarUtils.test.ts
    WorkoutMesocycleCalendar.stories.svelte
    SBWorkoutMesocycleCalendarExample.svelte
  SessionCalendar/
    WorkoutSessionCalendar.svelte        ← root component (uses Calendar in hideGrid mode + month grid)
    workoutSessionCalendarTypes.ts
    workoutSessionCalendarUtils.ts       ← builds month grid from all sessions
    workoutSessionCalendarUtils.test.ts
    WorkoutSessionCalendar.stories.svelte
    SBWorkoutSessionCalendarExample.svelte
```

## Shared Types (`WorkoutCalendar/shared/workoutCalendarTypes.ts`)

The existing types currently prefixed `MesocycleCalendar*` are generic enough to share, just renamed:

| Current Name                | Shared Name               | Notes                                                           |
| --------------------------- | ------------------------- | --------------------------------------------------------------- |
| `MesocycleCalendarSet`      | `WorkoutCalendarSet`      | Identical — planned/actual set data                             |
| `MesocycleCalendarExercise` | `WorkoutCalendarExercise` | Identical — exercise + sets                                     |
| `MesocycleCalendarSession`  | `WorkoutCalendarSession`  | Adds `isFreeForm: boolean` (true when `workoutMicrocycleId` is null) |

The new `isFreeForm` flag on `WorkoutCalendarSession` is populated by both util builders. `WorkoutMesocycleCalendar` always sets it to `false` (its sessions always belong to a microcycle). `WorkoutSessionCalendar` sets it based on `session.workoutMicrocycleId == null`. This drives both the free-form dot/checkmark color in the day cell AND the "Free Form" badge in the detail dialog.

A new shared base day-cell type:

```ts
/** Base day-cell data shared by all workout calendar views. */
export type WorkoutCalendarDayCell = {
  /** Calendar date this cell represents. */
  date: Date;
  /** Whether sessions exist on this day. */
  type: 'session' | 'empty';
  /** Sessions on this day (empty array if none). */
  sessions: WorkoutCalendarSession[];
};
```

`WorkoutMesocycleCalendar` extends it with mesocycle-specific fields in `workoutMesocycleCalendarTypes.ts`:

```ts
import type { WorkoutCalendarDayCell } from '../shared/workoutCalendarTypes';

export type WorkoutMesocycleCalendarDayCell = WorkoutCalendarDayCell & {
  dayIndex: number;
  cycleNumber: number;
  isDeload: boolean;
  isCycleStart: boolean;
  type: 'rest' | 'session' | 'empty'; // adds 'rest'
};
```

`WorkoutSessionCalendar` extends it in `workoutSessionCalendarTypes.ts`:

```ts
import type { WorkoutCalendarDayCell } from '../shared/workoutCalendarTypes';

export type WorkoutSessionCalendarDayCell = WorkoutCalendarDayCell & {
  /** Whether this date is today. */
  isToday: boolean;
  /** Whether this date is outside the displayed month (leading/trailing days). */
  isOutsideMonth: boolean;
};
```

The existing mesocycle-specific grid types (`MesocycleCalendarLabelEntry`, `MesocycleCalendarWeekRow`, `MesocycleCalendarData`) are renamed to `WorkoutMesocycleCalendarLabelEntry`, `WorkoutMesocycleCalendarWeekRow`, `WorkoutMesocycleCalendarData` and stay in `workoutMesocycleCalendarTypes.ts`.

## Shared Components

### `WorkoutCalendarDayHeaders.svelte`

Moved from `MesocycleCalendarDayHeaders.svelte` with no changes. Both calendars import from `WorkoutCalendar/shared/`.

### `WorkoutCalendarDayCell.svelte`

Refactored from `MesocycleCalendarDayCell.svelte`. The shared version accepts:

```ts
type Props = {
  /** Date number to display (e.g. 15). */
  dateLabel: number;
  /** Sessions on this day. Used to render indicator dots/checkmarks. */
  sessions: WorkoutCalendarSession[];
  /** Visual variant computed by the parent calendar. */
  visual: WorkoutCalendarDayCellVisual;
  /** Whether clicking the cell opens the detail dialog. */
  isClickable: boolean;
  /** Called when a clickable cell is tapped. */
  onDayClick: () => void;
  /** Show a left accent border (used by WorkoutMesocycleCalendar for cycle starts). */
  accentLeft?: boolean;
};
```

The `workoutCalendarDayCellVariants` tailwind-variants definition stays in this file's module context:

```ts
export const workoutCalendarDayCellVariants = tv({
  base: 'relative flex flex-col items-center rounded-md p-1 min-h-12 text-xs transition-colors',
  variants: {
    visual: {
      completed: 'bg-muted/50 text-muted-foreground',
      today: 'bg-primary/10 ring-2 ring-primary',
      session: 'bg-primary/10 ring-1 ring-primary/40',
      rest: 'bg-muted/40 text-muted-foreground',
      empty: 'bg-muted/20 text-muted-foreground',
      'outside-month': 'opacity-30'
    },
    accentLeft: {
      true: 'border-l-2 border-l-primary rounded-l-none'
    }
  }
});

export type WorkoutCalendarDayCellVisual = VariantProps<
  typeof workoutCalendarDayCellVariants
>['visual'];
```

**Note on removed `session-next` variant**: The existing `MesocycleCalendar` has a `'session-next'` visual that highlights the next incomplete session in the mesocycle sequence. This is being removed as part of this refactor — the "next session" highlight was a bug. Only the actual current day gets the primary-ring highlight (`'today'` variant), regardless of which calendar is showing.

**Parent responsibility**: Each calendar computes the `visual` variant for its own cells and passes it down. This keeps the shared cell purely presentational. The `'today'` variant takes precedence over workout-status variants (`'session'` / `'completed'` / `'empty'`) but not over structural variants (`'rest'` / `'outside-month'`).

- **WorkoutMesocycleCalendar** precedence (first match wins): `rest` → `today` → `completed` → `session` → `empty`. Passes `accentLeft={day.isCycleStart}`.
- **WorkoutSessionCalendar** precedence (first match wins): `outside-month` → `today` → `completed` → `session` → `empty`. Never passes `accentLeft`.

`'rest'` wins over `'today'` for mesocycle rest days so the user keeps the clear "no workout today" visual. `'outside-month'` wins over `'today'` for trailing/leading days in the session calendar because those dates aren't interactive and shouldn't claim the user's attention.

### Dot/checkmark colors (source indicators)

The dots and checkmarks inside the day cell are colored per session using this priority:

1. **Recovery exercise** (`session.hasRecoveryExercise === true`) → amber (`text-amber-500` / `bg-amber-500/60`)
2. **Free-form** (`session.isFreeForm === true`) → violet (`text-violet-500` / `bg-violet-500/60`)
3. **Default mesocycle** → primary (`text-primary` / `bg-primary/60`)

Because free-form sessions skip recovery exercise tracking entirely (see `free-form-workouts.md`), rules 1 and 2 are mutually exclusive in practice. The cell background (`session`/`today`/`completed` variant) stays primary-themed regardless of source — only the per-session dots carry the source color. This mirrors the existing recovery-amber pattern.

If violet doesn't feel right against the app theme, swap it for another distinct Tailwind hue (e.g. `teal`, `indigo`, `sky`). Keep it different from both `primary` and `amber`.

### `WorkoutCalendarDayDetailDialog.svelte`

Refactored from `MesocycleCalendarDayDetailDialog.svelte`. The dialog content (session list with exercises/sets grid) is identical for both calendars. The only differences are the description line below the date and whether free-form source badges are shown.

```ts
type WorkoutCalendarDayDetailDescription = {
  /** Primary text — shown in foreground color (e.g. "Cycle 2 of 4" or "2 sessions"). */
  primary: string;
  /** Secondary text — shown in muted color (e.g. "Completed", "Projected targets"). */
  secondary: string;
};

type Props = {
  /** Formatted date string for the dialog title (e.g. "Monday, March 29, 2026"). */
  formattedDate: string;
  /** Two-part subtitle rendered as "{primary} — {secondary}" with distinct styling. */
  description: WorkoutCalendarDayDetailDescription;
  /** Sessions to display in the detail view. */
  sessions: WorkoutCalendarSession[];
  /**
   * When true, renders a "Free Form" badge next to the title of any session with
   * `isFreeForm: true`. WorkoutSessionCalendar passes true; WorkoutMesocycleCalendar
   * passes false (all its sessions are mesocycle sessions, so the label would be noise).
   */
  showSourceLabels?: boolean;
  /** Controls dialog open state. */
  open: boolean; // bindable
};
```

The `primary` text renders in foreground color and the `secondary` in muted color, joined by an em-dash — matching the existing visual treatment. Each parent computes the description object:

- **WorkoutMesocycleCalendar**: `{ primary: "Cycle 2 of 4", secondary: "Completed" }` (matches current visual)
- **WorkoutSessionCalendar**: `{ primary: "2 sessions", secondary: "Completed" }` or `{ primary: "1 session", secondary: "In Progress" }` etc.

### "View Session" button — visibility change

The existing dialog only shows the "View Session" link for completed sessions. This plan changes that: **the button is shown for every session regardless of state** (completed, in-progress, planned). This fix applies to both calendars, not just `WorkoutSessionCalendar`. The link continues to use `/session?sessionId=${sessionId}`; the session page itself handles routing the user to the correct mode (Planning / Active / Review / View) based on session state.

### Source badge rendering

When `showSourceLabels` is true and `session.isFreeForm === true`, render a small **"Free Form"** badge next to the session title (sibling to the existing "Completed" / "RIR" badges), using the violet hue to match the day-cell dots (e.g. `Badge` with `variant="secondary"` + `class="bg-violet-500/20 text-violet-700 dark:text-violet-300"` — or whatever matches the rest of the app's badge patterns best). Sessions with `isFreeForm: false` show no source badge.

The session rendering (exercise list, set grid with planned/actual, recovery badge, RIR badge) stays identical otherwise.

## WorkoutSessionCalendar Component Design

### `WorkoutSessionCalendar.svelte` (Root)

**Props:**

```ts
type Props = {
  /** All sessions to consider (the component filters to the visible month). */
  sessions: WorkoutSession[];
  /** Session exercises for loaded sessions. */
  sessionExercises: WorkoutSessionExercise[];
  /** Sets for loaded sessions. */
  sets: WorkoutSet[];
  /** Exercise documents for name lookups. */
  exercises: WorkoutExercise[];
};
```

**State:**

```ts
const initial = today(getLocalTimeZone());
let pickerPlaceholder = $state<DateValue>(new CalendarDate(initial.year, initial.month, 1));
let selectedDay: WorkoutSessionCalendarDayCell | null = $state(null);
let dialogOpen = $state(false);
```

`pickerPlaceholder` is a bits-ui `DateValue` (used by `Calendar`'s `bind:placeholder`). It drives both the month/year picker display AND the day grid that `WorkoutSessionCalendar` renders below it. Month is 1-based on `DateValue` — convert via `pickerPlaceholder.month - 1` when passing to utils that use 0-based months.

**Layout:**

The shadcn `Calendar` in `hideGrid` mode already renders both the month/year dropdowns AND the prev/next nav arrows — there's no need for a separate header component. `WorkoutSessionCalendar` uses `Calendar` directly above the day grid.

```svelte
<script lang="ts">
  import { CalendarDate, type DateValue, getLocalTimeZone, today } from '@internationalized/date';
  import Calendar from '$ui/Calendar/Calendar.svelte';
  import WorkoutCalendarDayHeaders from '../shared/WorkoutCalendarDayHeaders.svelte';
  import WorkoutCalendarDayCell from '../shared/WorkoutCalendarDayCell.svelte';
  import WorkoutCalendarDayDetailDialog from '../shared/WorkoutCalendarDayDetailDialog.svelte';
  import workoutSessionCalendarUtils from './workoutSessionCalendarUtils';

  // ...props...

  const initial = today(getLocalTimeZone());
  let pickerPlaceholder = $state<DateValue>(new CalendarDate(initial.year, initial.month, 1));
  let selectedDay: WorkoutSessionCalendarDayCell | null = $state(null);
  let dialogOpen = $state(false);

  const monthGrid = $derived(
    workoutSessionCalendarUtils.buildMonthGrid({
      year: pickerPlaceholder.year,
      month: pickerPlaceholder.month - 1, // DateValue is 1-based; utils are 0-based
      sessions,
      sessionExercises,
      sets,
      exercises
    })
  );
</script>

<div class="w-full max-w-md mx-auto p-1">
  <Calendar
    type="single"
    captionLayout="dropdown"
    hideGrid
    bind:placeholder={pickerPlaceholder}
  />
  <WorkoutCalendarDayHeaders />
  {#each monthGrid.weekRows as row, rowIdx (rowIdx)}
    <div class="grid grid-cols-7 gap-1 mt-1">
      {#each row as day, colIdx (colIdx)}
        <WorkoutCalendarDayCell
          dateLabel={day.date.getDate()}
          sessions={day.sessions}
          visual={computeVisual(day)}
          isClickable={day.sessions.length > 0 && !day.isOutsideMonth}
          onDayClick={() => handleDayClick(day)}
        />
      {/each}
    </div>
  {/each}
</div>

<WorkoutCalendarDayDetailDialog ... />
```

The `pickerPlaceholder` is the single source of truth for which month is visible. The `Calendar` component's built-in prev/next arrows step it month-by-month; its month/year dropdowns let users jump to any month/year. The `monthGrid` `$derived` rebuilds whenever the placeholder changes, re-rendering the day grid for the new month.

`computeVisual(day)` and `handleDayClick(day)` are local helpers defined inside the component file. `computeDescription(day)` is also local and returns a `WorkoutCalendarDayDetailDescription` object for the dialog based on the selected day's sessions.

### `workoutSessionCalendarUtils.ts`

**Key function: `buildMonthGrid`**

```ts
type BuildMonthGridInput = {
  year: number;
  month: number; // 0-based
  sessions: WorkoutSession[];
  sessionExercises: WorkoutSessionExercise[];
  sets: WorkoutSet[];
  exercises: WorkoutExercise[];
};

type WorkoutSessionCalendarMonthGrid = {
  weekRows: WorkoutSessionCalendarDayCell[][];
};
```

Logic:

1. Compute first day of month and last day of month.
2. Compute leading padding days (from previous month, to fill the first week row starting on Sunday).
3. Compute trailing padding days (to fill the last week row).
4. For each day in the range, look up sessions whose `startTime` falls on that date.
5. Build `WorkoutCalendarSession` objects with nested exercises/sets (reuse the same lookup-map pattern from `workoutMesocycleCalendarUtils`).
6. Mark `isToday` and `isOutsideMonth` flags.
7. Group into rows of 7.

The date-helper functions (`isNewMonth`, `formatMonthLabel`, `addDays`) currently in `mesocycleCalendarUtils.ts` are extracted into shared `WorkoutCalendar/shared/workoutCalendarUtils.ts` and imported by both utils files.

## Implementation Tasks

### Task 1: Create shared infrastructure

1. Create `src/components/WorkoutCalendar/shared/workoutCalendarTypes.ts` with `WorkoutCalendarSet`, `WorkoutCalendarExercise`, `WorkoutCalendarSession`, `WorkoutCalendarDayCell`.
2. Create `src/components/WorkoutCalendar/shared/workoutCalendarUtils.ts` with extracted date helpers (`addDays`, `isNewMonth`, `formatMonthLabel`, `normalizedDateKey`).
3. Move `MesocycleCalendarDayHeaders.svelte` to `src/components/WorkoutCalendar/shared/WorkoutCalendarDayHeaders.svelte`.

### Task 2: Extract shared `WorkoutCalendarDayCell`

1. Create `src/components/WorkoutCalendar/shared/WorkoutCalendarDayCell.svelte` with a `@component` JSDoc at the top and the generalized props (`dateLabel`, `sessions`, `visual`, `isClickable`, `onDayClick`, `accentLeft`).
2. Export `workoutCalendarDayCellVariants` and `WorkoutCalendarDayCellVisual` from the module block.
3. Update the visual variants: replace the old `'session-next'` with `'today'`, add `'outside-month'`.
4. Update the session indicator rendering to use the per-session source priority (recovery-amber → free-form-violet → mesocycle-primary) for dots and checkmarks.

### Task 3: Extract shared `WorkoutCalendarDayDetailDialog`

1. Create `src/components/WorkoutCalendar/shared/WorkoutCalendarDayDetailDialog.svelte` with a `@component` JSDoc at the top and the props (`formattedDate`, `description` object, `sessions`, `showSourceLabels`, `open`).
2. The exercise/set rendering block moves in verbatim, with `WorkoutCalendarSession`/`WorkoutCalendarExercise`/`WorkoutCalendarSet` type imports.
3. Render the description as two spans with distinct styling (primary foreground, secondary muted) joined by an em-dash.
4. **"View Session" button** is now shown for every session regardless of completion state (see earlier section).
5. When `showSourceLabels` is true, render a "Free Form" badge next to the session title for any session with `isFreeForm: true`.

### Task 4: Rename and update MesocycleCalendar → WorkoutMesocycleCalendar

1. Move all files from `src/components/MesocycleCalendar/` to `src/components/WorkoutCalendar/MesocycleCalendar/` and rename:
   - `MesocycleCalendar.svelte` → `WorkoutMesocycleCalendar.svelte`
   - `MesocycleCalendarLabelRow.svelte` → `WorkoutMesocycleCalendarLabelRow.svelte`
   - `mesocycleCalendarTypes.ts` → `workoutMesocycleCalendarTypes.ts`
   - `mesocycleCalendarUtils.ts` → `workoutMesocycleCalendarUtils.ts`
   - `mesocycleCalendarUtils.test.ts` → `workoutMesocycleCalendarUtils.test.ts`
   - `MesocycleCalendar.stories.svelte` → `WorkoutMesocycleCalendar.stories.svelte`
   - `SBMesocycleCalendarExample.svelte` → `SBWorkoutMesocycleCalendarExample.svelte`
2. Delete the no-longer-needed `MesocycleCalendarDayHeaders.svelte`, `MesocycleCalendarDayCell.svelte`, and `MesocycleCalendarDayDetailDialog.svelte` — these are replaced by the shared versions.
3. Rename types in `workoutMesocycleCalendarTypes.ts`: `MesocycleCalendarDayCell` → `WorkoutMesocycleCalendarDayCell`, `MesocycleCalendarLabelEntry` → `WorkoutMesocycleCalendarLabelEntry`, `MesocycleCalendarWeekRow` → `WorkoutMesocycleCalendarWeekRow`, `MesocycleCalendarData` → `WorkoutMesocycleCalendarData`. Make `WorkoutMesocycleCalendarDayCell` extend the shared `WorkoutCalendarDayCell`.
4. Update `workoutMesocycleCalendarUtils.ts`: import date helpers from `../shared/workoutCalendarUtils`, import shared types, rename the class/instance (`MesocycleCalendarUtils` → `WorkoutMesocycleCalendarUtils`).
5. Update `WorkoutMesocycleCalendar.svelte`:
   - Import `WorkoutCalendarDayHeaders`, `WorkoutCalendarDayCell`, and `WorkoutCalendarDayDetailDialog` from `../shared/`.
   - **Remove the `nextSessionDayIndex` derived value and all logic that computed it** — it's no longer used. Replace with a simple "is today" check on each cell.
   - Compute the `visual` variant per cell using the precedence documented above (`rest` → `today` → `completed` → `session` → `empty`). Pass `accentLeft={day.isCycleStart}`.
   - Compute the `description` prop as `{ primary: "Cycle X of Y" | "Deload", secondary: "Completed" | "Projected targets" | "Session details" }`.
   - Pass `showSourceLabels={false}` to the detail dialog (mesocycle sessions never need source badges).
   - Preserve all other existing behavior: recovery-exercise amber styling, label row positioning, cycle-start left border, deload detection, empty/rest day handling.
6. Update `workoutMesocycleCalendarUtils.ts`:
   - When building sessions, set `isFreeForm: false` on every `WorkoutCalendarSession` (mesocycle sessions always have a microcycle).
   - Drop the `nextSessionDayIndex` concept entirely if it exists in utils (it lives in the component file today, so likely no util changes needed for this).
7. Update `WorkoutMesocycleCalendarLabelRow.svelte` import paths and type name.
8. Update all imports across the codebase that reference the old `$components/MesocycleCalendar` path or any of the renamed types.
9. Update `SBMesocycleCalendarExample.svelte` and the stories file to use the new names and drop any `nextSessionDayIndex`-related story args.
10. Run `pnpm check`, `pnpm lint --fix`, `pnpm test` — fix any breakage.

### Task 5: Build `WorkoutSessionCalendar` components

1. Create `workoutSessionCalendarTypes.ts` with `WorkoutSessionCalendarDayCell` and `WorkoutSessionCalendarMonthGrid`.
2. Create `workoutSessionCalendarUtils.ts` with `buildMonthGrid` (exported as a singleton instance, same pattern as `workoutMesocycleCalendarUtils`). The builder populates `isFreeForm` on each `WorkoutCalendarSession` based on `session.workoutMicrocycleId == null`.
3. Create `WorkoutSessionCalendar.svelte` root component with a `@component` JSDoc at the top:
   - Uses shadcn `Calendar` in `hideGrid` mode for the month/year picker.
   - Defines a local `computeVisual(day)` helper that maps a `WorkoutSessionCalendarDayCell` to the correct visual variant (precedence: `outside-month` → `today` → `completed` → `session` → `empty`).
   - Defines a local `computeDescription(day)` helper producing the `{ primary, secondary }` description object.
   - Passes `showSourceLabels={true}` to the detail dialog.
4. Write `workoutSessionCalendarUtils.test.ts` covering:
   - Empty month (no sessions)
   - Month with sessions from different sources (mesocycle + free-form) — verify `isFreeForm` flag is set correctly per session
   - Leading/trailing padding days marked as `isOutsideMonth`
   - `isToday` flag accuracy
   - Sessions correctly matched to dates

### Task 6: Storybook stories

1. Create `SBWorkoutSessionCalendarExample.svelte` with mock data (mix of mesocycle and free-form sessions across a month).
2. Create `WorkoutSessionCalendar.stories.svelte` with variations:
   - Default (current month, some sessions)
   - Empty month
   - Month with all completed sessions
   - Month with mixed sources (mesocycle + free-form)

### Task 7: Lint, check, test

1. Run `pnpm lint --fix`, `pnpm check`, `pnpm test`.
2. Verify `WorkoutMesocycleCalendar` Storybook stories still render correctly after the rename/refactor.
3. Verify `WorkoutSessionCalendar` Storybook stories render correctly.

## Notes

- `WorkoutMesocycleCalendarLabelRow` stays inside `MesocycleCalendar/` because cycle/month labels above rows are a mesocycle-only concept. `WorkoutSessionCalendar` does not need label rows — month context is provided by the shadcn `Calendar` picker at the top.
- The `rest` day type is mesocycle-only. `WorkoutSessionCalendar` only has `session` and `empty` day types.
- **Removed:** the old `'session-next'` highlight (next incomplete mesocycle session) is dropped from both calendars. Only the actual current day gets the primary-ring highlight via the `'today'` visual variant.
- **Free-form source distinction:** dots/checkmarks inside day cells use violet for free-form sessions, amber for recovery exercises, primary for default mesocycle sessions. The detail dialog shows a "Free Form" badge next to the session title when `showSourceLabels` is true (WorkoutSessionCalendar only).
- **"View Session" link** in the detail dialog is now available for every session regardless of state (bug fix — previously shown only for completed sessions).
- Outside-month days are shown but dimmed (`opacity-30`) and not clickable. This provides calendar context without clutter.
- `WorkoutSessionCalendar` does not load data itself — it receives props. The parent page/route is responsible for providing the session/exercise/set data. This keeps the component pure and testable.
- Timezone/DST: session `startTime` values and calendar day cells both use the local timezone and match on `${year}-${month}-${day}` keys. DST transitions never land on month boundaries, and `Date.setDate()` (used by `addDays`) is DST-safe, so no special handling is needed.
- Where `WorkoutSessionCalendar` is mounted (Sessions page, new route, etc.) is out of scope for this plan.
