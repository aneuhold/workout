# Chunk 1: Session Page Overflow Menu — Rename, Edit & Delete

## Goal

Add a 3-dot overflow menu to the session page header for free-form sessions, with
options to rename the session, edit a completed session, and delete the session.

## Prerequisites

None — this is the first chunk.

## Context

- The session page header is in `src/pages/SessionPage/SessionPageHeader.svelte`. It
  currently renders a back button (left) and a title + description (right). There is
  no overflow menu or action buttons.
- Free-form sessions are identified by `workoutMicrocycleId === null` on the
  `WorkoutSession` document. The helper `sessionMapService.isFreeFormSession(session)`
  returns this check.
- Session titles are auto-generated (e.g. "March 29 Workout") and stored in
  `session.title`.
- The icon library is `@tabler/icons-svelte` — use `IconDotsVertical` for the menu
  trigger.
- Use shadcn-svelte `DropdownMenu` for the overflow menu. Reference:
  https://shadcn-svelte.com/llms.txt
- Use shadcn-svelte `AlertDialog` for the delete confirmation (same pattern as
  `SingletonDeleteDialog` in `src/components/singletons/dialogs/SingletonDeleteDialog/`
  and the remove-exercise confirmation in `SessionPageExerciseCard`).
- Use shadcn-svelte `Dialog` for the rename dialog.
- Persist changes via `WorkoutAPIService`.
- Deleting a session requires cascade deletion: all `WorkoutSet` documents, all
  `WorkoutSessionExercise` documents, then the `WorkoutSession` itself. See the
  existing `sessionMapService.removeExerciseFromSession()` for the batch pattern
  using `prepareDocsForSave` → `WorkoutAPIService.queryApi()`.

## Tasks

### 1. Add overflow menu to `SessionPageHeader`

**File:** `src/pages/SessionPage/SessionPageHeader.svelte`

- Accept new props: `isFreeForm: boolean` and `mode: SessionPageMode` (or the full
  session object if needed for determining state).
- When `isFreeForm` is true, render a `DropdownMenu` with an `IconDotsVertical`
  trigger button on the right side of the header (opposite the back button).
- Menu items (all only shown when `isFreeForm` is true):
  - **"Rename Session"** — always visible.
  - **"Edit Session"** — only visible when the session is in `View` mode (completed).
  - **"Delete Session"** — always visible, styled with `text-destructive` to indicate
    it's a destructive action.
  - A fourth item ("Reorder Exercises") will be added in chunk 2.
- When `isFreeForm` is false, do not render the menu.

### 2. Pass props from `SessionPage`

**File:** `src/pages/SessionPage/SessionPage.svelte`

- The session page already derives the session, mode, and whether it's free-form.
  Pass `isFreeForm` and `mode` (or equivalent) to `SessionPageHeader`.
- Accept callbacks from the header for each menu action (rename, edit, delete), or
  let the header manage its own dialogs — choose whichever pattern is cleaner.

### 3. Build the rename dialog

- When "Rename Session" is tapped in the overflow menu, open a `Dialog` with:
  - A text input pre-filled with the current session title.
  - "Cancel" and "Save" buttons.
  - "Save" is disabled if the input is empty or unchanged.
- On save:
  1. Update `session.title` on the local document.
  2. Persist via `sessionMapService.prepareDocsForSave({ update: [session] })` then
     `WorkoutAPIService.queryApi(apiOptions)`.
  3. Close the dialog.
- The dialog can be a local component within `SessionPageHeader` or a separate file
  next to it. Prefer inline if it's small; extract if it's over ~50 lines.

### 4. Build the delete confirmation and handler

- When "Delete Session" is tapped, open an `AlertDialog` confirmation:
  - Title: "Delete session?"
  - Description: `Are you sure you want to delete "{session.title}"? This will remove
    all exercises and sets. This action cannot be undone.`
  - "Cancel" and "Delete" buttons. "Delete" should use destructive styling
    (`class="bg-destructive text-destructive-foreground hover:bg-destructive/90"`).
- On confirm:
  1. Collect all `WorkoutSessionExercise` IDs from the session's
     `sessionExerciseOrder`.
  2. For each session exercise, collect all `WorkoutSet` IDs from its `setOrder`.
  3. Batch delete: sets → session exercises → session, using `prepareDocsForSave`
     with `{ delete: [...ids] }` for each document type, then
     `WorkoutAPIService.queryApi(apiOptions)`.
  4. Navigate back (e.g. `goto('/sessions')` or `history.back()`).

**Service method:** Add a `deleteFreeFormSession(sessionId)` method to
`sessionMapService` that handles the cascade deletion. This keeps the logic in the
service layer and makes it reusable (the Sessions page may also want to delete
sessions in a future iteration).

### 5. Implement "Edit Session" for completed sessions

- When "Edit Session" is tapped on a completed free-form session (in `View` mode):
  1. Set `session.complete = false` on the local document.
  2. Persist via `sessionMapService.prepareDocsForSave({ update: [session] })` then
     `WorkoutAPIService.queryApi(apiOptions)`.
  3. The session page re-derives its mode and transitions from `View` → `Active`.
  4. The user can now modify sets, add/remove exercises, etc.
  5. When done, the user completes the session again via "Complete Session".
- This is a simple state change — no new UI beyond the menu item.

## Acceptance Criteria

- Free-form session pages show a 3-dot menu in the header.
- Tapping "Rename Session" opens a dialog pre-filled with the current title.
- Saving the new title updates it in the UI and persists to the backend.
- Tapping "Delete Session" shows a confirmation dialog. Confirming deletes the
  session and all associated exercises/sets, then navigates away.
- Tapping "Edit Session" (only visible on completed sessions) re-opens the session
  for editing in Active mode.
- Structured (non-free-form) session pages do NOT show the overflow menu.
- `pnpm lint --fix`, `pnpm check`, and `pnpm test` all pass.

## Edge Cases

- **Empty title:** The rename save button should be disabled if the input is blank.
- **Same title:** The rename save button should be disabled if the title hasn't
  changed.
- **Long titles:** The text input should not overflow; the header should truncate
  gracefully (it likely already does via CSS).
- **Deleting an in-progress session:** Should work the same as deleting a completed
  session — the confirmation dialog is the safeguard.
- **Editing a session with no exercises:** After setting `complete = false`, the
  Active mode page should show the "Add Exercise" empty state. This should work
  naturally since the existing Active mode handles empty sessions.
- **Re-completing after edit:** After editing, the Done/Edit pattern resets — the
  user needs to mark all exercises as Done again before "Complete Session" is
  enabled. Done state auto-initializes from persisted data (all sets logged = done),
  so exercises that weren't modified will auto-restore to Done state.
