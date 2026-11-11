# Mesocycle creation: per-muscle-group starting set count override

## Report

"Visual on meso creation when the previous meso had more exercises for a muscle group than the current one, impacting set count. Give the option to adjust according to num exercises."

Weekly set volume per muscle group is a **total** that the planner spreads across that muscle group's exercises. When the new mesocycle has fewer exercises for a muscle group than past ones, the same total is spread across fewer exercises, so each exercise gets more sets (and can hit the per-exercise cap). The fix is to let the user override the starting set total for a muscle group on a mesocycle, so the plan matches the exercises they actually picked.

## Where the library work happens

All `ts-libs` changes for this plan are made in the worktree at `/Users/aneuhold/Development/GithubRepos/ts-libs-wt-AddConfigurableTargetForMuscleGroups` (branch `AddConfigurableTargetForMuscleGroups`). Do not edit `~/Development/GithubRepos/ts-libs`.

- Follow `/Users/aneuhold/Development/GithubRepos/ts-libs-wt-AddConfigurableTargetForMuscleGroups/.claude/CLAUDE.md`, and read its `docs/dev-tooling.md` before running `pnpm watch` or `local-npm`.
- Run `pnpm watch` (or `pnpm --filter @aneuhold/core-ts-db-lib watch`) from the worktree so the locally published `@aneuhold/core-ts-db-lib` comes from the worktree, not the main checkout.
- If this app worktree is not yet subscribed, run `pnpm sub:core-ts-db-lib` here once. After each library edit, wait about 6 seconds for the rebuild and publish before relying on it in the app.

## How the starting set total is computed today

Chain: `WorkoutMesocycleService.generateOrUpdateMesocycle` → `WorkoutMicrocycleService.generateSessionsForMicrocycle` → `WorkoutVolumePlanningService.calculateSetPlanForMicrocycle` (`packages/core-ts-db-lib/src/services/workout/util/VolumePlanning/WorkoutVolumePlanning.service.ts:79`).

- Exercises are grouped by `primaryMuscleGroups[0]` in `WorkoutMesocyclePlanContext.#buildSessionCTOMaps`.
- `#getVolumeTargetsForMuscleGroup` (`:287-324`) picks `startVolume` per muscle group:
  - With history: `volumeLandmark.estimatedMev`, the average `MesocycleVolumeSummary.startingSetCount` from past mesocycles. It does not account for how many exercises those mesocycles had.
  - Without history: `#DEFAULT_MEV_PER_EXERCISE (2) * exerciseCount`.
  - Resensitization (`progressionInterval === 0`) uses the same starting value, held flat.
- `#calculateBaselineSetCounts` (`:343-385`) adds progression on top of `startVolume` and splits the total with `#distributeEvenly` (`:393-397`). Each exercise is capped at `#MAX_SETS_PER_EXERCISE = 8` (`:52`).
- Once a microcycle has logged data, `#applyHistoricalSetCounts` (`:469-507`) carries per-exercise counts forward, so the starting total only drives microcycles that have no prior logged microcycle in the mesocycle (in practice, the first one).
- `startingSetCount` in `MesocycleVolumeSummary` is aggregated by `WorkoutMuscleGroupRepository` (`be-ts-db-lib`) as the first microcycle's set count. An override therefore flows into future MEV estimates on its own; no repository change is needed.

## Library changes (`ts-libs` worktree)

### 1. Schema field on `WorkoutMesocycle`

Add to `WorkoutMesocycleSchema` (`src/documents/workout/WorkoutMesocycle.ts`):

```ts
/**
 * Overrides for the starting set total, keyed by muscle group ID. The value is the total sets
 * for that muscle group in the first microcycle. A muscle group with no key uses the starting
 * volume estimated from history, or the per-exercise default.
 *
 * Only affects microcycles planned without logged data from an earlier microcycle in this
 * mesocycle; after that, logged set counts carry forward.
 */
muscleGroupStartingSetCounts: z.record(UUIDSchema, z.int().positive()).default({})
```

