# Chunk 3: Planning Mode — Core Session Page

## Goal

Add a `Planning` mode to the session page that lets users pre-plan a free-form
workout by entering `plannedReps` and `plannedWeight` for each set. The planned
session is held in memory until the user saves it. This chunk focuses on the session
page internals — entry points (how users navigate to Planning mode) are in chunk 4.

## Prerequisites

- Chunks 1 and 2 completed (overflow menu and reorder dialog exist).

## Context

- `SessionPageMode` is defined in `src/pages/SessionPage/sessionPageTypes.ts` with
  values: `Active`, `Review`, `View`, `Locked`.
- `SessionPage.svelte` determines the mode from the session's state (complete,
  locked, etc.) in its derived logic.
- `SessionPageSetRow.svelte` currently writes to `actualReps`/`actualWeight`/`rir`
  when inputs are edited. Derived display values use `actual ?? planned ?? undefined`.
- `SessionPageExerciseCard.svelte` has the Done/Edit pattern for free-form Active
  mode, and sequential Current/Completed/Future set gating.
- The `WorkoutAPIService` batches CRUD operations via `prepareDocsForSave` →
  `queryApi`.
- Planned sessions should NOT be persisted until the user taps "Save Planned Session".
  This means in Planning mode, the session page works with in-memory documents, not
  documents fetched from the server.

## Design Decisions

- **Route:** Use `/session/new` — a new route, consistent with the existing
  `/mesocycle/new` and `/exercise/new` pattern. The route file
  (`src/routes/session/new/+page.svelte`) renders the same `SessionPage` component
  but signals Planning mode via a prop (e.g. `planning={true}`).
- **In-memory state:** When the `/session/new` route is loaded with no `sessionId`
  query param, the session page creates local (in-memory) `WorkoutSession`,
  `WorkoutSessionExercise`, and `WorkoutSet` documents. These are NOT persisted until
  the user saves.
- **When `/session/new?sessionId=xxx`:** Load the existing planned session and enter
  Planning mode with pre-loaded data. This supports editing a previously saved
  planned session.
- **Inputs target planned fields:** In Planning mode, set row inputs write to
  `plannedReps` and `plannedWeight` instead of `actualReps` and `actualWeight`.
  `plannedRir` is never set (keeps the deload path working for when the session is
  later started in Active mode).

## Tasks

### 1. Add `Planning` to `SessionPageMode`

**File:** `src/pages/SessionPage/sessionPageTypes.ts`

Add `Planning = 'planning'` to the `SessionPageMode` enum.

### 2. Create the `/session/new` route

Create a new route at `src/routes/session/new/+page.svelte`, following the same
pattern as `src/routes/mesocycle/new/+page.svelte`:

```svelte
<script lang="ts">
  import { page } from '$app/state';
  import SessionPage from '$pages/SessionPage/SessionPage.svelte';
  import { sessionNewPageInfo } from './pageInfo';

  let sessionId = $derived(page.url.searchParams.get('sessionId'));
  let date = $derived(page.url.searchParams.get('date'));
</script>

<svelte:head>
  <title>{sessionNewPageInfo.shortTitle}</title>
  <meta name="description" content={sessionNewPageInfo.description} />
</svelte:head>

<SessionPage {sessionId} planning={true} plannedDate={date} />
```

Also create `src/routes/session/new/pageInfo.ts` with the page metadata.

### 3. Accept `planning` prop on `SessionPage`

**File:** `src/pages/SessionPage/SessionPage.svelte`

