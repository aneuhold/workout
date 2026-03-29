# Free-Form Workouts: Research

See [free-form-workouts-plan.md](./free-form-workouts-plan.md) for the implementation
plan based on these findings.

## Overview

Free-form workouts allow users to track ad-hoc workout sessions without creating a
mesocycle or following a structured plan. The user picks exercises, adds sets, logs
reps/weight, and completes the session — all without volume planning, progression
algorithms, or microcycle scheduling.

## Existing Infrastructure

A significant amount of the groundwork is already in place across the stack.

### Core Library (`core-ts-db-lib`)

- **`WorkoutSession.workoutMicrocycleId`** is already nullable (`.nullish()`). The
  schema docstring explicitly states: _"A session can be part of a microcycle or can
  be tracked independently for free-form workout tracking."_
- **`WorkoutMicrocycle.workoutMesocycleId`** is also nullable, enabling standalone
  microcycles. However, free-form sessions likely won't need microcycles at all.
- **`CycleType.FreeForm`** enum value exists on `WorkoutMesocycle`. When set, the
  mesocycle service returns early with no auto-generated plans. This is documented as
  an "escape hatch" for when a structured mesocycle goes wrong — not as the primary
  mechanism for free-form tracking.
- **`WorkoutSessionService.getSessionLockReason()`** already handles free-form
  correctly: if `microcycle` or `mesocycle` is null/undefined, it returns `null`
  (unlocked). Free-form sessions are immediately accessible.
- **No new document types needed.** `WorkoutSession`, `WorkoutSessionExercise`,
  `WorkoutSet`, and `WorkoutExercise` all work as-is. Sessions just have a null
  `workoutMicrocycleId`.

### Backend (`gcloud-backend`)

- The `WorkoutService` accepts generic CRUD operations (insert/update/delete/get)
  for all workout document types. It doesn't enforce mesocycle membership.
- No backend changes should be required. Creating a session with
  `workoutMicrocycleId: null` and its associated session-exercises and sets will work
  through the existing API.
- The `WorkoutRetrievalService` supports date-range filtering on sessions, which
  will be useful for listing free-form sessions by date.

### Frontend (Workout App)

- **`SessionPage`** derives `microcycle` and `mesocycle` from the session and handles
  undefined values. The lock-reason derivation passes nullable parents to the core
  library, which returns unlocked for free-form sessions. The page should largely
  work as-is.
- **`SessionPageExerciseCard`** and **`SessionPageSetRow`** are generic — they
  operate on session exercises and sets without caring about mesocycle context.
- **`WorkoutAPIService`** batches operations across document types in a single API
  call. Creating a free-form session with its exercises and sets can use the same
  `prepareDocsForSave` → `queryApi` pattern.
- **`SessionCard`** component displays session status, progress, and exercise counts
  without mesocycle assumptions.

## Simplified Data Model for Free-Form Sessions

Free-form sessions don't participate in any calculation pipeline. The entire metrics
system (RSM, Fatigue, SFR, soreness, performance, deload recommendations, volume
planning, progression) starts from a MongoDB aggregation that hard-filters on
completed mesocycles and joins down through microcycles → sessions. Sessions with
`workoutMicrocycleId: null` are excluded at every level.

This means free-form sessions should **skip all planning and review metrics**:

| Field | Structured Session | Free-Form Session |
|-------|-------------------|-------------------|
| `actualReps` | Yes | Yes |
| `actualWeight` | Yes | Yes |
| `plannedReps` | Yes (auto-generated) | No (not applicable) |
| `plannedWeight` | Yes (auto-generated) | No (not applicable) |
| `rir` / `plannedRir` | Yes (drives progression) | No (never consumed) |
| Session RSM sliders | Yes (drives MEV estimation) | No (never consumed) |
| Session Fatigue sliders | Yes (drives SFR) | No (never consumed) |
| Exercise soreness score | Yes (drives set additions) | No (never consumed) |
| Exercise performance score | Yes (drives MRV + set additions) | No (never consumed) |
| `exerciseProperties` on sets | Yes (copied from exercise) | Yes (still useful for user, e.g. grip width) |

### Existing Deload Path Handles Most of This for Free

The existing `isDeloadExercise()` check in `WorkoutSessionExerciseService` returns
`true` when ALL sets have `plannedRir == null`. Since free-form sets won't have any
planned values, this condition is met automatically. The deload path already:

