# SessionCalendar Plan

A unified monthly calendar view that displays all workout sessions — both mesocycle-based and free-form — in a single-month grid with month/year navigation.

## Goal

Create a `SessionCalendar` component that shows one calendar month at a time. It displays every scheduled and completed session for that month regardless of source (mesocycle or free-form). Users navigate months via left/right arrows or a month/year picker. The implementation shares as many components as possible with the existing `MesocycleCalendar`.

## File Structure After Implementation

```
src/components/Calendar/
  shared/
    calendarTypes.ts              ← shared types (extracted + renamed from MesocycleCalendar)
    calendarUtils.ts              ← shared date helpers (extracted from mesocycleCalendarUtils)
    CalendarDayHeaders.svelte     ← Sun–Sat header row (moved from MesocycleCalendar)
    CalendarDayCell.svelte        ← generic day cell (refactored from MesocycleCalendar)
    CalendarDayDetailDialog.svelte← session detail dialog (refactored from MesocycleCalendar)
  MesocycleCalendar/
    MesocycleCalendar.svelte      ← updated imports, delegates to shared components
    MesocycleCalendarLabelRow.svelte ← stays (cycle/month labels are mesocycle-only)
    mesocycleCalendarTypes.ts     ← mesocycle-specific types (DayCell extension, label types, grid data)
    mesocycleCalendarUtils.ts     ← buildCalendarData stays, date helpers move to shared
    mesocycleCalendarUtils.test.ts
    MesocycleCalendar.stories.svelte
    SBMesocycleCalendarExample.svelte
  SessionCalendar/
    SessionCalendar.svelte        ← root component (month grid + navigation)
    SessionCalendarHeader.svelte  ← month/year picker + left/right arrows
    sessionCalendarTypes.ts       ← SessionCalendar-specific types
    sessionCalendarUtils.ts       ← builds month grid from all sessions
    sessionCalendarUtils.test.ts
    SessionCalendar.stories.svelte
    SBSessionCalendarExample.svelte
```

## Shared Types (`Calendar/shared/calendarTypes.ts`)

These types are currently prefixed `MesocycleCalendar*`. They are generic enough to be shared as-is, just renamed:

| Current Name                  | Shared Name          | Notes                                |
| ----------------------------- | -------------------- | ------------------------------------ |
| `MesocycleCalendarSet`        | `CalendarSet`        | Identical — planned/actual set data  |
| `MesocycleCalendarExercise`   | `CalendarExercise`   | Identical — exercise + sets          |
| `MesocycleCalendarSession`    | `CalendarSession`    | Identical — session title/exercises  |

A new shared base day-cell type:

```ts
/** Base day-cell data shared by all calendar views. */
export type CalendarDayCell = {
  /** Calendar date this cell represents. */
  date: Date;
  /** Whether sessions exist on this day. */
  type: 'session' | 'empty';
  /** Sessions on this day (empty array if none). */
  sessions: CalendarSession[];
};
```

MesocycleCalendar extends it with mesocycle-specific fields in `mesocycleCalendarTypes.ts`:

```ts
import type { CalendarDayCell } from '../shared/calendarTypes';

export type MesocycleCalendarDayCell = CalendarDayCell & {
  dayIndex: number;
  cycleNumber: number;
  isDeload: boolean;
  isCycleStart: boolean;
  type: 'rest' | 'session' | 'empty'; // adds 'rest'
};
```

SessionCalendar extends it in `sessionCalendarTypes.ts`:

```ts
import type { CalendarDayCell } from '../shared/calendarTypes';

export type SessionCalendarDayCell = CalendarDayCell & {
  /** Whether this date is today. */
  isToday: boolean;
  /** Whether this date is outside the displayed month (leading/trailing days). */
  isOutsideMonth: boolean;
};
```

## Shared Components

### `CalendarDayHeaders.svelte`

Moved from `MesocycleCalendarDayHeaders.svelte` with no changes. Both calendars import from `Calendar/shared/`.

### `CalendarDayCell.svelte`

Refactored from `MesocycleCalendarDayCell.svelte`. The shared version accepts:

```ts
type Props = {
  /** Date number to display (e.g. 15). */
  dateLabel: number;
  /** Sessions on this day. Used to render indicator dots/checkmarks. */
  sessions: CalendarSession[];
  /** Visual variant computed by the parent calendar. */
  visual: DayCellVisual;
  /** Whether clicking the cell opens the detail dialog. */
  isClickable: boolean;
  /** Called when a clickable cell is tapped. */
  onDayClick: () => void;
  /** Show a left accent border (used by MesocycleCalendar for cycle starts). */
  accentLeft?: boolean;
};
```

