# Phase 2: Autoregulated Progression

**Gaps Addressed:** [Gap 3](./progression-plan-overview.md#gap-3-autoregulated-repload-progression), [Gap 4](./progression-plan-overview.md#gap-4-mesocycle-to-mesocycle-progression-continuity)

**Goal:** Make rep and load progression respond to actual user performance
rather than applying fixed formulas, and carry performance data across mesocycle
boundaries for continuity.

**Depends on:** Phase 1 (WorkoutExerciseCTO provides cross-mesocycle data)
**Unlocks:** Phase 3 (Volume Intelligence benefits from better progression)

---

## Gap 3: Autoregulated Rep/Load Progression

### Changes to ExerciseService.calculateTargetRepsAndWeightForFirstSet

This method currently has the signature:

```typescript
static calculateTargetRepsAndWeightForFirstSet(params: {
  exercise: WorkoutExercise;
  calibration: WorkoutExerciseCalibration;
  equipment: WorkoutEquipmentType;
  microcycleIndex: number;
  firstMicrocycleRir: number;
}): { targetWeight: number; targetReps: number }
```

It applies a fixed progression formula (+2 reps or +2% weight per microcycle).
It needs to also accept the previous microcycle's actual first `WorkoutSet`
for the same exercise, and use it to adjust progression.

**New optional parameter:** Add `previousFirstSet?: WorkoutSet` to the params
object. This is the previous microcycle's completed first `WorkoutSet` for
this exercise (the existing document type, no new interface needed). It is
`null`/`undefined` for the first microcycle of a mesocycle when no
intra-mesocycle history exists (cross-mesocycle data from the CTO is handled
separately in Gap 4).

### Autoregulation Logic - Rep Progression

When `preferredProgressionType === Rep` and a previous set exists:

```
rirDelta = previousSet.rir - previousSet.plannedRir
  // negative means user was closer to failure than planned
repDelta = previousSet.actualReps - previousSet.plannedReps
  // negative means user got fewer reps than planned

surplus = repDelta + rirDelta
  // positive = user exceeded expectations
  // negative = user fell short
  // this is the same surplus calculation already used in
  //   WorkoutSessionExerciseService.getPerformanceScore
```

Decision:

| Surplus | Meaning | Action |
|---:|---|---|
| >= 3 | Significantly exceeded | Use `previousSet.actualReps + 2` as target (accelerate from actual, not planned) |
| 0 to 2 | Met or slightly exceeded | Use `previousSet.plannedReps + 2` as target (normal progression) |
| -1 to -2 | Slightly missed | Use `previousSet.plannedReps` as target (hold, don't add reps) |
| <= -3 | Significantly missed | Use `previousSet.actualReps` as target (regress to actual, don't add) |

Weight stays the same within a rep block (existing behavior). The rep range
ceiling/floor reset logic remains unchanged - when target reps exceed the max
for the rep range, reset down and bump weight by 2%.

### Autoregulation Logic - Load Progression

When `preferredProgressionType === Load` and a previous set exists:

```
surplus = (previousSet.actualReps - previousSet.plannedReps)
        + (previousSet.rir - previousSet.plannedRir)
```

Decision:

| Surplus | Action |
|---:|---|
| >= 2 | Increase weight by next equipment increment above 2% |
| 0 to 1 | Normal: increase weight by ~2% (nearest equipment weight) |
| -1 to -2 | Hold weight (no increase) |
| <= -3 | Reduce weight by minimum equipment increment |

Reps stay at the rep range maximum (existing behavior for load progression).

### When No Previous Set Exists

When there is no previous microcycle data (first microcycle of a mesocycle with
no cross-mesocycle history, or first time performing this exercise), use the
calibration-based formula. This is the only available approach when historical
performance data has not yet been generated.

### Where to Get the Previous Set

**Within a mesocycle (microcycle N -> N+1):** The previous microcycle's sets are
already available in the `WorkoutMesocyclePlanContext`. When generating
microcycle N+1, look up the first completed set for each exercise from
microcycle N's session exercises. This data is already loaded during
`generateOrUpdateMesocycle`.

**Across mesocycles (new mesocycle):** Use the `lastFirstSet` field from the
`WorkoutExerciseCTO` (Phase 1). This represents the most recent accumulation
performance from any previous mesocycle or free-form session.

---

## Gap 4: Mesocycle-to-Mesocycle Progression Continuity

### Changes to MesocycleService.generateOrUpdateMesocycle

When generating the **first microcycle** of a new mesocycle, the system
currently calculates starting weights from calibration data using the
`targetPercentage` formula:

```
targetPercentage = 85 - ((targetReps - 5) * 2.2)
startingWeight = (targetPercentage / 100) * 1RM
```

With the `WorkoutExerciseCTO`, we can check whether the exercise has prior
performance data and use it instead.

### Starting Weight Selection Algorithm

For each exercise in the new mesocycle:

```
exerciseCTO = the WorkoutExerciseCTO for this exercise
lastSet = exerciseCTO.lastFirstSet
```

**Case 1: Previous performance exists with the same rep range**

```
if lastSet is not null AND exercise.repRange has not changed:
  startingWeight = lastSet.actualWeight
  startingReps = first-microcycle rep target for this rep range
    // Determined by existing logic in calculateTargetRepsAndWeightForFirstSet
    // at microcycleIndex 0. Rep ranges: Heavy 5-15, Medium 10-20, Light 15-30.
```

The user successfully lifted `lastSet.actualWeight` during their most recent
accumulation session. After a deload, they should be able to match this weight.
Starting here is a conservative baseline that avoids both overshooting (which
would risk early burnout) and undershooting (which would waste early weeks
on suboptimal stimulus).

**Case 2: Previous performance exists but rep range changed**

```
if lastSet is not null AND exercise.repRange has changed:
  cal1RM = bestCalibration ? get1RM(bestCalibration) : 0
  set1RM = bestSet ? get1RMRaw(bestSet.actualWeight, bestSet.actualReps) : 0
  effective1RM = max(cal1RM, set1RM)
```

The existing `getTargetWeight(calibration, targetReps)` takes a full
`WorkoutExerciseCalibration`, not a raw 1RM value. Two options:

1. **Preferred:** Add a new method `getTargetWeightFrom1RM(effective1RM,
   targetReps)` that applies the same `targetPercentage` formula without
   requiring a calibration document. The consumer then rounds via
   `WorkoutEquipmentTypeService.findNearestWeight()`.
2. **Alternative:** Construct a synthetic calibration from the effective 1RM
   (weight = effective1RM, reps = 1) and pass it to the existing
   `getTargetWeight`.

Recalculating from 1RM at the new rep range is expected to produce a different
weight. This is not a violation of progressive overload - it's a different
training stimulus at an appropriate load.

**Case 3: No previous data (new exercise)**

```
if lastSet is null:
  // Same 1RM resolution as Case 2
  cal1RM = bestCalibration ? get1RM(bestCalibration) : 0
  set1RM = bestSet ? get1RMRaw(bestSet.actualWeight, bestSet.actualReps) : 0
  effective1RM = max(cal1RM, set1RM)
  startingWeight = getTargetWeightFrom1RM(effective1RM, targetReps)
    // Then round via findNearestWeight
```

Fall back to the calibration-based formula. This is the only option when
no historical performance exists.

### Integration

This logic should be added to the set generation pipeline within
`generateOrUpdateMesocycle`. When `WorkoutSetService
.generateSetsForSessionExercise` is called for the first microcycle
(`microcycleIndex === 0`), it should receive the starting weight determined by
the algorithm above rather than always computing from calibration.

For microcycles 1+ within the same mesocycle, the intra-mesocycle progression
(Gap 3's autoregulation) takes over using the previous microcycle's actual
sets.

---

## Testing Strategy

### Rep Progression Autoregulation Tests

Test each surplus scenario with concrete numbers:

- **Exceeded (surplus >= 3):** Planned 15 reps @ 3 RIR, actual 18 reps @ 3 RIR
  (surplus = 3). Next target should be 20 (18 + 2), not 17 (15 + 2).
- **Met (surplus 0-2):** Planned 15 reps @ 3 RIR, actual 15 reps @ 3 RIR
  (surplus = 0). Next target should be 17 (15 + 2). Normal progression.
- **Slightly missed (surplus -1 to -2):** Planned 15 reps @ 3 RIR, actual 14
  reps @ 2 RIR (surplus = -2). Next target should be 15 (hold).
- **Significantly missed (surplus <= -3):** Planned 15 reps @ 3 RIR, actual 12
  reps @ 1 RIR (surplus = -5). Next target should be 12 (regress to actual).

### Load Progression Autoregulation Tests

- **Exceeded:** Weight goes up by more than 2%
- **Met:** Weight goes up by ~2%
- **Missed slightly:** Weight holds
- **Missed significantly:** Weight decreases by minimum increment

### Cross-Mesocycle Continuity Tests

- Exercise used previously with same rep range: starting weight =
  previous actual weight
- Exercise used previously with different rep range: starting weight
  recalculated from effective 1RM
- New exercise: starting weight from calibration formula
- No previous data at all: uses calibration formula
- `lastFirstSet` from a deload session should never appear in the CTO (the
  query contract filters deload sessions out)

### Edge Cases

- User performed dramatically better than planned (e.g., +10 reps).
  Acceleration should still apply but should not exceed the rep range ceiling.
- User failed completely (0 actual reps). Should use a minimum of the rep range
  floor as target rather than 0.
- Weight changes from autoregulation should still go through
  `findNearestWeight` for equipment rounding.
