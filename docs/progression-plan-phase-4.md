# Phase 4: Deload Detection

**Gaps Addressed:** [Gap 9](./progression-plan-overview.md#gap-9-early-deload-triggers)

**Goal:** Detect when an early deload is warranted based on fatigue indicators,
rather than only scheduling deloads at the fixed last microcycle position.

**Depends on:** Phase 1 (CTO data available), Phase 3 (volume context)
**Unlocks:** Nothing (final phase)

---

## Gap 9: Early Deload Triggers

### New Method

Add to `WorkoutMesocycleService` (since deload detection is a mesocycle-level
concern):

```typescript
/**
 * Evaluates whether the mesocycle should trigger an early deload based on
 * fatigue indicators from recent session data.
 *
 * This should be called after each session completion. All inputs come from
 * the current mesocycle's already-loaded data (no CTO needed).
 *
 * @param currentMicrocycleIndex - The index of the current microcycle
 * @param recentSessionExercises - Session exercises from the last 2
 *   microcycles (current + previous)
 * @param recentSets - Sets from the last 2 microcycles
 * @param trainedMuscleGroupIds - All muscle group IDs trained in this
 *   mesocycle
 * @param exerciseToMuscleGroupMap - Maps exercise IDs to primary muscle
 *   group IDs
 */
shouldTriggerEarlyDeload(
  currentMicrocycleIndex: number,
  recentSessionExercises: WorkoutSessionExercise[],
  recentSets: WorkoutSet[],
  trainedMuscleGroupIds: UUID[],
  exerciseToMuscleGroupMap: Map<UUID, UUID[]>
): DeloadRecommendation
```

### DeloadRecommendation Type

```typescript
interface DeloadRecommendation {
  /** Whether a deload is recommended */
  shouldDeload: boolean;

  /**
   * Human-readable reason for the recommendation.
   * Null when shouldDeload is false.
   */
  reason: string | null;

  /**
   * 'suggested' = approaching threshold, user should be aware
   * 'recommended' = threshold met, deload is the right call
   * 'urgent' = multiple thresholds met, deload strongly advised
   */
  severity: 'none' | 'suggested' | 'recommended' | 'urgent';

  /** Which detection rules triggered (for transparency in the UI) */
  triggeredRules: DeloadTriggerRule[];
}

enum DeloadTriggerRule {
  RecoverySessionThreshold = 'RecoverySessionThreshold',
  ConsecutivePerformanceDrop = 'ConsecutivePerformanceDrop',
}
```

### Detection Rules

#### Rule 1: Recovery Session Threshold

**Trigger:** More than 50% of trained muscle groups had at least one session
exercise marked `isRecoveryExercise === true` in the last 2 microcycles.

**Algorithm:**

```
recoveryMuscleGroups = new Set()

for each sessionExercise in recentSessionExercises:
  if sessionExercise.isRecoveryExercise === true:
    exerciseId = sessionExercise.workoutExerciseId
    muscleGroupIds = exerciseToMuscleGroupMap.get(exerciseId)
    for each mgId in muscleGroupIds:
      recoveryMuscleGroups.add(mgId)

ratio = recoveryMuscleGroups.size / trainedMuscleGroupIds.length

if ratio > 0.5:
  trigger RecoverySessionThreshold
```

**Severity mapping:**
- `ratio > 0.4 && ratio <= 0.5`: `'suggested'` (approaching threshold)
- `ratio > 0.5`: `'recommended'`

#### Rule 2: Consecutive Performance Drops

**Trigger:** For any exercise, actual reps fell 3+ below planned reps in 2 or
more consecutive sessions across the last 2 microcycles.

**Algorithm:**

```
for each unique exerciseId in recentSessionExercises:
  sessionsForExercise = recentSessionExercises
    .filter(se => se.workoutExerciseId === exerciseId)
    .sortBySessionDate(ascending)

  consecutiveDrops = 0

  for each sessionExercise in sessionsForExercise:
    firstSet = recentSets.find(set =>
      set._id === sessionExercise.setOrder[0]
      && set.actualReps !== null
      && set.plannedReps !== null
    )

    if firstSet is null:
      consecutiveDrops = 0
      continue

    deficit = firstSet.plannedReps - firstSet.actualReps

    if deficit >= 3:
      consecutiveDrops++
    else:
      consecutiveDrops = 0

    if consecutiveDrops >= 2:
      trigger ConsecutivePerformanceDrop for this exercise
      break
```

**Severity mapping:**
- 1 exercise with consecutive drops: `'suggested'`
- 2+ exercises with consecutive drops: `'recommended'`

### Combining Rules

```
triggeredRules = []

if RecoverySessionThreshold triggered:
  triggeredRules.push(RecoverySessionThreshold)

if ConsecutivePerformanceDrop triggered:
  triggeredRules.push(ConsecutivePerformanceDrop)

shouldDeload = triggeredRules.length > 0

severity = match triggeredRules.length:
  0 -> 'none'
  1 -> check individual severity (could be 'suggested' or 'recommended')
  2 -> 'urgent'

reason = build string from triggered rules
  e.g., "Recovery sessions needed for 4 of 6 muscle groups in the last 2
  weeks, and bench press has dropped 5+ reps below target for 2 consecutive
  sessions."
```

### Guard: Minimum Microcycle Threshold

Do not trigger early deload before microcycle index 2 (the third microcycle).
The first two microcycles are still in the "finding MEV" phase, and performance
variation is expected. Early fluctuations should not cause premature deloads.

```
if currentMicrocycleIndex < 2:
  return { shouldDeload: false, severity: 'none', ... }
```

### What Happens When Deload Is Accepted

When the frontend displays a deload recommendation and the user accepts:

1. Mark the current microcycle as the last accumulation microcycle
2. Regenerate remaining microcycles as deload microcycles (using the existing
   deload logic in `WorkoutSetService.generateSetsForSessionExercise`)
3. The mesocycle's total microcycle count effectively shrinks

This reuses the existing deload generation logic - no new deload calculation is
needed. The only new part is the TRIGGER detection.

### Frontend Integration Notes

The frontend should call `shouldTriggerEarlyDeload` after each session is
marked complete. If `shouldDeload === true`:

- Display a dialog or banner with the `reason` text
- Color-code by `severity` (amber for suggested, red for recommended/urgent)
- Offer the user two choices:
  1. "Start Deload" - triggers mesocycle regeneration with remaining weeks as
     deload
  2. "Continue Training" - dismisses for now (can re-trigger after next session)

The decision is always the user's. The system advises but does not force.

---

## Testing Strategy

### Recovery Session Threshold Tests

- 0 of 6 muscle groups had recovery: no trigger
- 2 of 6 (33%): no trigger
- 3 of 6 (50%): `'suggested'` (approaching threshold)
- 4 of 6 (67%): `'recommended'`
- 6 of 6 (100%): `'recommended'`
- Muscle groups counted correctly through exercise -> muscle group mapping
- Same muscle group with multiple recovery exercises only counted once

### Consecutive Performance Drop Tests

- Exercise with 1 session below by 3 reps: no trigger (need 2 consecutive)
- Exercise with 2 consecutive sessions below by 3 reps: trigger
- Exercise with 2 non-consecutive sessions below by 3 reps: no trigger
  (must be consecutive)
- Exercise where deficit is exactly 3: triggers (>= 3, not > 3)
- Exercise where deficit is 2: no trigger
- Multiple exercises each with 2 consecutive drops: severity escalates
- Sets without actual data (not completed): reset consecutive counter

### Combined Rule Tests

- Both rules triggered: severity = `'urgent'`
- Only one rule at `'recommended'` level: severity = `'recommended'`
- Only one rule at `'suggested'` level: severity = `'suggested'`
- Neither triggered: `shouldDeload = false`, severity = `'none'`
- Before microcycle index 2: always returns no trigger regardless of data

### Deload Acceptance Tests

- After accepting deload: remaining microcycles regenerated as deload type
- Deload sets use existing half-reps/half-weight logic (no new calculation)
- Mesocycle microcycle count reflects the shortened accumulation
