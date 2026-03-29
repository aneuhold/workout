# Free-Form Workouts: Implementation Plan

See [free-form-workouts.md](./free-form-workouts.md) for the research behind these
decisions.

## Design Decisions

- **Session titles:** Auto-generate from date (e.g. "March 29 Workout"). The user
  can rename via a menu option on the session page.
- **Exercise reordering:** Supported via a "Reorder Exercises" menu option (e.g. in
  a top-right overflow menu on the session page) that opens a dialog with a
  drag-and-drop list. The `sessionExerciseOrder` array already supports this — just
  need the UI.
- **Templates:** Out of scope for this iteration.
- **Mixed mode:** Free-form and structured sessions coexist. Both appear on the home
  page and sessions page when applicable.
- **Metrics:** Free-form sessions skip all review metrics (RSM, Fatigue, soreness,
  performance, RIR). Sets only track reps, weight, and exercise custom properties.
  No Review mode — sessions go directly from Active to complete. This is handled
  almost entirely by the existing deload code path (see research doc).
- **Home page prominence:** When a mesocycle is active, the free-form option should
  be visually secondary / out-of-the-way so it doesn't compete with the mesocycle
  flow. When no mesocycle is active, it can be more prominent.
- **Session start:** A free-form session starts empty — no exercises. The user builds
  it as they go by adding exercises one at a time.
- **Default sets:** When an exercise is added to a free-form session, it starts with
  1 empty set. The user adds more via "Add Set" or removes sets as needed.
- **Exercise completion (Active mode):** Free-form exercise cards use a "Done" button
  (full-width, at the bottom of the card) instead of the per-set "Log" confirmation
  pattern. This prevents premature collapse/greying when the user might want to add
  more sets. After tapping "Done", the card collapses and the button changes to
  "Edit" so the user can re-expand if they tapped too early. "Done" is disabled if
  any set is missing reps or weight. Add Set, Remove Set, and Remove Exercise are
  only accessible while the card is expanded (before tapping Done, or after tapping
  Edit).
- **Exercise completion (Planning mode):** No Done/Edit pattern in Planning mode.
  All exercise cards stay expanded and editable. The user enters planned values
  freely and saves the whole session at once.
- **Session completion:** "Complete Session" requires all exercises to be in the
  "Done" state and at least 1 exercise to exist.
- **Planning mode detection:** Uses a query parameter (`?planning=true`) or
  in-memory flag to indicate the session page is in Planning mode. The mode cannot
  be reliably auto-detected from the data alone.
- **Planned session persistence:** A planned session is not persisted to the server
  until the user confirms by tapping "Save Planned Session" at the bottom of the
  page. This avoids invalid sessions with no exercises floating in the database.

## Implementation Steps

### 1. Exercise Picker Dialog

Build an exercise picker dialog for adding exercises to a free-form session.

- Source data from `exerciseMapService` (all user exercises, not just calibrated).
- Show exercise name, equipment type, and muscle groups for each option.
- Support selecting an ordered list of exercises (user taps to add, list shows
  selection order).
- Return ordered exercise IDs on confirm.
- Use `Dialog` component (not Sheet — Sheet is marked WIP in the codebase).

**Note on reuse with mesocycle exercise selection:** The mesocycle picker
(`MesocycleExercisesCard`) is an unordered multi-select of calibrated exercises
using Switch toggles — a different interaction pattern. The reusable piece between
the two is the **exercise search/filter/display** (exercise name, equipment badge,
muscle group badges, search bar). Consider extracting that into a shared component
that both pickers compose, rather than one picker trying to serve both needs.

### 2. Free-Form Session Creation — Immediate ("Start")

- Available from `HomePageHeroCard`:
  - **No active mesocycle:** Prominent option alongside the mesocycle creation prompt.
  - **Active mesocycle:** Secondary/subtle option below the primary mesocycle action.
- On tap:
  1. Create a `WorkoutSession` with `workoutMicrocycleId: null`, title auto-generated
     from the current date (e.g. "March 29 Workout"), `startTime: now`, and an empty
     `sessionExerciseOrder`.
  2. Persist via `WorkoutAPIService.queryApi()`.
  3. Navigate to `/session?sessionId={newSessionId}`.
- The session page opens in **Active mode** with no exercises — just the "Add
  Exercise" button.

