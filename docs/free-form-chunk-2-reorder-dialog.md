# Chunk 2: Exercise Reorder Dialog

## Goal

Add an "Reorder Exercises" option to the session page overflow menu (built in chunk
1), and build a dialog that lets the user reorder exercises using up/down arrow
buttons.

## Prerequisites

- Chunk 1 completed (overflow menu exists on session page header).

## Context

- The session's exercise order is stored in `session.sessionExerciseOrder`, an array
  of `WorkoutSessionExercise` IDs. Reordering this array changes the display order.
- No drag-and-drop library is installed in the project. Use up/down arrow buttons
  instead. Icons: `IconArrowUp` and `IconArrowDown` from `@tabler/icons-svelte`.
- Exercise names are resolved via `exerciseMapService` — each
  `WorkoutSessionExercise` has a `workoutExerciseId` that maps to a `WorkoutExercise`
  with a `name` field.
- The reorder dialog should be available for free-form sessions in both Active and
  Planning modes (Planning mode is added in chunk 3 — just make sure the reorder
  dialog doesn't hard-gate on Active mode).
- Use shadcn-svelte `Dialog` for the reorder dialog.
- Persist changes via `sessionMapService.prepareDocsForSave({ update: [session] })`
  then `WorkoutAPIService.queryApi(apiOptions)`.

## Tasks

### 1. Add "Reorder Exercises" to the overflow menu

**File:** `src/pages/SessionPage/SessionPageHeader.svelte`

- Add a second `DropdownMenu.Item`: "Reorder Exercises".
- This item should be disabled when the session has fewer than 2 exercises (nothing
  to reorder).
- On tap, open the reorder dialog.

### 2. Build the reorder dialog

Create a new component (e.g. `SessionPageReorderDialog.svelte` next to the session
page files, or inline in the header if small enough).

**Dialog content:**
- A vertical list of exercise names, each in a row with:
  - Exercise name (resolved from `exerciseMapService`).
  - An "up" arrow button (disabled for the first item).
  - A "down" arrow button (disabled for the last item).
- Tapping an arrow swaps the exercise with its neighbor in the local list state.
- The list should update immediately on each arrow tap (reactive local state).
- "Cancel" and "Save" buttons at the bottom.

**On save:**
1. Update `session.sessionExerciseOrder` with the new order.
2. Persist via the existing pattern.
3. Close the dialog.

**On cancel:**
- Discard changes and close.

### 3. Wire up the dialog from the overflow menu

- The overflow menu item triggers a state variable (e.g. `reorderDialogOpen`) that
  controls the dialog's `open` prop.
- Pass the current session and its exercise data to the dialog.

## Acceptance Criteria

- "Reorder Exercises" appears in the session page overflow menu for free-form
  sessions.
- The option is disabled when there are fewer than 2 exercises.
- The dialog shows exercise names with up/down arrows.
- Arrow buttons correctly swap adjacent exercises.
- Saving persists the new order and the session page re-renders exercises in the
  updated order.
- Canceling discards changes.
- `pnpm lint --fix`, `pnpm check`, and `pnpm test` all pass.

## Edge Cases

- **Single exercise:** "Reorder Exercises" menu item is disabled.
- **No exercises:** "Reorder Exercises" menu item is disabled.
- **Rapid tapping:** The up/down swap should work correctly even if tapped quickly
  in succession (standard Svelte reactivity handles this).
