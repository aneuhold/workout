# Free-Form Workouts: Research

See the chunk files (`free-form-chunk-*.md`) for the remaining implementation work
broken into sequential tasks.

## Overview

Free-form workouts allow users to track ad-hoc workout sessions without creating a
mesocycle or following a structured plan. The user picks exercises, adds sets, logs
reps/weight, and completes the session — all without volume planning, progression
algorithms, or microcycle scheduling.

## What Has Been Implemented

The core free-form workout flow is fully functional:

- **Session creation:** `sessionMapService.createFreeFormSession()` creates immediate
  free-form sessions with auto-generated titles and navigates to the session page.
- **Exercise picker dialog:** Full search/filter/ordered-multi-select in
  `SingletonExercisePickerDialog`. Excludes already-added exercises.
- **Add/Remove exercises:** `sessionMapService.addExercisesToSession()` and
  `removeExerciseFromSession()` with confirmation dialog.
- **Add/Remove sets:** `sessionExerciseMapService.addSetToExercise()` and
  `removeSetFromExercise()`.
- **Done/Edit pattern:** Free-form exercise cards in Active mode have a card-level
  "Done" button. After tapping, the card collapses and shows "Edit" to re-expand.
  State auto-initializes from persisted data on page load.
- **Session completion:** "Complete Session" requires all exercises Done + at least 1
  exercise. Free-form sessions skip review and redirect to home.
- **Home page:** `HomePageHeroCardFreeFormSession` shows in-progress free-form
  sessions. `HomePageEmptyState` offers "Start Free-Form Workout" alongside mesocycle
  creation. Recent sessions include free-form via `sessionMapService.allDocs`.
- **Sessions page:** `SessionsPageFreeFormSection` shows in-progress and completed
  free-form sessions with a "New Workout" button.
- **NavBar:** Smart redirect includes free-form in-progress sessions.
- **Onboarding:** Updated text acknowledges free-form as an option.
- **Deload path:** Free-form exercises auto-trigger the deload path (no `plannedRir`),
  hiding RSM/Fatigue/Soreness fields, bypassing review, and hiding the instruction
  text.

## Remaining Infrastructure Notes

### Existing Support for Planning Mode

- `WorkoutSession.workoutMicrocycleId` is nullable — planned free-form sessions
  work the same way as immediate ones at the data layer.
- `SessionPageSetRow` derives display values via `actual ?? planned ?? undefined`.
  In Planning mode, writing to `plannedReps`/`plannedWeight` would display correctly.
  In Active mode for a previously planned session, actual values take priority and
  planned values show as targets.
- `SessionPageMode` enum currently has: `Active`, `Review`, `View`, `Locked`. A new
  `Planning` value is needed.
- Use `svelte-dnd-action` for the exercise reorder dialog (install via
  `pnpm add svelte-dnd-action`). It supports Svelte 5, touch/mobile, keyboard
  accessibility, and uses a `use:dndzone` action that composes cleanly with any
  markup. ~8.5 KB gzipped, zero dependencies.
- `enabledPages` store already enables all pages unconditionally — no changes needed.

### Simplified Data Model Recap

Free-form sessions skip all planning and review metrics. Sets only track `actualReps`,
`actualWeight`, and `exerciseProperties`. The deload path handles this automatically.

| Field | Structured Session | Free-Form Session |
|-------|-------------------|-------------------|
| `actualReps` | Yes | Yes |
| `actualWeight` | Yes | Yes |
| `plannedReps` | Yes (auto-generated) | Only if pre-planned |
| `plannedWeight` | Yes (auto-generated) | Only if pre-planned |
| `rir` / `plannedRir` | Yes (drives progression) | No (never set) |
| Session RSM sliders | Yes (drives MEV estimation) | No |
| Session Fatigue sliders | Yes (drives SFR) | No |
| Exercise soreness score | Yes (drives set additions) | No |
| Exercise performance score | Yes (drives MRV + set additions) | No |
| `exerciseProperties` on sets | Yes | Yes |

## Out of Scope

- Session templates / favorites
- Free-form sessions feeding into SFR-based analytics