### 3. Free-Form Session Creation — Planned ("Plan")

- Available from the Sessions page and Mesocycles page (see steps 11 and 12).
- On tap:
  1. Show a date picker (same Calendar + Popover pattern used on the mesocycle
     creation page in `MesocycleConfigCard`).
  2. Navigate to `/session/plan` (a new route) or
     `/session?planning=true` — the session page in Planning mode.
  3. The session is **not yet persisted**. All state lives in-memory until the user
     saves.

### 4. Session Page — Planning Mode

A new `Planning` mode for `SessionPageMode`.

**Mode detection:**
- Driven by a query parameter (e.g. `?planning=true`) or the route (e.g.
  `/session/plan`). Not auto-detected from data.
- An existing planned session can be re-opened for editing — navigating to it with
  the planning flag enters Planning mode with the saved data pre-loaded.

**What Planning mode looks like:**
- Same free-form UI for Add Exercise, Add Set, Remove Set, Remove Exercise, and
  exercise reordering.
- **No Done/Edit pattern** — all exercise cards stay expanded and editable. The user
  enters planned values freely across all exercises.
- **No per-set "Log" confirmation dialog** — inputs are inline and write directly
  to `plannedReps` / `plannedWeight`. No sequential Current/Future gating.
- **"Save Planned Session" button** at the bottom of the page. Enabled when at
  least 1 exercise exists with at least 1 set that has `plannedReps` and
  `plannedWeight` filled.
- On save:
  1. Create the `WorkoutSession` with `workoutMicrocycleId: null`, title
     auto-generated from the selected date, and `startTime: selectedDate`.
  2. Create all `WorkoutSessionExercise` and `WorkoutSet` documents with the
     planned values.
  3. Batch persist via `WorkoutAPIService.queryApi()`.
  4. Navigate to the sessions page or home page.

**Refactoring `SessionPageSetRow`:**
- Currently, editable inputs always write to `actualReps` / `actualWeight` / `rir`.
- Refactor to accept a parameter (or derive from mode) that determines the target
  fields. In Planning mode, inputs write to `plannedReps` / `plannedWeight`.
  `plannedRir` is never set for free-form (keeps the deload path working).
- The derived values (lines 39-41) already use `actual ?? planned ?? undefined`,
  so in Planning mode the planned values will show in the inputs. In Active mode,
  actual values take priority and planned values show as targets.

**Refactoring `SessionPageExerciseCard`:**
- In Planning mode, disable the Done/Edit pattern entirely. Cards stay expanded.
- The set state logic (`getSetState`) can be simplified in Planning mode — all sets
  are editable (no Current/Future gating).

### 5. "Add Exercise" on Session Page

- "Add Exercise" button at the bottom of the exercise list on `SessionPage`.
  Visible for free-form sessions (both Active and Planning modes).
- Opens the exercise picker dialog from step 1.
- For each selected exercise (in order), creates a `WorkoutSessionExercise` + 1
  empty `WorkoutSet`, appends to `session.sessionExerciseOrder`.
  - In Active mode: persists immediately.
  - In Planning mode: held in-memory until "Save Planned Session".
- The newly added exercise card auto-expands.

### 6. "Add Set" and "Remove Set" on Session Page

**Add Set:**
- Button at the bottom of the set table inside `SessionPageExerciseCard`.
- Creates a new empty `WorkoutSet`, appends to `sessionExercise.setOrder`.
- Visible for free-form sessions (both Active and Planning modes), only while the
  card is expanded (in Active mode: not in Done state).

**Remove Set:**
- Per-row delete affordance on each set row (e.g. small icon button).
- Deletes the `WorkoutSet` document, removes its ID from
  `sessionExercise.setOrder`.
- Disabled if only 1 set remains on the exercise.
- Visible for free-form sessions (both Active and Planning modes), only while the
  card is expanded.

### 7. "Remove Exercise" on Session Page

- Affordance on each exercise card (e.g. in the card header or an overflow menu).
- Deletes the `WorkoutSessionExercise` and all its `WorkoutSet` documents, removes
  from `session.sessionExerciseOrder`.
- Visible for free-form sessions (both Active and Planning modes), only while the
  card is expanded (in Active mode: not in Done state).
- Should confirm before deleting (small confirmation dialog or similar).

### 8. Free-Form Exercise Card — "Done" / "Edit" Pattern (Active Mode Only)

