# Chunk 4: Planning Mode — Entry Points & Page Integration

## Goal

Add entry points to navigate into Planning mode from the Sessions page and Mesocycles
page, show planned sessions prominently on the Home page, and distinguish planned
from in-progress sessions on the Sessions page.

## Prerequisites

- Chunk 3 completed (Planning mode works on the session page).

## Context

- Planning mode is entered via `/session/new` (optionally with
  `?date=YYYY-MM-DD` and/or `?sessionId=xxx`).
- A "planned" free-form session is one that exists in the database with
  `complete === false`, `workoutMicrocycleId === null`, and has NO actual values
  logged on any set (only `plannedReps`/`plannedWeight`).
- An "in-progress" free-form session has at least one set with actual values logged.
- The Sessions page's free-form section is in
  `src/pages/SessionsPage/SessionsPageFreeFormSection.svelte`.
- The Mesocycles page is at `src/pages/MesocyclesPage/MesocyclesPage.svelte`.
- The Home page hero card subcomponents are in
  `src/pages/HomePage/HomePageHeroCard/`.
- The date picker pattern used in the app is a `Calendar` + `Popover` combo from
  shadcn-svelte (see how `MesocycleConfigCard` uses it for reference).

## Tasks

### 1. Add a helper to distinguish planned vs in-progress sessions

**File:** `src/services/documentMapServices/sessionMapService.svelte.ts`

Add a method like `isPlannedSession(session)` that returns `true` when:
- `session.complete === false`
- `session.workoutMicrocycleId` is null (it's free-form)
- None of the session's sets have `actualReps` or `actualWeight` set

Update the `freeFormSessions` derived store to categorize into three groups:
- `planned`: Planned sessions (sorted by `startTime` ascending — nearest date first)
- `inProgress`: Sessions with at least one actual value logged (sorted by `startTime`
  descending)
- `completed`: Completed sessions (sorted by `startTime` descending)

### 2. Update Sessions page free-form section

**File:** `src/pages/SessionsPage/SessionsPageFreeFormSection.svelte`

- Split the current display into subsections:
  - **Planned** — shows planned sessions with a "Planned" status badge. Tapping a
    planned session navigates to `/session/new?sessionId=xxx` (opens in
    Planning mode for further editing). Add a "Start" button/action on each planned
    session card that navigates to `/session?sessionId=xxx` (Active mode) and updates
    `startTime` to now.
  - **In Progress** — same as current behavior (shows progress, "Continue" action).
  - **Completed** — same as current behavior.
- Add a **"Plan Workout"** button alongside the existing "New Workout" button.
  Tapping it opens a date picker popover. On date selection, navigate to
  `/session/new?date=YYYY-MM-DD`.

### 3. Add date picker for planned session creation

Build a small date picker component or inline it where needed. Use the
`Calendar` + `Popover` pattern from shadcn-svelte (same pattern as
`MesocycleConfigCard`).

- Triggered from the "Plan Workout" button on the Sessions page.
- On date selection, navigate to `/session/new?date=YYYY-MM-DD`.
- The date defaults to today. The user picks a future (or past) date.

### 4. Add "Plan Free-Form Workout" to Mesocycles page

**File:** `src/pages/MesocyclesPage/MesocyclesPage.svelte`

- Add a "Plan Free-Form Workout" button. Placement: alongside or near the "New"
  mesocycle button, but visually secondary (e.g. `variant="outline"` or similar).
- On tap: same date picker → navigate to Planning mode flow as the Sessions page
  (step 3).

### 5. Show planned session card on Home page

**Files:**
- `src/pages/HomePage/HomePageHeroCard/heroCardUtils.ts`
- `src/pages/HomePage/HomePage.svelte`
- New file: `src/pages/HomePage/HomePagePlannedSessionCard.svelte` (or similar)

- When the user has a planned free-form session (exists in `sessionMapService
  .freeFormSessions.planned`), show a secondary card **below the hero card** on the
  home page.
- The card should display: session title (e.g. "Planned: March 31 Workout"), exercise
  count, and a "Start" button.
- **"Start" button behavior:**
  1. Update `session.startTime` to `new Date()` (now).
  2. Persist the updated session.
  3. Navigate to `/session?sessionId=xxx` (Active mode).
- If there are multiple planned sessions, show only the nearest one (smallest
  `startTime` in the future, or the most recent past one if all are past).
- The hero card priority logic in `heroCardUtils.ts` should NOT be affected — this
  planned session card is a separate element below the hero, not part of the hero
  card itself.

### 6. "Start Planned Session" flow

When a planned session is "started" (from the Home page card or the Sessions page):
1. Update `session.startTime` to `new Date()`.
2. Persist the session update.
3. Navigate to `/session?sessionId=xxx` (Active mode).
4. The session page loads in Active mode with the pre-planned exercises and sets.
   Since `plannedReps`/`plannedWeight` are set, the target row in `SessionPageSetRow`
   should correctly display planned values as targets (the existing
   `actual ?? planned` fallback handles this).

This logic should be extracted into a shared helper since it's used from both the
Home page and the Sessions page.

## Acceptance Criteria

- Sessions page shows planned, in-progress, and completed free-form sessions in
  separate subsections.
- "Plan Workout" button on Sessions page opens a date picker and navigates to
  Planning mode.
- "Plan Free-Form Workout" button on Mesocycles page does the same.
- Tapping a planned session on the Sessions page opens it in Planning mode for
  editing.
- "Start" on a planned session updates `startTime` and navigates to Active mode.
- Home page shows a planned session card below the hero when planned sessions exist.
- Starting a planned session in Active mode shows planned values as targets.
- `pnpm lint --fix`, `pnpm check`, and `pnpm test` all pass.

## Edge Cases

- **No planned sessions:** The planned subsection and Home page card should not
  render (no empty state needed for the planned subsection specifically).
- **Multiple planned sessions:** Sessions page shows all of them. Home page shows
  only the nearest one.
- **Past planned date:** A planned session whose date has passed should still appear
  in the planned subsection (the user may have planned it and not started it yet).
  It should be at the top of the planned list since it's the most "overdue."
- **Starting a planned session with 0 exercises:** This shouldn't happen because
  "Save Planned Session" requires at least 1 exercise. But if it somehow does (e.g.
  data inconsistency), the Active mode session page handles it gracefully by showing
  the "Add Exercise" empty state.
- **Editing a planned session that was already started:** If a session has actual
  values logged, navigating to `/session/new?sessionId=xxx` should redirect to
  Active mode (`/session?sessionId=xxx`) instead of opening in Planning mode.