The `dayCellVariants` TV definition stays in this file's module context. A new `'today'` variant is added for SessionCalendar:

```ts
export const dayCellVariants = tv({
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
```

**Parent responsibility**: Each calendar computes the `visual` variant for its own cells and passes it down. This keeps the shared cell purely presentational.

- **MesocycleCalendar** computes visual as it does today (completed/session-next/session/rest/empty) and passes `accentLeft={day.isCycleStart}`.
- **SessionCalendar** computes visual as: `outside-month` if outside month, `completed` if all sessions complete, `today` if today and has incomplete sessions, `session` if has incomplete sessions, `empty` otherwise. Never passes `accentLeft`.

### `CalendarDayDetailDialog.svelte`

Refactored from `MesocycleCalendarDayDetailDialog.svelte`. The dialog content (session list with exercises/sets grid) is identical for both calendars. The only difference is the description line below the date.

```ts
type Props = {
  /** Formatted date string for the dialog title (e.g. "Monday, March 29, 2026"). */
  formattedDate: string;
  /** Subtitle shown below the date (e.g. "Cycle 2 of 4 — Projected targets" or "2 sessions — Completed"). */
  description: string;
  /** Sessions to display in the detail view. */
  sessions: CalendarSession[];
  /** Controls dialog open state. */
  open: boolean; // bindable
};
```

Each parent computes the description string:
- **MesocycleCalendar**: `"Cycle 2 of 4 — Completed"` (as it does today)
- **SessionCalendar**: `"2 sessions — Completed"` or `"Free-form — In Progress"` depending on session sources

The session rendering (exercise list, set grid with planned/actual, View Session link, recovery badge, RIR badge) stays identical inside this dialog.

## SessionCalendar Component Design

