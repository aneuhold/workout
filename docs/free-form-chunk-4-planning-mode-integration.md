# Chunk 4: Planning Mode — Entry Points & Page Integration

## Goal

Add entry points to navigate into Planning mode from the Sessions page and Mesocycles
page, show planned sessions prominently on the Home page, and distinguish planned
from in-progress sessions on the Sessions page. Add a start-date editor to the
session page (inline in Planning mode, modal via options menu otherwise). Add an
"Edit Targets" option to the session page options menu for incomplete free-form
sessions.

## Prerequisites

- Chunk 3 completed (Planning mode works on the session page).

## Context

- Planning mode is activated by a `planningMode=true` query parameter on the
  existing `/session` route: `/session?sessionId=xxx&planningMode=true`.
- The `/session/new` route also renders `<SessionPage planning={true}>` for
  creating brand-new planned sessions.
- The session is created and persisted immediately (via
  `sessionMapService.createFreeFormSession()`), so all CRUD operations use the
  existing map services with auto-save.
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
  - **In Progress** — same as current behavior (shows progress, "Continue" action).
  - **Planned** — shows planned sessions with a "Planned" status badge. Tapping a
    planned session navigates to `/session?sessionId=xxx&planningMode=true` (opens
    in Planning mode for further editing). Add a "Start" button/action on each planned
    session card that navigates to `/session?sessionId=xxx` (Active mode).
  - **Completed** — same as current behavior.
- Add a **"Plan Workout"** button alongside the existing "New Workout" button.
  Tapping it navigates directly to `/session/new` (the `/session/new` route renders
  SessionPage in planning mode, where the user can set the start date inline).
- **Pagination:** Each subsection paginates independently once it exceeds 5 items.
  Follow the exact same pattern used in
  `src/pages/MesocyclePage/MesocycleExercisesCard.svelte`:
  - Declare a shared `const PAGE_SIZE = 5` at the top of the component.
  - Maintain three separate `$state` page counters, one per subsection (e.g.
    `inProgressPage`, `plannedPage`, `completedPage`), each defaulting to `1`.
  - For each subsection, derive `totalPages = Math.ceil(sessions.length / PAGE_SIZE)`,
    `showPagination = totalPages > 1`, and `paginatedSessions = sessions.slice(
    (currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)`.
  - Render the shadcn-svelte `Pagination` component (with `PaginationContent`,
    `PaginationItem`, `PaginationPrevious`, `PaginationLink`, `PaginationEllipsis`,
    `PaginationNext`) below each subsection's list, but only when
    `showPagination` is true. Bind `page` to the subsection's page counter and pass
    `count={sessions.length}` and `perPage={PAGE_SIZE}`.
  - If the underlying session list for a subsection shrinks (e.g. a session moves
    from planned to in-progress) such that `currentPage > totalPages`, reset that
    subsection's page counter back to `1` via an `$effect`.

### 3. Add start-date editor to the session page

**File:** `src/pages/SessionPage/SessionPageHeader.svelte` (options menu item +
modal), `src/pages/SessionPage/SessionPage.svelte` (inline placement in Planning
mode)

Build a `SessionPageStartDatePicker` component (or similar) using the `Calendar`
from shadcn-svelte (same `Calendar` component as `MesocycleConfigCard`). This
component is shared between the inline and modal usages.

**Behavior by mode:**

- **Planning mode:** Render the date picker component inline, directly below the
  session page header (not inside a modal). The user sees and can change the start
  date while planning without extra clicks.
- **Non-Planning free-form modes (Active, Review, View):** Add a "Change Start
  Date" item to the existing options button dropdown menu in `SessionPageHeader`.
  Tapping it opens a `Dialog` containing the same date picker component. On save,
  persist the updated `startTime` to the session document. Not available for
  mesocycle-based sessions.

### 4. Add "Edit Targets" option to session page options menu

**File:** `src/pages/SessionPage/SessionPageHeader.svelte`

- Add an "Edit Targets" dropdown menu item, visible when `isFreeForm` and
  `session.complete === false` and `mode !== SessionPageMode.Planning`.
- On tap: navigate to `/session?sessionId=xxx&planningMode=true`. This lets the
  user re-enter Planning mode on an in-progress (or planned) session to adjust
  planned weight/reps without affecting already-logged actual values.