- Add a new prop: `planning: boolean = false`.
- Optionally accept `plannedDate: string | null = null` for the target date.
- When `planning` is true:
  - If a `sessionId` is also provided, load that session and enter Planning mode.
  - If no `sessionId`, create in-memory documents (a new `WorkoutSession` with
    `workoutMicrocycleId: null`, an auto-generated title from the planned date or
    today's date, and empty `sessionExerciseOrder`).
  - Set `mode = SessionPageMode.Planning`.
- The in-memory documents should be stored in local `$state()` variables, separate
  from the server-backed `sessionMapService` data.

### 4. Refactor `SessionPageSetRow` for target field selection

**File:** `src/pages/SessionPage/SessionPageSetRow.svelte`

- Accept a new prop or derive from the passed `mode`: `targetField` which is either
  `'actual'` (default) or `'planned'`.
- When `targetField === 'planned'`:
  - Inputs write to `set.plannedReps` and `set.plannedWeight`.
  - The RIR input is hidden (no `plannedRir` for free-form).
- When `targetField === 'actual'` (unchanged behavior):
  - Inputs write to `set.actualReps`, `set.actualWeight`, and `set.rir`.
- The display logic (`actual ?? planned ?? undefined`) remains the same — in Planning
  mode, since `actual` is null, the planned values display in the inputs.

### 5. Refactor `SessionPageExerciseCard` for Planning mode

**File:** `src/pages/SessionPage/SessionPageExerciseCard.svelte`

- When `mode === SessionPageMode.Planning`:
  - **No Done/Edit pattern.** All exercise cards stay expanded and editable.
  - **No sequential set gating.** All sets are editable simultaneously (no
    Current/Completed/Future states). Every set should be in an editable state.
  - Add Exercise, Add Set, Remove Set, and Remove Exercise are all available (same
    as free-form Active mode when not in Done state).
  - The "Log" confirmation dialog per set is NOT shown — inputs are inline and write
    directly to `plannedReps` / `plannedWeight`.

### 6. In-memory document management for Planning mode

**File:** `src/pages/SessionPage/SessionPage.svelte` (or a new helper file)

When in Planning mode without a `sessionId`:
- Maintain local arrays of `WorkoutSessionExercise[]` and `WorkoutSet[]` in `$state`.
- "Add Exercise" creates in-memory documents (use the schema's `.parse()` to generate
  valid documents with IDs).
- "Add Set" / "Remove Set" / "Remove Exercise" operate on these local arrays.
- Pass these local documents to the exercise cards instead of the server-backed
  map service data.

When in Planning mode WITH a `sessionId`:
- Load the existing session, session exercises, and sets from the map services.
- Copy them into local `$state` for editing.
- Changes are held locally until save.

### 7. "Save Planned Session" button

**File:** `src/pages/SessionPage/SessionPage.svelte` (or `SessionPageSummaryCard`)

- At the bottom of the session page in Planning mode, show a "Save Planned Session"
  button (full-width, similar to "Complete Session" positioning).
- **Enabled when:** At least 1 exercise exists AND at least 1 set on any exercise has
  both `plannedReps` and `plannedWeight` filled.
- **On tap:**
  1. If the session is new (no `sessionId`): create the `WorkoutSession` with
     `workoutMicrocycleId: null`, title from date, `startTime` set to the planned
     date, and `complete: false`.
  2. Batch insert all `WorkoutSessionExercise` and `WorkoutSet` documents.
  3. Persist via `WorkoutAPIService.queryApi()`.
  4. Navigate to `/sessions` (the sessions page).
- If editing an existing planned session: use update operations instead of inserts
  for documents that already exist. Handle any new/removed exercises and sets by
  comparing the local state with the original loaded state.

### 8. "Add Exercise" in Planning mode

The existing "Add Exercise" flow (exercise picker → create session exercise + 1 set)
needs to work with in-memory state in Planning mode. Currently it calls
`sessionMapService.addExercisesToSession()` which persists immediately. In Planning
mode, it should instead add to the local in-memory arrays.

**Approach:** Either:
- (a) Check the mode inside the handler and branch: if Planning, add to local state;
  if Active, call the service as today.
- (b) Extract the document creation logic into a shared helper that returns the new
  documents, and let the caller decide whether to persist or hold in memory.

Choose whichever approach is cleaner.

## Acceptance Criteria

- Navigating to `/session/new` enters Planning mode with an empty session.
- Navigating to `/session/new?sessionId=xxx` enters Planning mode with
  pre-loaded data from an existing session.
- In Planning mode, set row inputs write to `plannedReps`/`plannedWeight` (not
  `actualReps`/`actualWeight`).
- RIR input is hidden in Planning mode.
- All exercise cards stay expanded (no Done/Edit pattern, no sequential set gating).
- "Add Exercise", "Add Set", "Remove Set", "Remove Exercise" work with in-memory
  state.
- "Save Planned Session" persists all documents and navigates to sessions page.
- "Save Planned Session" is disabled until at least 1 exercise with 1 planned set.
- Overflow menu (Rename, Reorder) works in Planning mode with in-memory state.
- `pnpm lint --fix`, `pnpm check`, and `pnpm test` all pass.

## Edge Cases

- **Navigating away before saving:** The in-memory state is lost. This is intentional
  — no auto-save or "unsaved changes" warning is needed for this iteration.
- **Editing an existing planned session:** The save operation should handle the diff
  correctly — new exercises/sets are inserted, removed ones are deleted, and modified
  ones are updated.
- **Empty date:** If no `?date=` query param is provided on `/session/new`, default
  to today's date for the title and `startTime`.
- **Planning mode with a non-free-form session:** This should not happen (Planning
  mode is only entered via free-form flows). But if it somehow does, treat it the
  same way — the session page should not crash.
