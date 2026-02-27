# Phase 1: Data Foundation

**Gaps Addressed:** [Gap 1](./progression-plan-overview.md#gap-1-dynamic-1rm-from-best-performance), [Gap 2](./progression-plan-overview.md#gap-2-cross-mesocycle-historical-performance-lookup)

**Goal:** Define two CTOs that bundle complex cross-document query results into
clean input types for core service methods. Extend 1RM tracking to
automatically capture new personal bests from actual set performance.

**Depends on:** Nothing (foundational)
**Unlocks:** Phase 2 (Autoregulated Progression), Phase 3 (Volume Intelligence)

---

## Schema Change: WorkoutExerciseCalibration

### New Field: `associatedWorkoutSetId`

Add a nullable UUID field to `WorkoutExerciseCalibrationSchema`:

```typescript
export const WorkoutExerciseCalibrationSchema = z.object({
  ...BaseDocumentWithTypeSchema.shape,
  ...RequiredUserIdSchema.shape,
  ...BaseDocumentWithUpdatedAndCreatedDatesSchema.shape,
  docType: z
    .literal(WorkoutExerciseCalibration_docType)
    .default(WorkoutExerciseCalibration_docType),
  workoutExerciseId: z.uuidv7().transform((val) => val as UUID),
  exerciseProperties: z.record(z.string(), z.unknown()).nullish(),
  reps: z.int().positive(),
  weight: z.number(),
  dateRecorded: z.date().default(() => new Date()),

  /**
   * When populated, this calibration was auto-created from an actual set
   * that produced a higher 1RM than any existing calibration for this
   * exercise. The ID references the WorkoutSet that generated it.
   *
   * When null, this calibration was manually entered by the user.
   */
  associatedWorkoutSetId: z
    .uuidv7()
    .transform((val) => val as UUID)
    .nullish()
});
```

### Auto-Creation Logic

When a mesocycle concludes (completedDate is set) or a free-form session
completes:

1. For each exercise that was performed, find the completed set with the
   highest calculated 1RM (using the NASM formula:
   `(weight * reps / 30.48) + weight`)
2. Find the existing calibration with the highest 1RM for that exercise
3. If the best set's 1RM exceeds the best calibration's 1RM (or no calibration
   exists), auto-create a new `WorkoutExerciseCalibration` with:
   - `weight` = the set's `actualWeight`
   - `reps` = the set's `actualReps`
   - `dateRecorded` = the session's `startTime`
   - `associatedWorkoutSetId` = the set's `_id`
   - `workoutExerciseId` = the exercise ID
   - `exerciseProperties` = copied from the set's `exerciseProperties`

This means:

- Calibrations accumulate organically as the user gets stronger
- The number of auto-created calibrations is low (only when a new best is
  achieved)
- The user gets a clean historical record of their progression milestones
- The existing mesocycle locking mechanism (`calibratedExercises` referencing
  calibration IDs) works without changes
- Calibrations do NOT need to be created at mesocycle creation time - the
  latest best calibration already exists from prior completions

---

## CTO 1: WorkoutExerciseCTO

### Gap 1: Dynamic 1RM from Best Performance

### Gap 2: Cross-Mesocycle Historical Performance Lookup

### Purpose

This CTO bundles an exercise with its best calibration, best set, equipment
type, and most recent accumulation performance. It eliminates the need for core
service methods to separately accept `WorkoutExercise`,
`WorkoutExerciseCalibration`, and `WorkoutEquipmentType` parameters and then
perform expensive lookups.

### Schema

Define in `src/ctos/workout/WorkoutExerciseCTO.ts`:

```typescript
import { WorkoutExerciseSchema } from './WorkoutExercise';
import { WorkoutEquipmentTypeSchema } from './WorkoutEquipmentType';
import { WorkoutExerciseCalibrationSchema } from './WorkoutExerciseCalibration';
import { WorkoutSessionExerciseSchema } from './WorkoutSessionExercise';
import { WorkoutSetSchema } from './WorkoutSet';

export const WorkoutExerciseCTOSchema = z.object({
  ...WorkoutExerciseSchema.shape,

  /**
   * The equipment type associated with this exercise.
   * Included so weight rounding can be performed without additional lookups.
   */
  equipmentType: WorkoutEquipmentTypeSchema,

  /**
   * The WorkoutExerciseCalibration with the highest calculated 1RM for this
   * exercise. Includes both manually-entered calibrations and auto-created
   * ones (from best sets). Null if no calibrations exist.
   */
  bestCalibration: WorkoutExerciseCalibrationSchema.nullable(),

  /**
   * The completed WorkoutSet with the highest calculated 1RM for this
   * exercise, across all sessions ever performed. Null if the exercise has
   * never been performed.
   *
   * This may or may not match the set that generated bestCalibration. It
   * provides the raw source data for 1RM comparison.
   */
  bestSet: WorkoutSetSchema.nullable(),

  /**
   * The most recent completed WorkoutSessionExercise for this exercise,
   * from a non-deload accumulation session. Deload sessions (where all sets
   * have plannedRir === null) are excluded since their halved weights/reps
   * are not meaningful baselines for progression.
   *
   * Null if the exercise has never been performed in an accumulation session.
   *
   * Contains: sorenessScore, performanceScore, rsm, fatigue, setOrder, etc.
   */
  lastSessionExercise: WorkoutSessionExerciseSchema.nullable(),

  /**
   * The first WorkoutSet from the lastSessionExercise's setOrder.
   * This is the "anchor" set that progression calculations use since
   * subsequent sets are derived from the first via intra-session fatigue
   * drops.
   *
   * Null if no previous accumulation performance exists.
   */
  lastFirstSet: WorkoutSetSchema.nullable()
});

export type WorkoutExerciseCTO = z.infer<typeof WorkoutExerciseCTOSchema>;
```

### Query Contract (for be-ts-db-lib)

The backend must build this CTO by:

1. Loading the `WorkoutExercise` document
2. Loading the associated `WorkoutEquipmentType` via `workoutEquipmentTypeId`
3. Finding `bestCalibration`: query all `WorkoutExerciseCalibration` documents
   for this exercise, calculate 1RM for each using the NASM formula, and return
   the one with the highest result
4. Finding `bestSet`: query all completed `WorkoutSet` documents for this
   exercise (where `actualWeight` and `actualReps` are non-null), calculate
   1RM for each, and return the one with the highest result
5. Finding `lastSessionExercise`: find the most recent completed
   `WorkoutSessionExercise` for this exercise where:
   - The parent `WorkoutSession.complete === true`
   - The session exercise is NOT a deload exercise (i.e., not all of its sets
     have `plannedRir === null`)
6. Finding `lastFirstSet`: load the first `WorkoutSet` from
   `lastSessionExercise.setOrder`

### How Services Use bestCalibration vs bestSet

The consumer determines the effective 1RM by comparing:

```typescript
const cal1RM = cto.bestCalibration
  ? WorkoutExerciseCalibrationService.get1RM(cto.bestCalibration)
  : 0;
const set1RM = cto.bestSet
  ? WorkoutExerciseCalibrationService.get1RMRaw(
      cto.bestSet.actualWeight!,
      cto.bestSet.actualReps!
    )
  : 0;
const effective1RM = Math.max(cal1RM, set1RM);
```

**Method note:** `get1RM(calibration)` takes a full
`WorkoutExerciseCalibration` document. `get1RMRaw(weight, reps)` takes raw
numbers and is the correct method for computing 1RM from a `WorkoutSet`'s
actual values. Both apply the same NASM formula internally.

### Migration from CalibrationExercisePair

The codebase currently uses a `CalibrationExercisePair` type (defined in
`WorkoutExerciseCalibration.ts`) throughout 7 files including
`WorkoutMesocyclePlanContext`, `WorkoutVolumePlanningService`,
`WorkoutSessionService`, and `WorkoutMicrocycleService`. This type bundles
`{ calibration, exercise }`.

The `WorkoutExerciseCTO` is a superset of `CalibrationExercisePair` - it
spreads the exercise fields and includes `bestCalibration` (which serves the
same role as `calibration`), plus additional fields. During implementation:

1. Update `WorkoutMesocyclePlanContext` to derive its internal maps from
   `WorkoutExerciseCTO[]` instead of separate `CalibrationExercisePair[]`,
   exercises, and equipment arrays
2. Methods that currently accept `CalibrationExercisePair` can be updated to
   accept `WorkoutExerciseCTO` since it contains the same data
3. The `CalibrationExercisePair` type can be removed once all consumers are
   migrated

### CTO File Location

CTOs are not documents (they are not stored in the database). They should be
defined in a new `src/ctos/workout/` directory in core-ts-db-lib, not in
`src/documents/workout/`. Similarly, the `MesocycleVolumeSummary` embedded
type goes in the existing `src/embedded-types/workout/` directory.

### Integration with MesocycleService

`WorkoutMesocycleService.generateOrUpdateMesocycle()` currently accepts
separate arrays of calibrations, exercises, and equipment types, then builds
a `WorkoutMesocyclePlanContext`. Modify the method (or its context builder) to
accept `WorkoutExerciseCTO[]` instead.

The plan context already has maps for exercises, calibrations, and equipment.
These can be derived from the CTO array. Additionally, the CTO's
`lastFirstSet` and `lastSessionExercise` feed directly into Phase 2's
autoregulated progression logic.

---

## CTO 2: WorkoutMuscleGroupVolumeCTO

### Purpose

This CTO bundles a muscle group with its per-mesocycle volume history. It
enables volume landmark estimation (Gap 6), recovery session return logic
(Gap 7), and cycle-type volume adjustments (Gap 8) without core service methods
needing to query across mesocycles.

### Embedded Type: MesocycleVolumeSummary

Define in `src/embedded-types/workout/MesocycleVolumeSummary.ts`:

```typescript
export const MesocycleVolumeSummarySchema = z.object({
  /** The mesocycle these stats are from */
  mesocycleId: z.uuidv7().transform((val) => val as UUID),

  /** The cycle type (MuscleGain, Cut, Resensitization, FreeForm) */
  cycleType: z.enum(CycleType),

  /**
   * Total sets for this muscle group in the first microcycle.
   * Approximates the starting volume (roughly MEV if calibrated correctly).
   */
  startingSetCount: z.number(),

  /**
   * Maximum total sets for this muscle group in any single microcycle.
   * Approximates the peak volume reached (approaching MRV).
   */
  peakSetCount: z.number(),

  /** Average RSM across all session exercises targeting this muscle group */
  avgRsm: z.number().nullable(),

  /** Average soreness score (0-3) across all session exercises */
  avgSorenessScore: z.number().nullable(),

  /** Average performance score (0-3) across all session exercises */
  avgPerformanceScore: z.number().nullable(),

  /**
   * How many session exercises for this muscle group were marked as
   * recovery (isRecoveryExercise = true) during this mesocycle.
   */
  recoverySessionCount: z.number(),

  /** When the mesocycle was completed. Null if not yet completed. */
  completedDate: z.date().nullable()
});

export type MesocycleVolumeSummary = z.infer<typeof MesocycleVolumeSummarySchema>;
```

### Schema

Define in `src/ctos/workout/WorkoutMuscleGroupVolumeCTO.ts`:

```typescript
export const WorkoutMuscleGroupVolumeCTOSchema = z.object({
  ...WorkoutMuscleGroupSchema.shape,

  /**
   * Volume history for this muscle group across completed mesocycles.
   * Ordered newest-first. Limited to the last 10 mesocycles to keep the CTO
   * lightweight.
   */
  mesocycleHistory: z.array(MesocycleVolumeSummarySchema)
});

export type WorkoutMuscleGroupVolumeCTO = z.infer<typeof WorkoutMuscleGroupVolumeCTOSchema>;
```

### Query Contract (for be-ts-db-lib)

The backend must build this CTO by:

1. Loading the `WorkoutMuscleGroup` document
2. For each completed mesocycle (up to the last 10):
   a. Find all `WorkoutExercise` documents that have this muscle group in
   `primaryMuscleGroups` or `secondaryMuscleGroups`
   b. Find all `WorkoutSessionExercise` documents referencing those exercises
   within this mesocycle's microcycles/sessions
   c. Count total sets per microcycle (sum of `setOrder.length` across
   session exercises) for `startingSetCount` (first microcycle) and
   `peakSetCount` (max across microcycles)
   d. Average RSM totals (sum of mindMuscleConnection + pump + disruption)
   e. Average soreness scores and performance scores
   f. Count session exercises where `isRecoveryExercise === true`
   g. Record the mesocycle's `completedDate`

### Integration with Phase 3 Services

This CTO is passed into volume planning methods that need historical context:

- Volume landmark estimation (Gap 6): uses `mesocycleHistory` to derive
  MEV/MRV estimates
- Recovery session return logic (Gap 7): uses estimated MEV/MRV for midpoint
  calculation
- Cycle-type progression (Gap 8): uses historical peak set counts to calibrate
  cut mesocycle ceilings

---

## Testing Strategy

### WorkoutExerciseCalibration Auto-Creation Tests

- When a set produces a higher 1RM than any existing calibration: a new
  calibration is created with `associatedWorkoutSetId` populated
- When a set's 1RM is equal to or less than the best calibration: no new
  calibration is created
- When no calibrations exist for an exercise: first qualifying set creates one
- Auto-created calibration has correct weight, reps, date, and exercise
  properties from the source set
- Multiple exercises in the same session: each evaluated independently

### WorkoutExerciseCTO Tests

Test the best calibration/set selection:

- When calibration has highest 1RM, `bestCalibration` is populated
- When an actual set has highest 1RM, `bestSet` is populated
- Both can be non-null simultaneously (consumer compares them)
- When no calibrations exist, `bestCalibration` is null
- When no sets exist, `bestSet` is null

Test the last performance lookup:

- Returns null when exercise has never been performed
- Returns data from the most recent completed accumulation session
- Skips deload sessions (where all sets have `plannedRir === null`)
- `lastFirstSet` matches the first entry in `lastSessionExercise.setOrder`

### WorkoutMuscleGroupVolumeCTO Tests

Test aggregation:

- Correctly counts sets across exercises targeting the muscle group
- Handles primary vs secondary muscle group membership
- Correctly identifies starting vs peak set counts
- Averages RSM, soreness, performance scores correctly
- Counts recovery sessions accurately
- Limits history to 10 most recent mesocycles
- Returns empty history for new muscle groups with no mesocycle data