- **Hides the entire RSM/Fatigue/Soreness section** — `SessionPageExerciseCard` wraps
  all metric fields in `{#if !isDeload}` (line ~424).
- **Bypasses immediate slider requirements** — `hasMidSessionMetricsFilled()` returns
  `true` for deload exercises, so `allImmediateSlidersFilled` is satisfied.
- **Bypasses late field requirements** — `hasAllSessionMetricsFilled()` returns `true`
  for deload exercises, so the session never enters Review mode.
- **Hides the target row** — `hasTargets` is `false` when all planned values are null
  (line ~100 in `SessionPageSetRow`).
- **RIR column shows em-dash** — explicit check for `plannedRir == null` (line ~146).

This means **the session page already works for free-form sessions** with minimal
changes. The session goes Active → View without requiring any metrics.

**Remaining minor adjustments:**
- The "Hit target reps first, then keep going until you reach target RIR" instruction
  text (`SessionPageExerciseCard` line ~363) still shows and should be hidden for
  free-form.
- Planned value em-dash placeholders in set rows still render (minor visual noise).
- `SessionPageSummaryCard` text "Fill in all RSM and Fatigue fields to complete the
  session" should not appear for free-form (but likely won't since the deload path
  satisfies those checks).

### Empty States and Informational Text

Several places in the app show text that assumes structured mesocycle usage. These
need updating to reflect that free-form sessions are now an option, while still
encouraging mesocycle usage as the primary path.

| Location | Current Text | Issue |
|----------|-------------|-------|
| `HomePageEmptyState` | "No active mesocycle" / "Create a mesocycle to start planning sessions." | Implies mesocycle is the only way to use the app |
| `SessionsPageEmptyState` | "No active mesocycle" / "Create a mesocycle to start planning sessions." | Same |
| `MesocyclesPageEmptyState` | "No mesocycles yet" / "Tap New to create your first training plan." | Fine as-is (this page is mesocycle-specific) |
| `OnboardingEmptyState` (0 calibrations) | "Set up 3-4 exercises with calibrations..." | Implies calibrations are required to use the app at all |
| `OnboardingEmptyState` (1-3 calibrations) | "Add a few more to get the best results from your mesocycle." | Same |
| `SessionPageExerciseCard` line ~363 | "Hit target reps first, then keep going until you reach target RIR." | Not applicable to free-form (no targets, no RIR) |
| `SessionPageSummaryCard` line ~53 | "Fill in all RSM and Fatigue fields to complete the session." | Not applicable to free-form (deload path bypasses) |
| `ExercisePageEditForm` line ~226 | "Rep range affects how sets are planned across your mesocycle." | Still true — only shown on exercise edit page, not session page |

This significantly simplifies both the UI and the implementation — free-form sessions
are essentially a lightweight logging tool.

## Current Frontend Gaps

The gaps below are what drive the implementation plan.

### Tightly Coupled to Mesocycles

- **Home page:** All sections (`HomePageHeroCard`, `HomePageWeekSessions`,
  `HomePagePendingLogs`, `HomePageRecentSessions`) query
  `mesocycleMapService.categorizedMesocycles.active`. Empty state without one.
- **Sessions page:** Shows sessions grouped by microcycle within the active mesocycle.
  No sessions visible without an active mesocycle.
- **Session creation:** Only happens via mesocycle generation
  (`generateMesocycleChildren`). No standalone session creation UI.
- **NavBar smart redirect:** Only checks mesocycle-linked in-progress sessions.

### No In-Session Exercise/Set Management

- No way to add exercises to an existing session.
- No way to add sets to an existing exercise within a session.
- Exercises and sets are only generated during mesocycle creation.

### What Already Works for Free-Form

- **Session page itself:** Derives microcycle/mesocycle from session, handles
  undefined gracefully. Lock logic returns unlocked for null parents.
- **`SessionPageExerciseCard` / `SessionPageSetRow`:** Generic — operate on
  exercises and sets without mesocycle assumptions.
- **`WorkoutAPIService`:** Flexible batched CRUD, works for any document combo.
- **`SessionCard`:** Displays session info without mesocycle context.
- **`SingletonEditSetDialog`:** Works on any set.
- **Exercise/equipment management:** Fully independent of session type.
- **Rest timer:** Session-agnostic.