This is the key UX difference from structured sessions. In structured sessions,
per-set "Log" confirmations drive exercise completion. In free-form Active mode,
the user has explicit control via a card-level "Done" button.

**Behavior:**
- Free-form exercise cards show a **"Done" button** at the bottom of the card
  content (full-width of the card).
- Set rows use the existing sequential Current/Completed/Future gating (same as
  structured). The user fills in the current set's reps/weight, taps "Log" to
  confirm, and the next set becomes current. The difference from structured is:
  no RIR field, no planned targets (unless the session was previously planned), and
  the user can add/remove sets at any time.
- **"Done" is disabled** if any set has not been logged (missing `actualReps` or
  `actualWeight`).
- Tapping "Done":
  - Collapses the card.
  - The card header shows a green checkmark (same as structured completed state).
  - Add Set, Remove Set, Remove Exercise are no longer accessible.
- The "Edit" button goes exactly where the Done button was (full-width, bottom of
  the card content). It is only visible when the card is re-expanded by tapping the
  header. Tapping "Edit" reverts to the "Done" button state, makes sets editable
  again, and re-enables Add Set / Remove Set / Remove Exercise.

**State management:**
- "Done" state is tracked per-exercise in local component state (not persisted).
  The real completion signal for the session is the "Complete Session" button.
- On page load/refresh, an exercise is considered "done" if all of its sets are
  logged (all have `actualReps` and `actualWeight`). This provides a reasonable
  default without requiring persistence.

**What to hide in free-form exercise cards:**
- No "Hit target reps first, then keep going until you reach target RIR" instruction
  text.
- RSM/Fatigue/Soreness fields already hidden by the existing deload path.

### 9. Session Page — Other Free-Form Adjustments

The existing deload code path handles most UI simplification (see research doc).
Since free-form sets have `plannedRir: null`, `isDeloadExercise()` returns `true`,
which hides RSM/Fatigue/Soreness, bypasses review requirements, and hides target
rows (unless the session was previously planned, in which case the target row
correctly appears because `plannedReps`/`plannedWeight` are set).

**Remaining changes:**
- Add a **session overflow menu** (top-right) with options:
  - "Rename Session" — opens a small dialog for the title.
  - "Reorder Exercises" — opens the reorder dialog (step 10).
- Verify that the `SessionPageSummaryCard` "Fill in all RSM and Fatigue fields"
  helper text doesn't appear (the deload path should prevent this, but confirm).
- Hide or adapt microcycle progress indicators (sibling session references,
  microcycle completion status) when `session.workoutMicrocycleId` is null.
- **"Complete Session" button (Active mode):** Enabled only when all exercises are
  in the "Done" state and at least 1 exercise exists.

### 10. Exercise Reorder Dialog

- Triggered from the session overflow menu: "Reorder Exercises".
- Opens a dialog with a drag-and-drop list of the session's exercises.
- On confirm, updates `session.sessionExerciseOrder` and persists.
- Visible for free-form sessions (both Active and Planning modes).

### 11. Sessions Page Updates

- Add a **"Free-Form Sessions"** section (below the structured microcycle groups).
- Query `sessionMapService` for sessions where `workoutMicrocycleId` is null.
- Subsections or sorting:
  - **Planned:** Sessions where `complete === false` and no actual values logged,
    sorted by `startTime` ascending (nearest first).
  - **In Progress / Recent:** Other free-form sessions, sorted by `startTime`
    descending.
- Reuse `SessionCard` for display. `SessionCard` needs a new status (e.g.
  "Planned") for scheduled sessions that haven't been started.
- Add a **"Plan Free-Form Workout"** button in this section (opens the scheduling
  flow from step 3).

### 12. Mesocycles Page Updates

- Add a **"Plan Free-Form Workout"** action on the `MesocyclesPage`. Placement TBD
  — could be alongside the "New" mesocycle button, or in a secondary area.
- Uses the same scheduling creation flow as step 3 (date picker, then navigate to
  Planning mode).

### 13. Home Page Updates

- **HeroCard:** "Start Free-Form Workout" action. When a mesocycle is active, this
  should be secondary — a small link or button below the main mesocycle action, not
  competing for attention. When no mesocycle is active, it can be a more prominent
  card action alongside the mesocycle creation prompt.
