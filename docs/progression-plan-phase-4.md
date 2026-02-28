# Phase 4: Deload Detection

**Gaps Addressed:** [Gap 9](./progression-plan-overview.md#gap-9-early-deload-triggers)

**Goal:** Detect when an early deload is warranted based on fatigue indicators
and surface a recommendation to the user through the existing deload dialog.

**Depends on:** Phase 1 (CTO data available), Phase 3 (volume context)
**Unlocks:** Nothing (final phase)

---

## Gap 9: Early Deload Triggers

### Existing Infrastructure

Investigation of the codebase shows that deload **execution** is already fully
built:

| Component | Status |
|-----------|--------|
| Deload set generation (halve reps, then halve weight) | Done (`WorkoutSetService`) |
| Deload volume reduction (halve set counts) | Done (`WorkoutVolumePlanningService`) |
| Fixed deload scheduling (last microcycle) | Done (`WorkoutMesocycleService`) |
| Early deload execution (`initiateEarlyDeload`) | Done (`mesocycleMapService` in frontend) |
| Deload dialog UI (`SingletonDeloadDialog`) | Done (asks user when to start) |

**What is missing is only the detection and recommendation layer.** The system
can execute a deload at any time but never suggests one. This phase adds a
method that evaluates fatigue indicators and returns a recommendation, which
the frontend can use to trigger the existing dialog.

### New Method

Add to `WorkoutMesocycleService` (since deload detection is a mesocycle-level
concern):

```typescript
/**
 * Evaluates whether the mesocycle should trigger an early deload based on
 * fatigue indicators from recent session data.
 *
 * Should be called after each session completion. All inputs come from the
 * current mesocycle's already-loaded data (no CTO needed).
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
enum DeloadSeverity {
  None = 'None',
  Suggested = 'Suggested',
  Recommended = 'Recommended',
  Urgent = 'Urgent',
}

enum DeloadTriggerRule {
  RecoverySessionThreshold = 'RecoverySessionThreshold',
  ConsecutivePerformanceDrop = 'ConsecutivePerformanceDrop',
}

interface DeloadRecommendation {
  /** Whether a deload is recommended */
  shouldDeload: boolean;

  /**
   * Human-readable reason for the recommendation.
   * Null when shouldDeload is false.
   */
  reason: string | null;

  /**
   * Suggested = approaching threshold, user should be aware
   * Recommended = threshold met, deload is the right call
   * Urgent = multiple thresholds met, deload strongly advised
   */
  severity: DeloadSeverity;

  /** Which detection rules triggered (for transparency in the UI) */
  triggeredRules: DeloadTriggerRule[];
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
- `ratio >= 0.4 && ratio <= 0.5`: `Suggested` (approaching threshold)
- `ratio > 0.5`: `Recommended`

Note: `>=` is used for the lower bound so that the `Suggested` range is
reachable with common muscle group counts (e.g., 2/5 = 0.4 hits `Suggested`,
3/6 = 0.5 hits `Suggested`, 4/6 = 0.67 hits `Recommended`).

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
      && set.actualReps is not null
      && set.plannedReps is not null
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
- 1 exercise with consecutive drops: `Suggested`
- 2+ exercises with consecutive drops: `Recommended`

### Combining Rules

```
triggeredRules = []

if RecoverySessionThreshold triggered:
  triggeredRules.push(RecoverySessionThreshold)

if ConsecutivePerformanceDrop triggered:
  triggeredRules.push(ConsecutivePerformanceDrop)

shouldDeload = triggeredRules.length > 0

severity = match triggeredRules.length:
  0 -> None
  1 -> individual rule's severity (Suggested or Recommended)
  2 -> Urgent

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
  return { shouldDeload: false, severity: None, ... }
```

### Frontend Integration

The frontend already has both `SingletonDeloadDialog` and
`mesocycleMapService.initiateEarlyDeload()`. The integration requires two
changes:

#### 1. Extend DeloadDialogParams

The existing `DeloadDialogParams` type is:

```typescript
type DeloadDialogParams = {
  mesocycleTitle: string;
  scheduledDeloadDate: Date | null;
  onConfirm: (startDate: DeloadChoice) => Promise<void>;
};
```

Add `reason` and `severity` fields so the dialog can display why the deload
is being recommended and color-code accordingly:

```typescript
type DeloadDialogParams = {
  mesocycleTitle: string;
  scheduledDeloadDate: Date | null;
  onConfirm: (startDate: DeloadChoice) => Promise<void>;
  /** Human-readable reason for the recommendation. Null for scheduled deloads. */
  reason: string | null;
  /** Severity level for color-coding. Null for scheduled deloads. */
  severity: DeloadSeverity | null;
};
```

#### 2. Restructure Session Completion Flow

The current `handleCompleteSession()` in `SessionPage.svelte` immediately
navigates away after marking the session complete:

```typescript
function handleCompleteSession() {
  sessionMapService.updateDoc(session._id, (doc) => {
    doc.complete = true;
    doc.lastUpdatedDate = new Date();
    return doc;
  });
  goto(`/sessions`);
}
```

This needs to be restructured to run the deload check **before** navigation:

1. Mark the session complete
2. Call `shouldTriggerEarlyDeload` with the current mesocycle's recent data
3. If `shouldDeload === true`, open the `SingletonDeloadDialog` with the
   `reason` and `severity`
   - Color-code by `severity` (amber for `Suggested`, red for
     `Recommended`/`Urgent`)
   - On confirm: call `mesocycleMapService.initiateEarlyDeload()`, then
     navigate to `/sessions`
   - On dismiss: navigate to `/sessions` (the check will re-run after the
     next session)
4. If `shouldDeload === false`, navigate to `/sessions` immediately

---

## Testing Strategy

### Recovery Session Threshold Tests

- 0 of 6 muscle groups had recovery: no trigger
- 2 of 6 (33%): no trigger
- 2 of 5 (40%): `Suggested` (approaching threshold, hits `>= 0.4` boundary)
- 3 of 6 (50%): `Suggested` (approaching threshold)
- 4 of 6 (67%): `Recommended`
- 6 of 6 (100%): `Recommended`
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

- Both rules triggered: severity = `Urgent`
- Only one rule at `Recommended` level: severity = `Recommended`
- Only one rule at `Suggested` level: severity = `Suggested`
- Neither triggered: `shouldDeload = false`, severity = `None`
- Before microcycle index 2: always returns no trigger regardless of data
