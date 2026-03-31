# Free-Form Workouts: Implementation Status

See [free-form-workouts.md](./free-form-workouts.md) for background research.

## Completed

The following steps from the original plan are fully implemented:

1. **Exercise Picker Dialog** — `SingletonExercisePickerDialog` with search, filter,
   ordered multi-select, and exercise exclusion.
2. **Free-Form Session Creation (Immediate)** — "Start Free-Form Workout" from home
   page hero card and empty state. Creates session with null `workoutMicrocycleId`,
   auto-generated title, persists, and navigates to session page.
3. **Add Exercise on Session Page** — "Add Exercise" button opens picker, creates
   `WorkoutSessionExercise` + 1 empty `WorkoutSet`, appends to
   `sessionExerciseOrder`, persists immediately in Active mode.
4. **Add Set / Remove Set** — Per-exercise add/remove set with `setOrder` management.
   Remove disabled when only 1 set remains.
5. **Remove Exercise** — Per-exercise delete with confirmation dialog, removes
   session exercise + all its sets.
6. **Free-Form Exercise Card (Done/Edit Pattern)** — Card-level Done button (disabled
   until all sets logged), collapses card on tap, Edit button to re-expand. State
   auto-initializes from persisted data.
7. **Session Page Free-Form Adjustments** — Summary card updated for free-form,
   deload path hides metrics/instruction text, Complete Session button gated on all
   exercises Done + at least 1 exercise.
8. **Sessions Page** — `SessionsPageFreeFormSection` shows in-progress and completed
   free-form sessions with "New Workout" button.
9. **Home Page** — Hero card shows in-progress free-form sessions, empty state offers
   free-form creation, recent sessions include free-form.
10. **Empty State / Text Updates** — `HomePageEmptyState`, `SessionsPageEmptyState`,
    and `OnboardingEmptyState` updated with free-form messaging.
11. **Navigation** — NavBar smart redirect includes free-form sessions. `enabledPages`
    already enables all pages.

## Remaining Work

The remaining work is split into sequential chunks. Each chunk has its own file:

1. [Chunk 1: Session Overflow Menu & Rename](./free-form-chunk-1-overflow-menu-rename.md)
2. [Chunk 2: Exercise Reorder Dialog](./free-form-chunk-2-reorder-dialog.md)
3. [Chunk 3: Planning Mode — Core Session Page](./free-form-chunk-3-planning-mode-core.md)
4. [Chunk 4: Planning Mode — Entry Points & Integration](./free-form-chunk-4-planning-mode-integration.md)
5. [Chunk 5: Storybook & Final Polish](./free-form-chunk-5-storybook-polish.md)

Each chunk depends on the previous chunk being completed.

## Design Decisions (Unchanged)

- **Session titles:** Auto-generated from date. User can rename via overflow menu.
- **Exercise reordering:** Via "Reorder Exercises" in session overflow menu.
- **Templates:** Out of scope.
- **Mixed mode:** Free-form and structured sessions coexist.
- **Metrics:** Free-form sessions skip all review metrics. Handled by deload path.
- **Home page prominence:** Free-form is secondary when a mesocycle is active.
- **Default sets:** 1 empty set per newly added exercise.
- **Exercise completion (Active):** Done/Edit button pattern.
- **Exercise completion (Planning):** No Done/Edit — all cards stay expanded.
- **Session completion:** Requires all exercises Done + at least 1 exercise.
- **Planning mode detection:** Dedicated `/session/new` route (consistent with
  `/mesocycle/new` and `/exercise/new` patterns).
- **Planned session persistence:** Not persisted until "Save Planned Session".
