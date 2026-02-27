# Phase 1: Data Foundation

**Gaps Addressed:** [Gap 1](./progression-plan-overview.md#gap-1-dynamic-1rm-from-best-performance), [Gap 2](./progression-plan-overview.md#gap-2-cross-mesocycle-historical-performance-lookup)

**Goal:** Define two CTOs that bundle complex cross-document query results into
clean input types for core service methods, and extend 1RM calculation to use
the best data from any source.

**Depends on:** Nothing (foundational)
**Unlocks:** Phase 2 (Autoregulated Progression), Phase 3 (Volume Intelligence)

---

## CTO 1: WorkoutExerciseCTO

### Gap 1: Dynamic 1RM from Best Performance

### Gap 2: Cross-Mesocycle Historical Performance Lookup

### Purpose

This CTO bundles an exercise with its best available 1RM data (from any source)
and its most recent completed performance. It eliminates the need for core
service methods to separately accept `WorkoutExercise`,
`WorkoutExerciseCalibration`, and `WorkoutEquipmentType` parameters and then
perform expensive lookups.

### Schema

Define in `src/documents/workout/WorkoutExerciseCTO.ts` using the same Zod
extension pattern as `UserCTO`:

```typescript
import { WorkoutExerciseSchema } from './WorkoutExercise';
import { WorkoutEquipmentTypeSchema } from './WorkoutEquipmentType';
import { WorkoutSessionExerciseSchema } from './WorkoutSessionExercise';
import { WorkoutSetSchema } from './WorkoutSet';

const Best1RMSourceType = z.enum(['calibration', 'set']);

export const WorkoutExerciseCTOSchema = WorkoutExerciseSchema.extend({
  /**
   * The equipment type associated with this exercise.
   * Included so weight rounding can be performed without additional lookups.
   */
  equipmentType: WorkoutEquipmentTypeSchema,

  /**
   * The highest 1RM calculated from any source (calibrations or actual sets)
   * using the NASM formula: (weight * reps / 30.48) + weight
   */
  best1RM: z.number(),

  /** The weight used in the set/calibration that produced the best 1RM */
  best1RMWeight: z.number(),

  /** The reps performed in the set/calibration that produced the best 1RM */
  best1RMReps: z.number(),

  /** When the best 1RM was recorded */
  best1RMDate: z.date(),

  /** Whether the best 1RM came from an explicit calibration or an actual set */
  best1RMSourceType: Best1RMSourceType,

  /**
   * The most recent completed WorkoutSessionExercise for this exercise,
   * from the most recently completed mesocycle (or free-form session).
   * Null if the exercise has never been performed.
   *
   * Contains: sorenessScore, performanceScore, rsm, fatigue, setOrder, etc.
   */
  lastSessionExercise: WorkoutSessionExerciseSchema.nullable(),

  /**
   * The first WorkoutSet from the lastSessionExercise's setOrder.
   * This is the "anchor" set that progression calculations use since subsequent
   * sets are derived from the first via intra-session fatigue drops.
   * Null if no previous performance exists.
   *
   * Contains: actualWeight, actualReps, rir, plannedWeight, plannedReps,
   * plannedRir, etc.
   */
  lastFirstSet: WorkoutSetSchema.nullable(),

  /**
   * Number of sets in the lastSessionExercise (setOrder.length).
   * Useful for volume continuity without needing to query all sets.
   */
  lastSetCount: z.number().nullable(),

  /**
   * The mesocycle ID where the last performance occurred.
   * Null if the last performance was a free-form session (no mesocycle).
   * Useful for determining whether the exercise was used in the immediately
   * preceding mesocycle without additional lookups.
   */
  lastMesocycleId: z.string().uuid().nullable(),
});

export type WorkoutExerciseCTO = z.infer<typeof WorkoutExerciseCTOSchema>;
```

### Query Contract (for be-ts-db-lib)

The backend must build this CTO by:

1. Loading the `WorkoutExercise` document
2. Loading the associated `WorkoutEquipmentType`
3. Finding the best 1RM across:
   - All `WorkoutExerciseCalibration` documents for this exercise
   - All completed `WorkoutSet` documents for this exercise (where
     `actualWeight` and `actualReps` are non-null)
   - Applying the NASM formula to each and taking the maximum
4. Finding the most recent completed `WorkoutSessionExercise` for this exercise
   (where the parent `WorkoutSession.complete === true`), preferring data from
   completed mesocycles over free-form sessions when available
5. Loading the first `WorkoutSet` from that session exercise's `setOrder`
6. Determining the `lastMesocycleId` by traversing session -> microcycle ->
   mesocycle

### 1RM Calculation Change

Currently `WorkoutExerciseCalibrationService.get1RM()` only accepts a
`WorkoutExerciseCalibration`. The NASM formula itself does not need to change:

```
1RM = (weight * reps / 30.48) + weight
```

What changes is **where the inputs come from**. The CTO query (in be-ts-db-lib)
applies the formula to both calibrations and actual sets, and surfaces the
highest result. The core service method `get1RM` can remain as-is since it just
computes the formula. The CTO query is the new consumer that runs the formula
across multiple sources.

### Mesocycle Locking

When a new mesocycle is created and `calibratedExercises` needs to be populated:

- If the best 1RM source is a `calibration`: reference that calibration's ID
  as currently done
- If the best 1RM source is a `set`: auto-create a new
  `WorkoutExerciseCalibration` document from the set's `actualWeight` and
  `actualReps`, and reference that new calibration's ID

This preserves the existing locking mechanism (calibratedExercises references
calibration IDs) without schema changes.

### Integration with MesocycleService

`WorkoutMesocycleService.generateOrUpdateMesocycle()` currently accepts
separate arrays of calibrations, exercises, and equipment types, then builds
a `WorkoutMesocyclePlanContext`. Modify the method (or its context builder) to
accept `WorkoutExerciseCTO[]` instead.

The plan context already has maps for exercises, calibrations, and equipment.
These can be derived from the CTO array. Additionally, the CTO's
`lastFirstSet`, `lastSessionExercise`, `lastSetCount`, and `lastMesocycleId`
feed directly into Phase 2's autoregulated progression logic.

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
  mesocycleId: z.string().uuid(),

  /** The cycle type (MuscleGain, Cut, Resensitization, FreeForm) */
  cycleType: CycleTypeSchema,

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
  completedDate: z.date().nullable(),
});