- **Planned session card:** If the user has a planned free-form session that has not
  yet been started (no actual values logged), show a secondary card below the hero
  card (e.g. "Planned: March 31 Workout" with a "Start" button). Tapping "Start"
  navigates to the session page in Active mode (updates `startTime` to now). If
  the session has already been started (has actual values), it should instead appear
  as the "Continue Session" button in the normal hero card flow.
- **Recent Sessions:** Update `getRecentCompletedSessions` in `homePageUtils.ts` to
  include sessions where `workoutMicrocycleId === null`.
- **Pending Logs:** No changes — free-form sessions skip review.

### 14. Empty State and Text Updates

Update text throughout the app to reflect that free-form sessions are an option,
while still encouraging mesocycle usage as the primary path for progression.

- **`HomePageEmptyState`**: Change from "No active mesocycle" / "Create a mesocycle
  to start planning sessions." to something that presents both options — e.g.
  "Start a free-form workout or create a mesocycle for planned progression."
- **`SessionsPageEmptyState`**: Same treatment as home page. Should also reflect
  free-form sessions if any exist but no mesocycle is active.
- **`OnboardingEmptyState`** (0-3 calibrations): The calibration onboarding still
  applies for mesocycle creation. But the messaging should acknowledge that the user
  can also track workouts without calibrations via free-form. Something like "Want
  to jump right in? Start a free-form workout. For planned progression, set up
  exercises with calibrations first."
- **`SessionPageExerciseCard`** line ~363: Hide "Hit target reps first, then keep
  going until you reach target RIR." when the exercise is treated as deload / no
  planned RIR.
- **`MesocyclesPageEmptyState`**: No changes needed (this page is mesocycle-specific).
- **`ExercisePageEditForm`** line ~226: No changes needed (still accurate context).

### 15. Navigation Updates

- **NavBar smart redirect:** Include free-form in-progress sessions in the sessions
  icon redirect logic. Currently `mesocycleMapService.activeAndNextSessions` only
  checks mesocycle sessions — add a parallel check for sessions with null
  `workoutMicrocycleId`.
- **`enabledPages` store:** Ensure pages aren't gated behind mesocycle existence if
  the user has free-form sessions.

### 16. Storybook

New stories and route updates for comprehensive coverage of free-form states.

**New component stories:**
- **Exercise Picker Dialog:** Empty library, library with exercises, selected state,
  search filtering.
- **Exercise Reorder Dialog:** Multiple exercises, drag-and-drop in progress.
- **Free-Form Exercise Card (Active mode):** Empty (1 set, no values), partially
  logged, all sets logged (Done enabled), Done state (collapsed, checkmark), Edit
  state (re-expanded after Done).
- **Free-Form Exercise Card (Planning mode):** Empty, partially planned, fully
  planned.

**Home page stories (via Full App story):**
- No mesocycle, no free-form sessions (empty state with free-form option).
- No mesocycle, has a planned free-form session (planned session card visible).
- No mesocycle, has an in-progress free-form session (continue session in hero).
- Active mesocycle, no free-form sessions (free-form option is secondary).
- Active mesocycle, has a planned free-form session (planned card below hero).
- Active mesocycle, has completed free-form sessions (in recent sessions).

**Sessions page stories (via Full App story):**
- Active mesocycle with structured sessions + free-form section (planned, in
  progress, completed free-form sessions).
- No mesocycle, only free-form sessions.
- Empty state (no mesocycle, no free-form sessions).

**Session page stories (via Full App story):**
- Free-form Active: empty session (no exercises, just Add Exercise button).
- Free-form Active: mid-workout (some exercises done, one in progress).
- Free-form Active: all exercises done (Complete Session enabled).
- Free-form Active: previously planned session (targets visible on set rows).
- Free-form Planning: empty (just Add Exercise).
- Free-form Planning: exercises with planned values (Save Planned Session enabled).
- Free-form View: completed free-form session (read-only).

**Mesocycles page stories (via Full App story):**
- Mesocycles list with "Plan Free-Form Workout" action visible.
- Empty mesocycles state with "Plan Free-Form Workout" action visible.

**SBFullAppRouter updates:**
- Add route branch for `/session/plan` (if a new route is used for Planning mode).

## Out of Scope

- Session templates / favorites
- Free-form sessions feeding into SFR-based analytics
