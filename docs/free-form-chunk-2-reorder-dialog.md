# Chunk 2: Exercise Reorder Dialog

## Goal

Add a "Reorder Exercises" option to the session page overflow menu (built in chunk
1), and build a dialog that lets the user reorder exercises via drag-and-drop.

## Prerequisites

- Chunk 1 completed (overflow menu exists on session page header).
- Install `svelte-dnd-action`: `pnpm add svelte-dnd-action`

## Context

- The session's exercise order is stored in `session.sessionExerciseOrder`, an array
  of `WorkoutSessionExercise` IDs. Reordering this array changes the display order.
- Exercise names are resolved via `exerciseMapService` — each
  `WorkoutSessionExercise` has a `workoutExerciseId` that maps to a `WorkoutExercise`
  with a `name` field.
- The reorder dialog should be available for free-form sessions in both Active and
  Planning modes (Planning mode is added in chunk 3 — just make sure the reorder
  dialog doesn't hard-gate on Active mode).
- Use shadcn-svelte `Dialog` for the reorder dialog.
- Persist changes via `sessionMapService.prepareDocsForSave({ update: [session] })`
  then `WorkoutAPIService.queryApi(apiOptions)`.

### Drag-and-Drop Library: `svelte-dnd-action`

Use [`svelte-dnd-action`](https://github.com/isaacHagoel/svelte-dnd-action) for the
drag-and-drop reordering. This library:
- Supports Svelte 5 (event syntax: `onconsider`, `onfinalize`).
- Has built-in touch support (critical for a mobile workout app).
- Has built-in keyboard accessibility (arrow keys to reorder).
- Uses a `use:dndzone` action directive — not a component wrapper — so it composes
  cleanly with any markup.
- ~8.5 KB gzipped, zero dependencies.

**Basic usage pattern:**
```svelte
<script>
  import { dndzone } from 'svelte-dnd-action';

  let items = $state([
    { id: '1', name: 'Bench Press' },
    { id: '2', name: 'Squat' }
  ]);

  function handleSort(e: CustomEvent) {
    items = e.detail.items;
  }
</script>

<div use:dndzone={{ items, flipDurationMs: 200 }} onconsider={handleSort} onfinalize={handleSort}>
  {#each items as item (item.id)}
    <div>{item.name}</div>
  {/each}
</div>
```

Items must have an `id` property. `onconsider` fires during drag (for preview),
`onfinalize` fires on drop (for commit). Both update the same `items` array.

## Tasks

### 1. Install `svelte-dnd-action`

Run `pnpm add svelte-dnd-action`.

### 2. Add "Reorder Exercises" to the overflow menu

**File:** `src/pages/SessionPage/SessionPageHeader.svelte`

- Add a `DropdownMenu.Item`: "Reorder Exercises".
- This item should be disabled when the session has fewer than 2 exercises (nothing
  to reorder).
- On tap, open the reorder dialog.

### 3. Build the reorder dialog

Create a new component (e.g. `SessionPageReorderDialog.svelte` next to the session
page files).

**Props:**
- `open: boolean` — controls dialog visibility (bindable).
- `exerciseOrder: { id: string; name: string }[]` — initial list of exercises in
  current order. Map from `session.sessionExerciseOrder` IDs → exercise names before
  passing in.
- `onSave: (newOrder: UUID[]) => void` — callback with the reordered IDs.

**Dialog content:**
- A vertical list of exercise names inside a `use:dndzone` container.
- Each item shows the exercise name and a drag handle icon (e.g. `IconGripVertical`
  from `@tabler/icons-svelte`).
- Dragging an item reorders the list in real-time (via `onconsider`/`onfinalize`).
- "Cancel" and "Save" buttons at the bottom.
- Consider adding `flipDurationMs: 200` for smooth animation on reorder.

**On save:**
1. Extract the ordered IDs from the local `items` array.
2. Call `onSave(newOrderIds)`.
3. Close the dialog.

**On cancel:**
- Discard changes and close.

### 4. Wire up the dialog from the overflow menu

- The overflow menu item triggers a state variable (e.g. `reorderDialogOpen`) that
  controls the dialog's `open` prop.
- Build the `exerciseOrder` prop by mapping `session.sessionExerciseOrder` to
  `{ id, name }` objects using `sessionExerciseMapService` and `exerciseMapService`.
- The `onSave` callback updates `session.sessionExerciseOrder` with the new order
  and persists via `sessionMapService.prepareDocsForSave({ update: [session] })` then
  `WorkoutAPIService.queryApi(apiOptions)`.

### 5. TypeScript setup for `svelte-dnd-action`

The library may need a type declaration for the `onconsider`/`onfinalize` events on
HTML elements. If TypeScript complains, add the following to `src/app.d.ts` or a
similar declarations file:

```typescript
declare namespace svelteHTML {
  interface HTMLAttributes {
    'onconsider'?: (event: CustomEvent<DndEvent>) => void;
    'onfinalize'?: (event: CustomEvent<DndEvent>) => void;
  }
}
```

Import `DndEvent` from `svelte-dnd-action`. Check the library's README for the
latest TypeScript configuration guidance.

## Acceptance Criteria

- "Reorder Exercises" appears in the session page overflow menu for free-form
  sessions.
- The option is disabled when there are fewer than 2 exercises.
- The dialog shows exercise names with drag handles.
- Dragging an item reorders the list in real-time with smooth animation.
- Drag-and-drop works on both desktop (mouse) and mobile (touch).
- Saving persists the new order and the session page re-renders exercises in the
  updated order.
- Canceling discards changes.
- `pnpm lint --fix`, `pnpm check`, and `pnpm test` all pass.

## Edge Cases

- **Single exercise:** "Reorder Exercises" menu item is disabled.
- **No exercises:** "Reorder Exercises" menu item is disabled.
- **Dialog scrolling:** If the exercise list is long enough to overflow the dialog,
  ensure the drag-and-drop still works correctly within the scrollable area.
  `svelte-dnd-action` supports auto-scrolling near container edges.
- **Touch delay:** Use `dragDisabled` or `morphDisabled` options if touch drags
  conflict with dialog scrolling. The library's `dropTargetStyle` and
  `dropTargetClasses` options can provide visual feedback during drag.