export type MesocycleVolumeSummary = z.infer<typeof MesocycleVolumeSummarySchema>;
```

### Schema

Define in `src/documents/workout/WorkoutMuscleGroupVolumeCTO.ts`:

```typescript
export const WorkoutMuscleGroupVolumeCTOSchema = WorkoutMuscleGroupSchema.extend({
  /**
   * Volume history for this muscle group across completed mesocycles.
   * Ordered newest-first. Limited to the last 10 mesocycles to keep the CTO
   * lightweight.
   */
  mesocycleHistory: z.array(MesocycleVolumeSummarySchema),
});

export type WorkoutMuscleGroupVolumeCTO = z.infer<
  typeof WorkoutMuscleGroupVolumeCTOSchema
>;
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
      session exercises) for the `startingSetCount` (first microcycle) and
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

### WorkoutExerciseCTO Tests

Test the 1RM selection logic:
- When calibration has highest 1RM, CTO reflects calibration source
- When an actual set has highest 1RM, CTO reflects set source
- When no calibrations exist, use best set
- When no sets exist, use best calibration
- When neither exists, the CTO should still be constructable (though this
  shouldn't happen in practice since exercises must be calibrated for
  mesocycle planning)

Test the last performance lookup:
- Returns null when exercise has never been performed
- Returns data from most recent completed session
- Correctly identifies mesocycle ID from session chain
- Prefers completed mesocycle data over free-form sessions

### WorkoutMuscleGroupVolumeCTO Tests

Test aggregation:
- Correctly counts sets across exercises targeting the muscle group
- Handles primary vs secondary muscle group membership
- Correctly identifies starting vs peak set counts
- Averages RSM, soreness, performance scores correctly
- Counts recovery sessions accurately
- Limits history to 10 most recent mesocycles
- Returns empty history for new muscle groups with no mesocycle data
