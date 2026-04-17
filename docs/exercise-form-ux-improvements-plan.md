# Exercise Form UX Improvements Plan

Three small UX improvements targeting the new exercise flow and free-form session page.

## 1. Progression dropdown info popover

**Goal:** Match the existing pattern used by "Rep Range" (ExercisePageEditForm.svelte:208-229). Add an `InfoPopover` next to the "Progression" label that surfaces the JSDoc content from `ExerciseProgressionType` and its values in `@aneuhold/core-ts-db-lib`.

**Source content:** derived (and rewritten for readability) from the `ExerciseProgressionType` JSDoc in `packages/core-ts-db-lib/src/documents/workout/WorkoutExercise.ts:52-61`.

**Copy to render in the popover:**
- Heading: "How this exercise progresses week to week."
- **Rep:** "Add 2 reps each week. Once you pass the top of the rep range, bump the weight up by the smallest increment."
- **Load:** "Add a little weight each week — the smallest increment available, or 2% of your current load, whichever is bigger."

**Changes:**
- `src/pages/ExercisePage/ExercisePageEditForm.svelte`
  - Wrap the existing `<Label>Progression</Label>` (line 240) in a `flex items-center gap-2` div.
  - Add `<InfoPopover>` with a short intro line and a `<ul>` listing **Rep** and **Load**, mirroring the Rep Range popover structure (lines 210-228).

**Trade-off / note:** Descriptions are written directly into the Svelte template — we're not auto-extracting JSDoc, and the copy has been reworded from the source for readability. If the underlying behavior changes in ts-libs, this copy will need a manual sync.

---

## 2. "Add new exercise" button inside the exercise picker dialog

**Goal:** From the free-form session "Add Exercises" dialog, allow quick navigation to `/exercise/new`.

**Changes:**
- `src/components/singletons/dialogs/SingletonExercisePickerDialog/SingletonExercisePickerDialog.svelte`
  - Import `goto` from `$app/navigation` and `IconPlus` from `@tabler/icons-svelte`.
  - Add a secondary action button in the `DialogFooter` (lines 168-173) or as a sibling element — recommend placing it as a `variant="outline"` button alongside "Cancel", labelled "New Exercise" with `IconPlus`.
  - `onclick` handler: set `open = false`, then `goto('/exercise/new')`. Closing the dialog first avoids leaving a dangling modal on the route change. Any in-progress selections are discarded (matches current Cancel behavior — no extra handling needed).

---

## 3. Required-field validation UX (muscle group)

### Recommendation

**Go with a hybrid: validate on Save tap + scroll + highlight.** Do not pre-highlight required fields on initial load — the `*` markers and the existing "At least one primary muscle group is required" helper text already signal requirements, and pre-applying amber rings everywhere would add visual noise to a form that's normally completed correctly.

**Rationale:**
- Users who know the form won't see any extra chrome.
- Users who miss a field get clear, targeted feedback exactly when they ask for it.
- The existing codebase already uses this "highlight on request" pattern via the `highlight` prop in `SessionPageSliderField.svelte:64` (`ring-2 ring-amber-500/50`) — we'd be extending an established convention rather than inventing one.

**Caveat to discuss:** The Save button is currently `disabled={!formIsValid}` (ExercisePageEditForm.svelte:392). A disabled button doesn't fire `onclick`, so the "tap Save to reveal what's missing" technique requires removing the disabled state and moving validation into the submit handler. This is a deliberate trade — disabled buttons are slightly more discoverable as "not ready," but they also silently fail to explain _why_. The proposed UX is strictly more informative.

### Changes

- `src/pages/ExercisePage/ExercisePageEditForm.svelte`
  - Remove `disabled={!formIsValid}` from the Save button (line 392).
  - Add `$state` flags: `showNameError`, `showEquipmentError`, `showMuscleError` (or a single `validationAttempted` boolean if per-field granularity isn't needed — prefer the single flag since all three become visible simultaneously on first failed submit).
  - Add element refs via `bind:this` on the Name input's container, the Equipment container, and the Muscle Groups container (line 252).
  - In `handleSave`:
    - If `!formIsValid`, set `validationAttempted = true`, compute the first invalid field in top-to-bottom order, call `.scrollIntoView({ behavior: 'smooth', block: 'center' })` on its ref, and return early.
    - Once all three fields become valid, reset `validationAttempted = false` in a `$effect` that watches `formIsValid` so the highlight clears as the user fixes things.
  - Apply conditional classes for the amber ring using `cn()`:
    - Muscle Groups card (line 252 `rounded-lg border border-border p-3`): add `validationAttempted && formPrimary.size === 0 && 'ring-2 ring-amber-500/50'`.
    - Name input wrapper and Equipment wrapper: same pattern, same amber ring tokens.
  - Keep the existing `*` markers and helper text exactly as-is.

**Styling reuse:** `ring-2 ring-amber-500/50` is already the app's convention for "this field needs attention" (SessionPageSliderField.svelte:64). No new tokens.

---

## Validation

Per `.github/copilot-instructions.md`:

- `pnpm lint --fix`
- `pnpm check`
- `pnpm test`

Manually verify in the dev server (`pnpm dev`):
- Progression info popover opens and renders the enum descriptions.
- New Exercise button in the picker dialog closes the dialog and routes to `/exercise/new`.
- Saving the new-exercise form with no muscle group selected scrolls to and rings the muscle group card; fixing the field clears the ring; saving with name/equipment missing rings those instead.
