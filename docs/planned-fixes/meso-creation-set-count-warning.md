# Mesocycle creation: warn when fewer exercises per muscle group inflates set count

## Report
"Visual on meso creation when the previous meso had more exercises for a muscle group than the current one, impacting set count. Give the option to adjust according to num exercises."

Context: weekly set volume per muscle group is a **total** that gets distributed across the exercises for that muscle group. If the previous meso had more exercises for a muscle group than the new one, that same total lands on fewer exercises → each exercise gets more sets (and can hit caps), distorting the plan. The user wants a visual heads-up and an option to adjust.

## How meso creation works today
- Route `/mesocycle/new` → `src/routes/(app)/mesocycle/new/+page.svelte` → `MesocyclePage` in `MesocyclePageMode.New`.
- `src/pages/MesocyclePage/MesocyclePage.svelte` is the unified new/edit form. New-mode state (`:66-88`) is **hardcoded defaults** (`cycleType=MuscleGain`, `weeks=6`, `sessionsPerWeek=5`, `calibratedExercises=[]`). **No carry-forward from any previous mesocycle exists** anywhere in `src`.
- Exercise selection: `MesocycleExercisesCard.svelte` toggles calibrated exercises bound to `formSelectedCalibrationIds`. The user does **not** set per-muscle-group set counts manually — set counts are fully computed. Muscle groups appear only as read-only badges (`MesocycleExercisesCard.svelte:124-129`).
- Live preview: `generatedMesocycle` (`:134`) → `previewResult` via `generateMesocycleChildren` (`:143-151`) → library `WorkoutMesocycleService.generateOrUpdateMesocycle`.
- **Warning pattern to mirror**: `overlapWarning` is a `$state<string|null>` computed in `MesocycleConfigCard`, synced up via `bind:overlapWarning` (`MesocyclePage.svelte:183,252`); it can block submit via `isValid` (`:187-192`). Reuse this shape.

## The set-count mechanic (root of the issue)
Chain: `generateOrUpdateMesocycle` → `WorkoutMicrocycleService.generateSessionsForMicrocycle` → **`WorkoutVolumePlanningService.calculateSetPlanForMicrocycle`** (`~/.../core-ts-db-lib/src/services/workout/util/VolumePlanning/WorkoutVolumePlanning.service.ts`).
- Per muscle group a **total** (`startVolume`) is computed then distributed evenly across the muscle group's exercises via `#distributeEvenly(totalSets, exerciseCount)` (`:386,395-399`).
- `startVolume` from `#getVolumeTargetsForMuscleGroup` (`:289-326`):
  - **With history:** `startVolume = volumeLandmark.estimatedMev` — a muscle-group total derived from `MesocycleVolumeSummary.startingSetCount`, averaged across prior mesocycles in `estimateVolumeLandmarks` (`:118-165`). This total was captured when the previous meso had N exercises.
  - **No history:** `startVolume = DEFAULT_MEV_PER_EXERCISE (2) * exerciseCount` — scales with exercise count, self-adjusts.
- In the new meso's first microcycle the historical total is spread across the new exercise count M. If M < N, each exercise gets more sets (total/M > total/N) and can hit `#MAX_SETS_PER_EXERCISE = 8` (`:52,218`) and `#MAX_SETS_PER_MUSCLE_GROUP_PER_SESSION = 10` (`:53`) — silently distorting/capping planned volume. Later microcycles carry per-exercise counts forward via `#applyHistoricalSetCounts` (`:481-519`).
- Note: `MesocycleVolumeSummary` stores set totals, **not** the historical exercise count per muscle group. The previous exercise count must be reconstructed from the previous mesocycle's `calibratedExercises`.

## Data available at the warning point
- Current per-muscle-group exercise counts: `selectedExerciseCTOs` grouped by `primaryMuscleGroups[0]` (the same key the library groups on).
- Previous meso: `mesocycleMapService.allDocs` → pick most recent by `completedDate` (fallback projected end date), excluding the one being edited → `getCTOsForCalibrationIds(meso.calibratedExercises)` (`src/util/exerciseCTOUtils.ts:14`) grouped by `primaryMuscleGroups[0]`.
- Historical MEV total per muscle group: `muscleGroupMapService.getVolumeCTO(mgId)` → `WorkoutVolumePlanningService.estimateVolumeLandmarks(cto).estimatedMev`.

## Comparison logic needed
For each primary muscle group in the current selection:
1. `currentCount` = # selected exercises with that primary muscle group.
2. `prevCount` = # exercises with that primary muscle group in the chosen previous mesocycle.
3. Flag when `prevCount > currentCount`. Optionally strengthen: compute `estimatedMev / currentCount` and only warn when it exceeds `MAX_SETS_PER_EXERCISE (8)` / the per-session cap, i.e. where the mismatch actually distorts the plan.

## Implementation plan
1. **Comparison util (app)** — new function (e.g. `src/pages/MesocyclePage/mesocycleVolumeWarningUtils.ts`): given current `selectedExerciseCTOs`, the previous meso's CTOs, and volume CTOs, return per-muscle-group `{ muscleGroupName, prevCount, currentCount, historicalMev, projectedSetsPerExercise }` for groups where `prevCount > currentCount`. Reuse `getCTOsForCalibrationIds` and `estimateVolumeLandmarks`.
2. **Pick "previous meso"** — helper over `mesocycleMapService.allDocs` (most recent by `completedDate` / projected end, excluding the current edit).
3. **Visual indicator** — mirror the `overlapWarning` pattern; render a shadcn `Alert`/callout inside or under `MesocycleExercisesCard` listing affected groups (e.g. "Back: 4 exercises previously, 2 now — sets per exercise will increase"). New-mode only (no previous meso ⇒ no warning). Advisory only (don't block `isValid`).
4. **Adjustment option** — two approaches, pick during implementation:
   - **Simplest (UI-only, recommended first):** offer to auto-add the missing exercises for that muscle group from the previous meso, restoring the exercise count so the distribution matches. Uses the existing `formSelectedCalibrationIds` binding.
   - **Deeper (library):** add a per-muscle-group set-count override so the historical MEV total is scaled to the new exercise count instead of distributed as-is. Requires plumbing an override into `#getVolumeTargetsForMuscleGroup` and a new schema field — larger surface, touches `@aneuhold/core-ts-db-lib`. Only do this if the UI-only option isn't acceptable.

## Key files
- App: `src/pages/MesocyclePage/MesocyclePage.svelte`, `MesocycleExercisesCard.svelte`, `mesocyclePageUtils.ts`, `MesocycleConfigCard.svelte` (warning-pattern reference), `src/util/exerciseCTOUtils.ts`, `src/services/documentMapServices/MuscleGroupMap.service.svelte.ts`, `src/services/documentMapServices/MesocycleMap.service.svelte.ts`.
- Library (mostly read-only unless doing the deeper option): `services/workout/util/VolumePlanning/WorkoutVolumePlanning.service.ts`, `services/workout/Microcycle/WorkoutMicrocycle.service.ts`, `services/workout/Mesocycle/WorkoutMesocyclePlanContext.ts`, `ctos/workout/WorkoutMuscleGroupVolumeCTO.ts`, `embedded-types/workout/MesocycleVolumeSummary.ts`, `documents/workout/WorkoutMesocycle.ts`.

## Worktree note
Independent — app-side UI + util, no overlap with the other fixes unless the deeper library override is chosen.

## Before done
Run `pnpm lint --fix`, `pnpm check`, `pnpm test`. If the library is changed, follow `~/Development/GithubRepos/ts-libs/.github/copilot-instructions.md`, add tests, wait ~6s for propagation.
