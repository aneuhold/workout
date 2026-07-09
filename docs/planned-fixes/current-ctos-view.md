# "See your current CTOs" view

## Report + clarification
Original: "Add ability to see basically your current CTOs."

Clarified with user: build **both** —
1. a **per-exercise** summary (best set, last session performance, estimated 1RM), and
2. a **per-muscle-group volume** view (recent set volume + estimated MEV/MRV/MAV landmarks).

## What "CTO" is
Not a training metric. In this codebase CTO is an internal data-bundle abstraction (like a DTO) that bundles a root document with related documents so services avoid cross-document lookups. See `~/Development/GithubRepos/ts-libs/packages/core-ts-db-lib/src/ctos/workout/WorkoutExerciseCTO.ts:11-15,87`. Three CTO types exist: `UserCTO`, `WorkoutExerciseCTO`, `WorkoutMuscleGroupVolumeCTO`.

## The data and where it lives

### Per-exercise: `WorkoutExerciseCTO`
`~/.../core-ts-db-lib/src/ctos/workout/WorkoutExerciseCTO.ts` bundles per exercise:
- `bestCalibration` (highest calculated 1RM) — 1RM via `WorkoutExerciseCalibrationService.get1RM(bestCalibration)`.
- `bestSet` (best set ever).
- `lastSessionExercise` + `lastSessionSets` ("what did I do last time").
- `lastAccumulationSessionExercise` + `lastAccumulationSessionSets` (progression baseline).
- `equipmentType`, plus all `WorkoutExercise` fields (name, muscle groups).

Already loaded client-side: `src/services/documentMapServices/ExerciseMap.service.svelte.ts:32` (`exerciseCTOs`, all) and `:58` (`getCTO(exerciseId)`). Already surfaced piecemeal in `ExercisePageViewMode.svelte`, `SessionPageExerciseCard.svelte:45`, `LibraryPageExerciseCard.svelte:53`.

### Per-muscle-group: `WorkoutMuscleGroupVolumeCTO`
`~/.../core-ts-db-lib/src/ctos/workout/WorkoutMuscleGroupVolumeCTO.ts`:
- `mesocycleHistory: MesocycleVolumeSummary[]` (last 10 mesocycles: set counts, RSM/soreness/performance averages, recovery counts).
- Feeds `WorkoutVolumeLandmarkEstimate` (estimated MEV / MRV / MAV) via `WorkoutVolumePlanningService.estimateVolumeLandmarks(cto)` (static, already exported).

Loaded via `ctoGet` in `src/util/workoutPersistenceUtils.ts:57` (`exerciseCTOs`, `muscleGroupVolumeCTOs`). App accessor: `src/services/documentMapServices/MuscleGroupMap.service.svelte.ts` (`allVolumeCTOs` / `getVolumeCTO(mgId)`).

## Since the data is already loaded, this is mostly a read-only presentation task.

## Implementation plan
1. **New route/page** — copy an existing route folder per repo conventions (`src/routes/(app)/<name>/`, matching `pageInfo.ts`, and a branch in `src/pages/SBFullApp/SBFullAppRouter.svelte`). Candidate name: `/insights` or `/status`. Confirm entry point (nav item vs a section link).
2. **Muscle-group volume section** — iterate `muscleGroupMapService.allVolumeCTOs`; per muscle group show recent set volume (from `mesocycleHistory`) and the estimated MEV/MRV/MAV from `estimateVolumeLandmarks`. This is the strongest fit for "where am I right now."
3. **Per-exercise section** — iterate `exerciseMapService.exerciseCTOs`; per exercise show estimated 1RM (`get1RM(bestCalibration)`), best set, and last session performance. Reuse existing display patterns from `ExercisePageViewMode.svelte` / `LibraryPageExerciseCard.svelte` to avoid duplicating formatting.
4. **Layout** — two sections on one screen (muscle-group first, then per-exercise), or tabbed. Keep CSS minimal per repo conventions; use shadcn-svelte cards/accordion already in the project.
5. **Storybook** — add a story per repo conventions; if the page needs seeded CTO data, build a `SB<Name>Example.svelte` wrapper.

## Key files
- App: `src/services/documentMapServices/ExerciseMap.service.svelte.ts`, `src/services/documentMapServices/MuscleGroupMap.service.svelte.ts`, `src/util/workoutPersistenceUtils.ts`, existing display refs `src/pages/ExercisePage/ExercisePageViewMode.svelte`, `src/pages/LibraryPage/LibraryPageExerciseCard.svelte`, plus new route under `src/routes/(app)/` and page under `src/pages/`.
- Library (read-only reference): `ctos/workout/WorkoutExerciseCTO.ts`, `ctos/workout/WorkoutMuscleGroupVolumeCTO.ts`, `services/workout/util/VolumePlanning/WorkoutVolumePlanning.service.ts` (`estimateVolumeLandmarks`), `services/workout/WorkoutExerciseCalibration.service.ts` (`get1RM`), `embedded-types/workout/MesocycleVolumeSummary.ts`.

## Open questions to resolve during implementation
- Entry point: standalone nav item, or a section on Home / Mesocycle page? (Data is already loaded either way.)
- Sort/filter: per-exercise list could be long — decide default sort (recently trained? by muscle group?) and whether to group exercises under their muscle group.

## Worktree note
Fully independent — new files plus a router branch. No overlap with the other fixes.

## Before done
Run `pnpm lint --fix`, `pnpm check`, `pnpm test`.
