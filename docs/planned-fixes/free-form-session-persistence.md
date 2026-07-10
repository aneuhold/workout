# Free-form session: targets / RIR not saving + multi-add exercise data loss

## Problem

Two independent bugs in a free-form session:

1. Editing a set's weight / reps / RIR and tapping off does not save.
2. Adding more than one exercise at once persists only the last one; the rest silently vanish
   on the next fetch.

Runtime verification (live backend, active free-form session):

- Edit weight target then blur: no `POST /project/workout`, and the value is gone after reload.
- Add Set (single): fires `POST /project/workout` (201) and survives reload.
- Log a set: fires `POST /project/workout` (201) and the actuals survive reload.
- Add two exercises at once: fires one `POST /project/workout` (201), but only one exercise
  survives logout/login. Confirmed by inspecting the request body (see below).

## Findings

### Targets / RIR — confirmed trigger bug (fix here)

The numeric inputs only save in Planning mode. In an Active free-form session the change is dropped:

- `SessionPageSetRow.svelte:159-162` (weight) and `:183-186` (reps):
  `onchange={() => { if (mode === SessionPageMode.Planning) onPlannedChange?.(weight, reps); }}`
  The mode guard means an Active-mode edit fires nothing.
- The RIR input (`SessionPageSetRow.svelte:204-211`) has no `onchange` in any mode. RIR entered
  during a workout is only captured if the user hits Log; a plain edit-and-blur is lost.
- Related gap: the RIR input is hidden when `mode === Planning` (`SessionPageSetRow.svelte:191`),
  so `plannedRir` cannot be entered from the set row while planning at all.

The save chain, once triggered, is correct and immediate:
`onPlannedChange` → `handlePlannedChange` (`SessionPageExerciseCard.svelte:104-114`) →
`setMapService.updateDoc` → `DocumentMapStore.service.svelte.ts` `updateManyDocs` →
`persistToLocalData` + `persistToDb` → `WorkoutAPIService.queryApi`. No debounce.

### Multi-add exercise — confirmed data-loss bug (fix here)

Adding N exercises at once only persists the last one. Single add, add-set, and log all work
(one insert per doctype, no overwrite).

Root cause is the persistence-options accumulator overwriting a per-doctype key instead of merging.
`createWorkoutPrepareForSave` (`src/util/workoutPersistenceUtils.ts:20-35`):

```js
if (info.insert) {
  options.insert = { ...options.insert, [key]: info.insert };  // replaces the array, does not merge
}
```

`addExercisesToSession` (`SessionMap.service.svelte:229-264`) calls `prepareDocsForSave` once per
exercise inside the loop, so each iteration replaces `options.insert.sessionExercises` (and
`.sets`) with just the current exercise. Only the last survives in the payload. The
`sessionExerciseOrder` update lists every ID, but the earlier exercises are never inserted.
Locally every exercise shows (each iteration writes to the local map), so it looks fine until a
fetch walks the order array, cannot find the never-inserted exercises, and drops them
(`getDocsWithIds` filters missing IDs).

Verified request body for a two-exercise add: `insert.sessionExercises` and `insert.sets` each
contained a single doc (the second exercise), while `update.sessions[0].sessionExerciseOrder`
listed both IDs. After logout/login only the second exercise remained.

This is a distinct trigger/batching bug, not the sync layer. The queue reliability issues in
`docs/planned-fixes/sync-and-save-reliability.md` are real but separate and do not cause this.

#### Decided fix — call site only

Fix the call sites, not `createWorkoutPrepareForSave` / `prepareDocsForSave`. The overwrite is
intentional: `prepareDocsForSave` is meant to set an entire doctype's operation in one shot, so a
later call can replace an earlier one. Making the accumulator merge would break that contract. The
bug is calling it repeatedly for the same doctype inside a loop; the caller should build the full
array first and call once per doctype.

Two call sites do this and both must be fixed:

- `addExercisesToSession` (`src/services/documentMapServices/SessionMap.service.svelte.ts:229-264`):
  collect all new `sessionExercise`s and all new `set`s into arrays in the loop, then call
  `sessionExerciseMapService.prepareDocsForSave({ insert: allSessionExercises }, apiOptions)` and
  `setMapService.prepareDocsForSave({ insert: allSets }, apiOptions)` once, after the loop.
- `moveMesocycle` cascade (`src/services/documentMapServices/MesocycleMap.service.svelte.ts:444-472`):
  the cascade loop calls `prepareDocsForSave` for mesocycles / microcycles / sessions once per
  subsequent mesocycle, overwriting each prior iteration and the primary mesocycle set at :444-446.
  Accumulate the primary plus every subsequent mesocycle / microcycle / session into arrays, then
  call `prepareDocsForSave` once per doctype after the loop.

All other `prepareDocsForSave` call sites were audited and are correct (each touches a given
doctype + operation at most once per `apiOptions` object; `batchChildDocSaves` is fine).

Verify after the fix: adding 2+ exercises at once, then logout/login, keeps all of them
(request body's `insert.sessionExercises` should contain every added exercise); a cascading
mesocycle move persists the shift on the primary and all subsequent mesocycles.

## Fix direction (targets / RIR only)

- Make weight/reps/RIR save on change (blur/commit) in Active mode as well, routing to the planned
  target fields (`plannedWeight` / `plannedReps` / `plannedRir`). The Active-mode inputs already
  display `actual ?? planned`, and the Log flow owns actuals, so an in-workout edit before logging
  is a target edit.
- Cleanest shape: replace the two Planning-gated `onchange` handlers and the untracked RIR input
  with one `onFieldChange(field, value)` callback the row raises on commit; the parent maps it to
  the correct planned field. This also gives RIR a save path.
- Every edit saves the moment it commits. No navigation/lifecycle flush.

## Key files

- `SessionPageSetRow.svelte` — the mode-gated weight/reps `onchange` and the handler-less RIR input.
- `SessionPageExerciseCard/SessionPageExerciseCard.svelte` — `handlePlannedChange`, the target save handler.
- `SessionPageExerciseCard/SessionPageExerciseCardSetTable.svelte` — `onPlannedChange` prop plumbing.
- `src/util/workoutPersistenceUtils.ts` — `createWorkoutPrepareForSave` accumulator (multi-add root cause).
- `src/services/documentMapServices/SessionMap.service.svelte.ts` — `addExercisesToSession` loop (multi-add call site).

## Before done

Run `pnpm lint --fix`, `pnpm check`, `pnpm test`.
