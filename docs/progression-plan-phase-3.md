# Phase 3: Volume Intelligence

**Gaps Addressed:** [Gap 5](./progression-plan-overview.md#gap-5-mev-detection-from-initial-rsm-scores), [Gap 6](./progression-plan-overview.md#gap-6-volume-landmark-estimation-over-time), [Gap 7](./progression-plan-overview.md#gap-7-recovery-session-return-logic), [Gap 8](./progression-plan-overview.md#gap-8-cycle-type-specific-progression-rules)

**Goal:** Improve volume planning with MEV detection, historical landmark
estimation, recovery session return logic, and cycle-type-specific progression
rules.

**Depends on:** Phase 1 (WorkoutMuscleGroupVolumeCTO provides historical data)
**Unlocks:** Phase 4 (Deload Detection uses volume context)

**Pipeline entry point:** `generateOrUpdateMesocycle` already accepts the
mesocycle as its first argument and exercise CTOs (Phase 1). It should
additionally accept `WorkoutMuscleGroupVolumeCTO[]` for the muscle groups
trained in this mesocycle. The `WorkoutMesocyclePlanContext` should store
these CTOs (or a derived map of muscle group ID -> volume CTO) so that volume
planning methods can access historical landmarks without additional lookups.

---

## Gap 5: MEV Detection from Initial RSM Scores

### Changes to WorkoutVolumePlanningService

Add a method that evaluates whether the first microcycle's volume was at MEV
for a given muscle group:

```typescript
/**
 * Evaluates MEV proximity for a muscle group based on RSM scores from the
 * first microcycle. Called when generating the second microcycle (after the
 * first is complete) to adjust the volume baseline.
 *
 * @param muscleGroupId - The muscle group to evaluate
 * @param firstMicrocycleSessionExercises - All completed session exercises
 *   from the first microcycle
 * @param exerciseToMuscleGroupMap - Maps exercise IDs to their primary
 *   muscle group IDs
 */
evaluateMevProximity(
  muscleGroupId: UUID,
  firstMicrocycleSessionExercises: WorkoutSessionExercise[],
  exerciseToMuscleGroupMap: Map<UUID, UUID[]>
): MevProximityResult
```

### MevProximityResult Type

```typescript
interface MevProximityResult {
  /** 'below' = RSM 0-3, 'at' = RSM 4-6, 'above' = RSM 7-9 */
  proximity: 'below' | 'at' | 'above';

  /**
   * Recommended total set adjustment for this muscle group.
   * Positive = add sets, negative = remove sets, 0 = no change.
   * Range: -2 to +4
   */
  recommendedSetAdjustment: number;

  /** The average RSM across session exercises targeting this muscle group */
  averageRsm: number;
}
```

### Algorithm

1. Filter `firstMicrocycleSessionExercises` to those whose exercise ID maps to
   the target `muscleGroupId` via `exerciseToMuscleGroupMap`
2. For each matching session exercise, compute RSM total using
   `WorkoutSFRService.getRsmTotal(sessionExercise.rsm)`. This returns
   `number | null` - skip session exercises where it returns `null`.
3. Average across all matching session exercises that have RSM data
4. Apply the table (use `Math.floor()` on the average to determine the
   bracket, e.g., average of 3.7 -> bracket 0-3 -> `'below'`):

**Note:** `WorkoutSFRService.getRsmTotal()` already exists and computes
`mindMuscleConnection + pump + disruption`. Reuse it rather than
reimplementing.

| Average RSM | Proximity | Set Adjustment |
| ----------: | --------- | -------------: |
|         0-3 | `'below'` |             +3 |
|         4-6 | `'at'`    |              0 |
|         7-9 | `'above'` |             -2 |

### Integration with MesocycleService

When `generateOrUpdateMesocycle` generates microcycle index 1 (the second
microcycle), and microcycle index 0 is complete with RSM data:

1. Call `evaluateMevProximity` for each muscle group
2. Apply `recommendedSetAdjustment` to the baseline set count for that muscle
   group before the normal soreness/performance set-addition logic runs

This is a one-time adjustment. After this, the existing
`getRecommendedSetAdditionsOrRecovery` drives weekly adjustments.

### When to Skip

If `firstMicrocycleSessionExercises` have no RSM data (user didn't fill out
the RSM fields), skip this check and use the default baseline.

---

## Gap 6: Volume Landmark Estimation Over Time

### New Method on WorkoutVolumePlanningService

```typescript
/**
 * Estimates MEV, MRV, and MAV for a muscle group based on historical data
 * across completed mesocycles.
 *
 * @param volumeCTO - The WorkoutMuscleGroupVolumeCTO containing mesocycle
 *   history for this muscle group
 */
estimateVolumeLandmarks(
  volumeCTO: WorkoutMuscleGroupVolumeCTO
): VolumeLandmarkEstimate
```

### VolumeLandmarkEstimate Type

```typescript
enum VolumeLandmarkConfidence {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

interface VolumeLandmarkEstimate {
  /** Estimated minimum effective volume (sets per muscle group per session) */
  estimatedMev: number;

  /** Estimated maximum recoverable volume */
  estimatedMrv: number;

  /** Estimated maximum adaptive volume (midpoint) */
  estimatedMav: number;

  /**
   * Confidence based on amount of historical data.
   * Low = 0-1 mesocycles, Medium = 2-3 mesocycles, High = 4+ mesocycles
   */
  confidence: VolumeLandmarkConfidence;
}
```

### Algorithm

Using the `mesocycleHistory` array from the `WorkoutMuscleGroupVolumeCTO`:

**Estimated MEV:**

1. Look at the `startingSetCount` across all mesocycle summaries where
   `avgRsm >= 4` (indicating the starting volume was effective)
2. Average these starting set counts
3. If no mesocycles had `avgRsm >= 4`, use the minimum `startingSetCount`
   across all mesocycles, or default to 2 if no history exists

**Estimated MRV:**

1. Look for mesocycles where `avgPerformanceScore >= 2.5` (approaching score 3,
   meaning performance started declining) or `recoverySessionCount > 0`
2. Use the `peakSetCount` from those mesocycles as the MRV indicator
3. Average across available data
4. If no mesocycle ever hit performance issues, use the highest `peakSetCount`
   across all mesocycles + 2 as a rough upper bound
5. Hard cap: 10 sets per muscle group per session (from existing constants)
6. Default to 8 if no history exists

**Estimated MAV:**

```
estimatedMav = Math.ceil((estimatedMev + estimatedMrv) / 2)
```

**Confidence:**

- `mesocycleHistory.length <= 1`: `Low`
- `mesocycleHistory.length <= 3`: `Medium`
- `mesocycleHistory.length >= 4`: `High`

### Integration

Volume landmark estimates are used by:

- **Gap 5** (MEV detection): When confidence is `Medium` or `High`, use
  `estimatedMev` as the starting set count instead of the hardcoded default
  of 2. When confidence is `Low`, continue using the default and rely on the
  RSM-based MEV proximity check (Gap 5) to adjust after the first microcycle.
- **Gap 7** (Recovery return): Provides the midpoint for restart volume.
- **Gap 8** (Cycle-type progression): Provides the volume ceiling for cut
  mesocycles.
- **WorkoutVolumePlanningService.calculateBaselineSetCount**: When confidence
  is `Medium` or `High`, use `estimatedMev` as the starting set count instead
  of the hardcoded 2. Note: this method is currently `private static` and will
  need its visibility changed (or the volume landmark data threaded in through
  its callers).

---

## Gap 7: Recovery Session Return Logic

### Changes to WorkoutVolumePlanningService

The existing logic in `getSetCountForExercise` already handles the
`isRecoveryExercise` case by cutting sets in half. What's missing is the
**return logic**: what set count to use in the microcycle AFTER a recovery
session.

Add awareness of recovery-to-normal transitions:

```typescript
/**
 * Calculates the set count to resume at after a recovery session.
 *
 * @param estimatedMev - From VolumeLandmarkEstimate (or fallback)
 * @param estimatedMrv - From VolumeLandmarkEstimate (or fallback)
 */
getRecoveryReturnSetCount(
  estimatedMev: number,
  estimatedMrv: number
): number
```

### Algorithm

```
returnSetCount = Math.ceil((estimatedMev + estimatedMrv) / 2)
```

This is deliberately the midpoint (MAV), not back to MEV or to the volume
where the user was before the recovery session. The reasoning from the book:
returning to MEV wastes stimulus capacity. Returning to the pre-recovery volume
risks hitting MRV again immediately. The midpoint balances these concerns.

### Fallback When No Volume Landmark Data

When `estimatedMev` and `estimatedMrv` come from `Low` confidence estimates:

- `estimatedMev` = starting set count of the current mesocycle for this muscle
  group (this is already a MEV approximation since the mesocycle should start
  near MEV)
- `estimatedMrv` = the hard cap from existing constants
  (`MAX_SETS_PER_EXERCISE = 8` or `MAX_SETS_PER_MUSCLE_GROUP_PER_SESSION = 10`)
- Midpoint = `Math.ceil((startingSetCount + hardCap) / 2)`

### Integration

In `getSetCountForExercise` (or its caller in the volume planning pipeline):

1. Check if the previous microcycle's session exercise for this exercise had
   `isRecoveryExercise === true`
2. If yes, use `getRecoveryReturnSetCount(estimatedMev, estimatedMrv)` instead
   of the normal progression calculation
3. From that point forward, resume normal set progression (+1 per microcycle,
   adjusted by soreness/performance)

Load stays unchanged after recovery (the book says keep weight the same, only
volume changes).

---

## Gap 8: Cycle-Type-Specific Progression Rules

### Changes to WorkoutVolumePlanningService

The set progression rate needs to vary by `CycleType`. Currently, the volume
planning service adds ~1 set per muscle group per microcycle uniformly.

The `cycleType` is available from the `WorkoutMesocycle` document that is
already the first argument to `generateOrUpdateMesocycle`. It should be
threaded down, or used from the MesocyclePlanContext, in the volume planning methods.

### Cut Cycle Modifications

| Parameter                  | MuscleGain                     | Cut                                                        |
| -------------------------- | ------------------------------ | ---------------------------------------------------------- |
| Set progression rate       | +1 set/muscle group/microcycle | +0.5 (alternate which session exercises get the extra set) |
| Default accumulation weeks | 5                              | 6-7                                                        |
| RIR start                  | 4                              | 3                                                          |
| Volume ceiling             | estimated MRV                  | estimated MAV (don't push to MRV)                          |

**Implementation:** Apply a `progressionMultiplier` of `0.5` for Cut cycles.
When the multiplier produces a fractional set addition (e.g., +0.5), alternate
between adding and not adding across microcycles. One approach: add a set only
on even-indexed microcycles, or only to the session exercise with the best SFR.

**Starting RIR:** When `cycleType === Cut`, start at RIR 3 instead of 4. The
RIR progression array becomes `[3, 2, 1, 1, 0, 0, null]` (longer accumulation
with more weeks spent at lower RIR, plus deload). This requires changing
`FIRST_MICROCYCLE_RIR` on `WorkoutMesocyclePlanContext` (currently hardcoded
to `4`) to be configurable based on cycle type. The RIR calculation in
`generateOrUpdateMesocycle` uses `4 - rirForMicrocycle` where
`rirForMicrocycle = Math.min(microcycleIndex, 4)` - this formula also needs
to use the cycle-type-specific starting RIR.

### Resensitization Cycle Modifications

| Parameter          | MuscleGain                 | Resensitization                       |
| ------------------ | -------------------------- | ------------------------------------- |
| Set count          | Progressive (2 -> 6+)      | Flat (2-3 per session exercise)       |
| Rep range          | Mixed (Heavy/Medium/Light) | User-selected (suggest Heavy to user) |
| Volume progression | +1/microcycle              | None (flat)                           |
| Duration           | 5 accumulation + 1 deload  | 3-4 weeks, no deload                  |

**Implementation:** When `cycleType === Resensitization`:

1. In `calculateBaselineSetCount`: return a flat count of 2-3 sets per session
   exercise, regardless of microcycle index. No set addition logic runs.
2. In `MesocycleService`: set total microcycle count to 3-4 and **skip the
   deload microcycle**. Currently, the code always makes the last microcycle
   a deload via `deloadMicrocycleIndex = totalMicrocycles - 1`. For
   resensitization, either set `deloadMicrocycleIndex` to `-1` (never
   matches) or add a `skipDeload` flag to the generation loop. All 3-4
   microcycles should be accumulation microcycles.
3. RIR stays at 3-4 throughout (no taper to 0, since the goal is to reduce
   fatigue, not push limits).

**Note on exercise selection:** The system does not control which exercises the
user picks for a mesocycle. For resensitization, the UI can suggest that the
user select Heavy rep range exercises (and the mesocycle creation screen could
display a hint), but the system plans whatever exercises the user chooses. If
they pick Medium or Light exercises, the flat MV-level volume still applies.

### MuscleGain (No Changes)

Current behavior is correct for MuscleGain. No modifications needed.

### FreeForm (No Changes)

No automatic recommendations. `generateOrUpdateMesocycle` already exits early
for FreeForm. No modifications needed.

---

## Testing Strategy

### MEV Detection Tests

- RSM average of 2.0 across first microcycle -> returns `'below'` with
  adjustment +3
- RSM average of 5.0 -> returns `'at'` with adjustment 0
- RSM average of 8.0 -> returns `'above'` with adjustment -2
- Mixed RSM scores that average to boundary values (3.5, 6.5)
- Session exercises with no RSM data -> skip (return null or default)
- Only considers session exercises matching the target muscle group

### Volume Landmark Tests

- No history (0 mesocycles): returns defaults (MEV=2, MRV=8, confidence=Low)
- 1 mesocycle with good data: returns estimates from that single data point
- 3 mesocycles with consistent patterns: returns averaged estimates
- Mesocycle where recovery sessions were needed: MRV estimated near that
  volume
- Mesocycle with declining performance: MRV estimated near that peak
- Never hit performance issues: MRV = highest peak + 2

### Recovery Return Tests

- After recovery with good landmark data: returns midpoint of MEV and MRV
- After recovery with no historical data: returns midpoint of starting count
  and hard cap
- Return set count is always >= MEV estimate
- Return set count is always <= MRV estimate
- Load stays unchanged (only volume changes)

### Cycle-Type Tests

- **Cut:** Set progression is half the rate of MuscleGain. 6-7 accumulation
  weeks. RIR starts at 3.
- **Resensitization:** Flat set count per session exercise (no progression).
  3-4 weeks total. No deload microcycle generated.
- **MuscleGain:** Unchanged from current behavior.
- **FreeForm:** Early exit preserved (no plan generated).
- Verify that `cycleType` from the mesocycle document propagates correctly
  through the generation pipeline to volume planning and RIR arrays.