- Keying by muscle group ID makes duplicates impossible, so no validator change is needed in `be-ts-db-lib`. Keys for muscle groups that have no exercises in the mesocycle (including deleted muscle groups) are ignored by the planner.
- `.default({})` keeps existing documents valid with no migration.
- Confirm in a schema test that `UUIDSchema` works as the record key (it has a transform to the branded `UUID` type) so the inferred type is `Record<UUID, number>`.

### 2. Volume planning

In `WorkoutVolumePlanningService`:

- Add public static `getDefaultStartingSetCount(volumeLandmark: WorkoutVolumeLandmarkEstimate | undefined, exerciseCount: number)`, returning `estimatedMev` when the landmark has history, otherwise `#DEFAULT_MEV_PER_EXERCISE * exerciseCount`. This is the value an override replaces, so the app can show it as the default. `#getVolumeTargetsForMuscleGroup` uses it for both the flat (Resensitization) and progressing branches instead of computing the start value inline.
- `#calculateSetCountForEachExerciseInMuscleGroup` reads the override from `context.mesocycle.muscleGroupStartingSetCounts[primaryMuscleGroupId]` and passes it to `#getVolumeTargetsForMuscleGroup`. No new map on `WorkoutMesocyclePlanContext` is needed.
- `#getVolumeTargetsForMuscleGroup` behavior with an override:
  - `startVolume` is the override.
  - Resensitization: `endVolume` equals the override (flat).
  - Otherwise `endVolume` comes from landmarks or per-exercise defaults as today, then is raised to `startVolume + 1` if it is not above `startVolume` (the existing guard, applied to both branches).
- The per-exercise cap and per-session cap stay as they are; an override larger than `8 * exerciseCount` still caps per exercise.

### 3. Tests

- `WorkoutVolumePlanning.service.spec.ts`: override replaces the starting total with and without history; Resensitization stays flat at the override; `endVolume` is raised above an override that meets or exceeds it; per-exercise cap still applies; muscle groups without an override are unchanged; a key for a muscle group with no exercises has no effect; `getDefaultStartingSetCount` for both branches.
- `WorkoutMesocycle.service.spec.ts`: end to end, a mesocycle with an override generates the expected first-microcycle set counts, and later microcycles with logged data carry forward instead of using the override.

Use the existing test helpers in the package.

### 4. Release and backend

- `gcloud-backend` validates with `WorkoutMesocycleSchema`. Zod strips unknown keys, so `muscleGroupStartingSetCounts` is dropped on save until the backend runs the new library version. Bump `core-ts-db-lib` with `pnpm preparePkg` in the ts-libs worktree (it propagates the version to `be-ts-db-lib`), then update `gcloud-backend` to the new versions before shipping the app change.
- Run `pnpm check`, `pnpm test`, and `pnpm lint` in the ts-libs worktree.

## Frontend (app)

**Placeholder: to be designed after the library changes are implemented.**

What the UI can work with once the library is done:

- `muscleGroupStartingSetCounts` on the mesocycle form state in `src/pages/MesocyclePage/MesocyclePage.svelte` (new and edit modes).
- `WorkoutVolumePlanningService.getDefaultStartingSetCount` with `muscleGroupMapService.getVolumeCTO(mgId)` → `estimateVolumeLandmarks` to show the default each override replaces.
- The live preview (`generatedMesocycle` → `generateMesocycleChildren`) already reflects overrides once they are on the mesocycle passed in.
- The previous mesocycle's exercise count per muscle group can be derived from its `calibratedExercises` via `getCTOsForCalibrationIds` (`src/util/exerciseCTOUtils.ts`), if the UI should point out where an override is likely needed.

## Scope decisions

- Only the starting total is overridable. With the default progression (`USE_VOLUME_LANDMARK_PROGRESSION = false`), `endVolume` is never read: each microcycle's baseline is `startVolume + ceil(microcycleIndex / progressionInterval)`, and after the first microcycle, logged set counts plus SFR-based additions drive volume. The starting total sets the whole trajectory.
- Overrides do not carry over. A new mesocycle starts with an empty `muscleGroupStartingSetCounts`.

## Before done

- ts-libs worktree: `pnpm check`, `pnpm test`, `pnpm lint`.
- This app: `pnpm lint --fix`, `pnpm check`, `pnpm test`.
