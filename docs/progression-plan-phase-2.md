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

This method currently accepts `microcycleIndex` and applies a fixed progression
formula (+2 reps or +2% weight per microcycle). It needs to also accept the
previous microcycle's actual first `WorkoutSet` for the same exercise, and use
it to adjust progression.

**New optional parameter:** The previous microcycle's completed first
`WorkoutSet` for this exercise (the existing document type, no new interface
needed). This is `null` for the first microcycle of a mesocycle (no previous
data within this mesocycle).

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

### Fallback When No Previous Set Exists

When there is no previous microcycle data (first microcycle of a mesocycle, or
first time performing this exercise), fall back to the current formulaic
progression. This preserves backward compatibility.

### Where to Get the Previous Set

**Within a mesocycle (microcycle N -> N+1):** The previous microcycle's sets are
already available in the `WorkoutMesocyclePlanContext`. When generating
microcycle N+1, look up the first completed set for each exercise from
microcycle N's session exercises. This data is already loaded during
`generateOrUpdateMesocycle`.

**Across mesocycles (new mesocycle):** Use the `lastFirstSet` field from the
`WorkoutExerciseCTO` (Phase 1). This represents the most recent performance
from any previous mesocycle.

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

With the `WorkoutExerciseCTO`, we can check whether the exercise was used in a
previous mesocycle and use that data instead.

### Starting Weight Selection Algorithm

For each exercise in the new mesocycle:

```
exerciseCTO = the WorkoutExerciseCTO for this exercise
lastSet = exerciseCTO.lastFirstSet
lastMesoId = exerciseCTO.lastMesocycleId
```

**Case 1: Previous mesocycle used this exercise with the same rep range**

```
if lastSet is not null
   AND lastMesoId is not null
   AND exercise.repRange has not changed:

  startingWeight = lastSet.actualWeight
  startingReps = apply normal first-microcycle rep target for this rep range
    // e.g., Heavy starts at 11, Medium at 15, Light at 21
    // (these are the same "midpoint" targets already used)

  // If the previous mesocycle completed successfully (has completedDate),
  // optionally bump weight by minimum equipment increment
  if previousMesocycleCompleted:
    startingWeight = findNearestWeight(equipmentType, startingWeight, 'up')
```

The key insight is that `lastSet.actualWeight` already reflects what the user
could handle at the START of the previous mesocycle (since `lastFirstSet` is
from the most recent session, which is typically late in the mesocycle under
peak fatigue). After a deload, the user should be able to match or slightly
exceed this weight.

Actually, a better approach: Use `lastSet.actualWeight` directly. The user
successfully lifted this weight. After a deload, they should be able to do it
again. If the previous mesocycle completed successfully, try the next weight
up. If it was abandoned, use the same weight as a conservative restart.

**Case 2: Previous mesocycle used this exercise but rep range changed**

```
if lastSet is not null
   AND lastMesoId is not null
   AND exercise.repRange has changed:

  // Recalculate from best 1RM at new rep range
  // This is expected to produce a different weight
  startingWeight = getTargetWeight(best1RM, newTargetReps, equipmentType)
```

**Case 3: No previous data (new exercise)**

```
if lastSet is null OR lastMesoId is null:

  // Fall back to calibration formula (current behavior)
  startingWeight = getTargetWeight(best1RM, targetReps, equipmentType)
```

### Integration

This logic should be added to the set generation pipeline within
`generateOrUpdateMesocycle`. Specifically, when `WorkoutSetService
.generateSetsForSessionExercise` is called for the first microcycle
(`microcycleIndex === 0`), it should receive the starting weight determined by
the algorithm above rather than always computing from calibration.

For microcycles 1+ within the same mesocycle, the intra-mesocycle progression
(Gap 3's autoregulation) takes over.

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

- Exercise used in previous mesocycle with same rep range: starting weight =
  previous actual weight (or +1 increment if completed)
- Exercise used in previous mesocycle with different rep range: starting weight
  recalculated from 1RM
- New exercise: starting weight from calibration formula
- No previous data at all: fallback to calibration formula
- Previous mesocycle was abandoned (no completedDate): use same weight, don't
  bump

### Edge Cases

- User performed dramatically better than planned (e.g., +10 reps). Acceleration
  should still apply but should not exceed the rep range ceiling.
- User failed completely (0 actual reps). Should use a minimum of 1 rep as
  target (or flag for investigation rather than auto-progressing).
- Weight changes from autoregulation should still go through
  `findNearestWeight` for equipment rounding.