### 5. Add "Plan Free-Form Workout" to Mesocycles page

**File:** `src/pages/MesocyclesPage/MesocyclesPage.svelte`

- Add a "Plan Free-Form Workout" button. Placement: alongside or near the "New"
  mesocycle button, but visually secondary (e.g. `variant="outline"` or similar).
- On tap: navigate directly to `/session/new` (the `/session/new` route renders
  SessionPage in planning mode, where the user can set the start date inline).

### 6. Show free-form sessions section on Home page

**Files:**

- `src/pages/HomePage/HomePage.svelte`
- New file: `src/pages/HomePage/HomePageFreeFormSessions.svelte` (or similar)

Add a "Free-Form Workouts" section to the home page, placed **below the
`HomePageWeekSessions` section** (the "This Week" mesocycle session list) if it
exists, or below the hero card otherwise. This section follows the exact same
visual pattern as `HomePageWeekSessions` and `HomePageRecentSessions`: a text
label, then a vertical list of `SessionCard` components.

**Contents (in order):**

1. The current in-progress free-form session (if one exists) — shown at the top
   with its existing in-progress status.
2. Up to 2 upcoming planned free-form sessions (nearest `startTime` first) —
   shown with a "Planned" status (may require adding a `Planned` value to
   `SessionStatus` or reusing an appropriate existing status).

Only render this section if there is at least one in-progress or planned free-form
session to show. Use `SessionCard` for each entry, passing session exercises and
sets the same way `HomePageWeekSessions` does.

The hero card priority logic in `heroCardUtils.ts` should NOT be affected — this
is a separate section, not part of the hero card.

### 7. "Start Planned Session" flow

When a planned session is "started" (from the Home page section or the Sessions
page):

1. Navigate to `/session?sessionId=xxx` (Active mode).
2. The session page loads in Active mode with the pre-planned exercises and sets.
   Since `plannedReps`/`plannedWeight` are set, the target row in `SessionPageSetRow`
   correctly displays planned values as targets (the existing `actual ?? planned`
   fallback handles this).
3. The session's `startTime` is not modified — it retains whatever the user set
   during planning.

This is a simple navigation, so no shared helper is needed.

## Acceptance Criteria

- Sessions page shows planned, in-progress, and completed free-form sessions in
  separate subsections, each with independent pagination (5 per page) that mirrors
  the pattern used in `MesocycleExercisesCard`.
- "Plan Workout" button on Sessions page navigates to Planning mode.
- "Plan Free-Form Workout" button on Mesocycles page navigates to Planning mode.
- Tapping a planned session on the Sessions page opens it in Planning mode for
  editing.
- "Start" on a planned session navigates to Active mode (preserves `startTime`).
- Home page shows a "Free-Form Workouts" section (below the current week section
  if present) listing the in-progress free-form session and up to 2 upcoming
  planned sessions, using the same `SessionCard` pattern as other session lists.
- Starting a planned session in Active mode shows planned values as targets.
- In Planning mode, start date is editable inline below the header.
- In non-Planning free-form modes, "Change Start Date" is available in the options
  menu and opens a modal with the same date picker.
- "Edit Targets" option in the options menu opens Planning mode for incomplete
  free-form sessions, allowing re-editing of planned values even after logging has
  started.
- Planning mode is always available via `planningMode=true`, even on sessions that
  have actual values logged (allows re-editing planned values).
- `pnpm lint --fix`, `pnpm check`, and `pnpm test` all pass.

## Edge Cases

- **No planned sessions:** The planned subsection and Home page card should not
  render (no empty state needed for the planned subsection specifically).
- **Multiple planned sessions:** Sessions page shows all of them, paginated 5 at
  a time. Home page shows only the nearest one.
- **More than 5 sessions in a subsection:** The subsection paginates independently
  of the other subsections using the shadcn-svelte `Pagination` component (see
  Task 2).
- **Past planned date:** A planned session whose date has passed should still appear
  in the planned subsection (the user may have planned it and not started it yet).
  It should be at the top of the planned list since it's the most "overdue."
- **Planned session with 0 exercises:** Still appears in the planned subsection.
  The session card on the Sessions page should make it visually obvious (e.g.
  showing "0 exercises") so the user is aware they have an empty planned session.