### `SessionCalendar.svelte` (Root)

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
let currentYear = $state(new Date().getFullYear());
let currentMonth = $state(new Date().getMonth()); // 0-based
let selectedDay: SessionCalendarDayCell | null = $state(null);
let dialogOpen = $state(false);
```

**Layout:**

```svelte
<div class="w-full max-w-md mx-auto p-1">
  <SessionCalendarHeader
    {currentYear}
    {currentMonth}
    onMonthChange={(year, month) => { currentYear = year; currentMonth = month; }}
  />
  <CalendarDayHeaders />
  {#each monthGrid.weekRows as row}
    <div class="grid grid-cols-7 gap-1 mt-1">
      {#each row as day}
        <CalendarDayCell
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

<CalendarDayDetailDialog ... />
```

### `SessionCalendarHeader.svelte`

A compact header with left arrow, month/year display (that doubles as a picker), and right arrow.

```svelte
<div class="flex items-center justify-between px-2 pb-2">
  <Button variant="ghost" size="icon" onclick={goToPreviousMonth}>
    <IconChevronLeft />
  </Button>

  <Popover>
    <PopoverTrigger>
      <Button variant="ghost" class="text-sm font-medium">
        {monthYearLabel}
        <IconChevronDown class="size-4 ml-1" />
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <!-- Month grid (Jan–Dec) + year stepper -->
      <div class="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" onclick={decrementYear}>
          <IconChevronLeft />
        </Button>
        <span class="text-sm font-medium">{pickerYear}</span>
        <Button variant="ghost" size="icon" onclick={incrementYear}>
          <IconChevronRight />
        </Button>
      </div>
      <div class="grid grid-cols-3 gap-1">
        {#each months as month, i}
          <Button
            variant={isSelected(i) ? 'default' : 'ghost'}
            size="sm"
            onclick={() => selectMonth(i)}
          >
            {month}
          </Button>
        {/each}
      </div>
    </PopoverContent>
  </Popover>

  <Button variant="ghost" size="icon" onclick={goToNextMonth}>
    <IconChevronRight />
  </Button>
</div>
```

This uses the existing shadcn `Popover`, `PopoverTrigger`, `PopoverContent`, and `Button` components. The picker shows a 3x4 grid of month abbreviations with year stepping — clean, mobile-friendly, and avoids pulling in a full date-picker dependency.

### `sessionCalendarUtils.ts`

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

type SessionCalendarMonthGrid = {
  weekRows: SessionCalendarDayCell[][];
};
```

Logic:
1. Compute first day of month and last day of month.
2. Compute leading padding days (from previous month, to fill the first week row starting on Sunday).
3. Compute trailing padding days (to fill the last week row).
4. For each day in the range, look up sessions whose `startTime` falls on that date.
5. Build `CalendarSession` objects with nested exercises/sets (reuse the same lookup-map pattern from `mesocycleCalendarUtils`).
6. Mark `isToday` and `isOutsideMonth` flags.
7. Group into rows of 7.

The date-helper functions (`isNewMonth`, `formatMonthLabel`, `addDays`) currently in `mesocycleCalendarUtils.ts` should be extracted into a shared `Calendar/shared/calendarUtils.ts` and imported by both utils files.

## Implementation Tasks

### Task 1: Create shared infrastructure

1. Create `src/components/Calendar/shared/calendarTypes.ts` with `CalendarSet`, `CalendarExercise`, `CalendarSession`, `CalendarDayCell`.
2. Create `src/components/Calendar/shared/calendarUtils.ts` with extracted date helpers (`addDays`, `isNewMonth`, `formatMonthLabel`, `normalizedDateKey`).
3. Move `MesocycleCalendarDayHeaders.svelte` to `src/components/Calendar/shared/CalendarDayHeaders.svelte`.

### Task 2: Extract shared `CalendarDayCell`

1. Create `src/components/Calendar/shared/CalendarDayCell.svelte` with the generalized props (`dateLabel`, `sessions`, `visual`, `isClickable`, `onDayClick`, `accentLeft`).
2. Add the `'today'` and `'outside-month'` visual variants to `dayCellVariants`.
3. Keep the session indicator rendering (dots/checkmarks) identical.

### Task 3: Extract shared `CalendarDayDetailDialog`

1. Create `src/components/Calendar/shared/CalendarDayDetailDialog.svelte` with parameterized `formattedDate`, `description`, `sessions`, and `open`.
2. The exercise/set rendering block moves in verbatim.

### Task 4: Update MesocycleCalendar to use shared components

1. Update `mesocycleCalendarTypes.ts`: import shared types, extend `CalendarDayCell` for `MesocycleCalendarDayCell`, keep `MesocycleCalendarLabelEntry`, `MesocycleCalendarWeekRow`, `MesocycleCalendarData`.
2. Update `mesocycleCalendarUtils.ts`: import date helpers from shared utils, import shared types.
3. Move all MesocycleCalendar files from `src/components/MesocycleCalendar/` to `src/components/Calendar/MesocycleCalendar/`.
4. Update `MesocycleCalendar.svelte`: import `CalendarDayHeaders` and `CalendarDayDetailDialog` from `../shared/`, compute the `description` prop for the dialog.
5. Update `MesocycleCalendarDayCell.svelte` → replace with a wrapper that imports shared `CalendarDayCell`, computes the `visual` and `accentLeft` props, and delegates rendering.
6. Update all imports across the codebase that reference the old `MesocycleCalendar` path.
5. Run `pnpm check`, `pnpm lint --fix`, `pnpm test` — fix any breakage.

### Task 5: Build `SessionCalendar` components

1. Create `sessionCalendarTypes.ts` with `SessionCalendarDayCell` and `SessionCalendarMonthGrid`.
2. Create `sessionCalendarUtils.ts` with `buildMonthGrid`.
3. Create `SessionCalendarHeader.svelte` with month/year picker and arrows.
4. Create `SessionCalendar.svelte` root component.
5. Write `sessionCalendarUtils.test.ts` covering:
   - Empty month (no sessions)
   - Month with sessions from different sources
   - Leading/trailing padding days marked as `isOutsideMonth`
   - `isToday` flag accuracy
   - Sessions correctly matched to dates

### Task 6: Storybook stories

1. Create `SBSessionCalendarExample.svelte` with mock data (mix of mesocycle and free-form sessions across a month).
2. Create `SessionCalendar.stories.svelte` with variations:
   - Default (current month, some sessions)
   - Empty month
   - Month with all completed sessions
   - Month with mixed sources (mesocycle + free-form)

### Task 7: Lint, check, test

1. Run `pnpm lint --fix`, `pnpm check`, `pnpm test`.
2. Verify MesocycleCalendar Storybook stories still render correctly.
3. Verify SessionCalendar Storybook stories render correctly.

## Notes

- The `MesocycleCalendarLabelRow` component stays in the MesocycleCalendar folder because cycle/month labels above rows are a mesocycle-only concept. The SessionCalendar does not need label rows — month context is provided by the header.
- The `rest` day type is mesocycle-only. SessionCalendar only has `session` and `empty` day types.
- The `'session-next'` visual variant is mesocycle-only (highlights the next incomplete session in the mesocycle sequence). SessionCalendar uses `'today'` instead for the primary highlight.
- Outside-month days are shown but dimmed (`opacity-30`) and not clickable. This provides calendar context without clutter.
- The `SessionCalendar` does not load data itself — it receives props. The parent page/route is responsible for providing the session/exercise/set data. This keeps the component pure and testable.
- Where `SessionCalendar` is mounted (Sessions page, new route, etc.) is out of scope for this plan.
