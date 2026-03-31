# Plan: Reschedule Mesocycle to New Start Date

## Context

Users need to proactively shift a mesocycle's entire schedule — all microcycles and sessions — to a different start date without creating date overlaps with other mesocycles. The reactive version of this already exists (the late-session dialog on the home page), but there is no way to do it manually from the mesocycle detail page. The core shifting logic (`moveMesocycle`, `shiftMesocycleDates`) is already in place; this feature is purely a UI addition.

**User answers to clarifying questions:**

- Both **active and future** mesocycles can be rescheduled (no restriction on direction — forward or backward — as long as there's no overlap with another mesocycle, including completed ones)
- For an active mesocycle, **all sessions** (including already-completed ones) shift by the same delta
- Invalid (overlapping) dates are **grayed out in the calendar picker**, not shown as a post-selection error
- Entry point: **"Reschedule" in the Options dropdown** on the MesocyclePage

---

## Files to Create

### 1. `src/components/singletons/dialogs/SingletonRescheduleMesocycleDialog/SingletonRescheduleMesocycleDialog.svelte`

Singleton dialog (module-level state, imperative `.open()` API) following the pattern of `SingletonMoveSessionsDialog` and `SingletonDeloadDialog`.

**Module-level state & export:**

```typescript
type RescheduleMesocycleDialogParams = {
  currentStartDate: Date;
  mesocycleDurationDays: number;
  isDateDisabled: (date: DateValue) => boolean;
  onReschedule: (newStartDate: Date) => void;
};

export const rescheduleMesocycleDialog = {
  open: (params: RescheduleMesocycleDialogParams) => { ... }
};
```

**UI inside the AlertDialog:**

- Shows current start date and projected end date (currentStartDate + mesocycleDurationDays)
- Calendar (from `$ui/Calendar/Calendar.svelte`) with `isDateDisabled` prop, inside a Popover (same pattern as `MesocycleConfigCard`)
- When user picks a date, shows the new projected end date
- "Reschedule" button (disabled until a different date is selected) calls `params.onReschedule(selectedDate)` then closes
- Cancel button

### 2. `src/components/singletons/dialogs/SingletonRescheduleMesocycleDialog/SBSingletonRescheduleMesocycleDialogExample.svelte`

Storybook wrapper that renders test buttons to open the dialog with configurable scenarios (no overlap, overlap on one side, etc.).

### 3. `src/components/singletons/dialogs/SingletonRescheduleMesocycleDialog/SingletonRescheduleMesocycleDialog.stories.svelte`

Storybook story file (`title: 'Singletons/RescheduleMesocycleDialog'`).

---

## Files to Modify

### 4. `src/pages/MesocyclePage/mesocyclePageUtils.ts`

Add two utility functions:

**`getMesocycleDurationDays(mesocycle, microcycles)`**

- If microcycles are provided: `DateService.getCalendarDaysBetween(firstMicro.startDate, lastMicro.endDate)` (strips time-of-day, DST-safe)
- Fallback: `mesocycle.plannedMicrocycleCount * mesocycle.plannedMicrocycleLengthInDays`

**`getRescheduleDisabledDateMatcher(mesocycleId, durationDays, allMesocycles, getMicrocyclesForMesocycle)`**

- Returns `(date: Date) => boolean`
- For each other mesocycle (skip self, include completed), get projected start/end via `WorkoutMesocycleService.getProjectedStartDate/EndDate()`
- Computes the candidate end date as `DateService.addDays(date, durationDays)`
- Returns `true` if placing the mesocycle at `date` would overlap: `date < mEnd && candidateEnd > mStart`
- Pattern mirrors `disabledDateMatcher` in `MesocycleConfigCard.svelte:117`

### 5. `src/pages/MesocyclePage/MesocyclePageActions.svelte`

**Imports to add:**

- `rescheduleMesocycleDialog` from the new singleton
- `microcycleMapService` from `$services/documentMapServices/microcycleMapService.svelte`
- `getMesocycleDurationDays`, `getRescheduleDisabledDateMatcher` from `./mesocyclePageUtils`
- `WorkoutMesocycleService` from `@aneuhold/core-ts-db-lib`
- `DateService` from `@aneuhold/core-ts-lib`
- `getLocalTimeZone`, `type DateValue` from `@internationalized/date`

**Add `handleReschedule()` function:**

```typescript
function handleReschedule() {
  const microcycles = microcycleMapService.getOrderedMicrocyclesForMesocycle(mesocycle._id);
  const currentStart = WorkoutMesocycleService.getProjectedStartDate(mesocycle, microcycles);
  if (!currentStart) return;

  const durationDays = getMesocycleDurationDays(mesocycle, microcycles);
  const tz = getLocalTimeZone();
  const disabledMatcher = getRescheduleDisabledDateMatcher(
    mesocycle._id,
    durationDays,
    mesocycleMapService.allDocs,
    (id) => microcycleMapService.getOrderedMicrocyclesForMesocycle(id)
  );

  rescheduleMesocycleDialog.open({
    currentStartDate: currentStart,
    mesocycleDurationDays: durationDays,
    isDateDisabled: (dateValue: DateValue) => disabledMatcher(dateValue.toDate(tz)),
    onReschedule: (newStartDate: Date) => {
      // DateService.getCalendarDaysBetween strips time-of-day so DST shifts don't cause off-by-one errors
      const delta = DateService.getCalendarDaysBetween(currentStart, newStartDate);
      mesocycleMapService.moveMesocycle(mesocycle._id, delta, false);
    }
  });
}
```

**Add dropdown item** (visible for both `isActive` and `isFuture`):

```svelte
{#if isActive || isFuture}
  <DropdownMenuItem onclick={handleReschedule}>
    <IconCalendarEvent size={16} />
    Reschedule
  </DropdownMenuItem>
{/if}
```

### 6. `src/routes/+layout.svelte`

Register the new singleton: import and mount `<SingletonRescheduleMesocycleDialog />` alongside other singletons (lines 16–19 for import, lines 91–95 for mount).

### 7. `src/components/singletons/SBAllSingletonsDecorator.svelte`

Register the new singleton for Storybook: import and mount `<SingletonRescheduleMesocycleDialog />`.

---

## Key Reused Functions (no changes needed)

| Function                                                   | File                                                                 | Purpose                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| `mesocycleMapService.moveMesocycle(id, delta, false)`      | `src/services/documentMapServices/mesocycleMapService.svelte.ts:413` | Shifts all mesocycle/microcycle/session dates and persists |
| `WorkoutMesocycleService.getProjectedStartDate()`          | `ts-libs/.../WorkoutMesocycleService.ts:~230`                        | Gets effective start date (startDate or first microcycle)  |
| `WorkoutMesocycleService.getProjectedEndDate()`            | `ts-libs/.../WorkoutMesocycleService.ts:~245`                        | Gets effective end date                                    |
| `microcycleMapService.getOrderedMicrocyclesForMesocycle()` | `src/services/documentMapServices/microcycleMapService.svelte.ts`    | Gets sorted microcycles for a mesocycle                    |
| `disabledDateMatcher` pattern                              | `src/pages/MesocyclePage/MesocycleConfigCard.svelte:117`             | Reference for date-picker disabled logic                   |
| Calendar + Popover pattern                                 | `src/pages/MesocyclePage/MesocycleConfigCard.svelte:230–248`         | Reference for calendar-in-popover date picker              |

---

## No ts-libs Changes Required

All necessary logic (`shiftMesocycleDates`, `getProjectedStartDate`, `getProjectedEndDate`, `moveMesocycle`) already exists.

---

## Verification

1. `pnpm lint --fix` — fix any lint issues
2. `pnpm check` — TypeScript + circular dependency check
3. `pnpm test` — Vitest (no new tests required; this is UI-only)
4. Manual test:
   - Open a **future** mesocycle → Options → Reschedule → calendar opens → dates inside other mesocycles are grayed out → pick a valid date → mesocycle shifts correctly
   - Open an **active** mesocycle → same flow → all sessions (including completed) shift by the delta
   - Verify a date that would push into a subsequent mesocycle is grayed out
   - Verify Storybook story renders and the dialog opens correctly
