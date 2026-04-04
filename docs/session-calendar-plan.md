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

The existing types currently prefixed `MesocycleCalendar*` are generic enough to share as-is, just renamed:

| Current Name                | Shared Name               | Notes                               |
| --------------------------- | ------------------------- | ----------------------------------- |
| `MesocycleCalendarSet`      | `WorkoutCalendarSet`      | Identical — planned/actual set data |
| `MesocycleCalendarExercise` | `WorkoutCalendarExercise` | Identical — exercise + sets         |
| `MesocycleCalendarSession`  | `WorkoutCalendarSession`  | Identical — session title/exercises |

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

The `workoutCalendarDayCellVariants` tailwind-variants definition stays in this file's module context. New `'today'` and `'outside-month'` variants are added for `WorkoutSessionCalendar`:

```ts
export const workoutCalendarDayCellVariants = tv({
  base: 'relative flex flex-col items-center rounded-md p-1 min-h-12 text-xs transition-colors',
  variants: {
    visual: {
      completed: 'bg-muted/50 text-muted-foreground',
      'session-next': 'bg-primary/10 ring-2 ring-primary',
      session: 'bg-primary/10 ring-1 ring-primary/40',
      rest: 'bg-muted/40 text-muted-foreground',
      empty: 'bg-muted/20 text-muted-foreground',
      today: 'bg-primary/10 ring-2 ring-primary',
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

**Parent responsibility**: Each calendar computes the `visual` variant for its own cells and passes it down. This keeps the shared cell purely presentational.

- **WorkoutMesocycleCalendar** computes visual as it does today (completed/session-next/session/rest/empty) and passes `accentLeft={day.isCycleStart}`.
- **WorkoutSessionCalendar** computes visual as: `outside-month` if outside the displayed month, `completed` if all sessions complete, `today` if today and has incomplete sessions, `session` if has incomplete sessions, `empty` otherwise. Never passes `accentLeft`.

### `WorkoutCalendarDayDetailDialog.svelte`

Refactored from `MesocycleCalendarDayDetailDialog.svelte`. The dialog content (session list with exercises/sets grid) is identical for both calendars. The only difference is the description line below the date.

```ts
type Props = {
  /** Formatted date string for the dialog title (e.g. "Monday, March 29, 2026"). */
  formattedDate: string;
  /** Subtitle shown below the date (e.g. "Cycle 2 of 4 — Projected targets" or "2 sessions — Completed"). */
  description: string;
  /** Sessions to display in the detail view. */
  sessions: WorkoutCalendarSession[];
  /** Controls dialog open state. */
  open: boolean; // bindable
};
```

Each parent computes the description string:

- **WorkoutMesocycleCalendar**: `"Cycle 2 of 4 — Completed"` (as it does today)
- **WorkoutSessionCalendar**: `"2 sessions — Completed"` or `"Free-form — In Progress"` depending on session sources

The session rendering (exercise list, set grid with planned/actual, View Session link, recovery badge, RIR badge) stays identical inside this dialog.

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

1. Create `src/components/WorkoutCalendar/shared/WorkoutCalendarDayCell.svelte` with the generalized props (`dateLabel`, `sessions`, `visual`, `isClickable`, `onDayClick`, `accentLeft`).
2. Export `workoutCalendarDayCellVariants` and `WorkoutCalendarDayCellVisual` from the module block.
3. Add the `'today'` and `'outside-month'` visual variants to `workoutCalendarDayCellVariants`.
4. Keep the session indicator rendering (dots/checkmarks) identical.

### Task 3: Extract shared `WorkoutCalendarDayDetailDialog`

1. Create `src/components/WorkoutCalendar/shared/WorkoutCalendarDayDetailDialog.svelte` with parameterized `formattedDate`, `description`, `sessions`, and `open`.
2. The exercise/set rendering block moves in verbatim, with `WorkoutCalendarSession`/`WorkoutCalendarExercise`/`WorkoutCalendarSet` type imports.

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
5. Update `WorkoutMesocycleCalendar.svelte`: import `WorkoutCalendarDayHeaders`, `WorkoutCalendarDayCell`, and `WorkoutCalendarDayDetailDialog` from `../shared/`. Compute the `visual` variant and `accentLeft` for each cell. Compute the `description` prop for the dialog (`"Cycle X of Y — ..."`).
6. Update `WorkoutMesocycleCalendarLabelRow.svelte` import paths and type name.
7. Update all imports across the codebase that reference the old `$components/MesocycleCalendar` path or any of the renamed types.
8. Run `pnpm check`, `pnpm lint --fix`, `pnpm test` — fix any breakage.

### Task 5: Build `WorkoutSessionCalendar` components

1. Create `workoutSessionCalendarTypes.ts` with `WorkoutSessionCalendarDayCell` and `WorkoutSessionCalendarMonthGrid`.
2. Create `workoutSessionCalendarUtils.ts` with `buildMonthGrid` (exported as a singleton instance, same pattern as `workoutMesocycleCalendarUtils`).
3. Create `WorkoutSessionCalendar.svelte` root component — uses shadcn `Calendar` in `hideGrid` mode for the month/year picker (arrows + dropdowns), binds to `placeholder` to drive the month grid below.
4. Write `workoutSessionCalendarUtils.test.ts` covering:
   - Empty month (no sessions)
   - Month with sessions from different sources (mesocycle + free-form)
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
- The `'session-next'` visual variant is mesocycle-only (highlights the next incomplete session in the mesocycle sequence). `WorkoutSessionCalendar` uses `'today'` instead for the primary highlight.
- Outside-month days are shown but dimmed (`opacity-30`) and not clickable. This provides calendar context without clutter.
- `WorkoutSessionCalendar` does not load data itself — it receives props. The parent page/route is responsible for providing the session/exercise/set data. This keeps the component pure and testable.
- Where `WorkoutSessionCalendar` is mounted (Sessions page, new route, etc.) is out of scope for this plan.
