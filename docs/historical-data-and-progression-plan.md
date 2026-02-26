# Historical Data Recall & Rep Progression Plan

This plan covers what still needs to be added or changed in the core logic
(`@aneuhold/core-ts-db-lib`) and the workout app to correctly implement the
book's strategies for rep progression, historical data usage, and autoregulated
planning.

---

## Current State Summary

### What's Already Implemented

| Feature | Service | Status |
|---------|---------|--------|
| 1RM estimation (NASM formula) | `ExerciseCalibrationService` | Done |
| Target weight from %1RM | `ExerciseCalibrationService` | Done |
| Rep progression (+2 reps/microcycle) | `ExerciseService` | Done |
| Load progression (+2% weight/microcycle) | `ExerciseService` | Done |
| Intra-session fatigue drops (-2 reps/set) | `SetService` | Done |
| Volume baseline (2 sets + 1/microcycle) | `VolumePlanningService` | Done |
| Volume adjustment from soreness/performance table | `VolumePlanningService` | Done |
| RIR progression (4 -> 3 -> 2 -> 1 -> 0) | `MesocycleService` | Done |
| Performance scoring (actual vs planned) | `SessionExerciseService` | Done |
| Set addition recommendations | `SessionExerciseService` | Done |
| Deload handling (half reps, then half weight) | `SetService` | Done |
| Session distribution (fatigue-aware ordering) | `MicrocycleService` | Done |
| Mesocycle generation/regeneration | `MesocycleService` | Done |
| RSM/Fatigue/SFR calculation | `SFRService` | Done |
| Equipment weight rounding | `EquipmentTypeService` | Done |

### What's Missing

The gaps below fall into two broad themes:

1. **No historical data lookup across mesocycles** - the system generates plans
   from calibration data and formulas but never asks "what happened last time?"
2. **No autoregulation feedback loop** - actual user performance doesn't feed
   back into future planning beyond the soreness/performance set-addition table
   within a single mesocycle.

---

## Gap Analysis & Implementation Plan

### Gap 1: Cross-Mesocycle Historical Performance Lookup

**Book Reference:** pg. 160-161, Phase Potentiation chapter, README `setOrder`
note

**Problem:** When generating a new mesocycle with the same exercises, the system
starts from calibration data and the `targetPercentage` formula. It never looks
at the user's actual ending performance in the previous mesocycle. The book says:
start at or below the previous mesocycle's ending weight, and build back up.

**What to Build:**

Create a `WorkoutHistoricalDataService` with these methods:

```
getLastPerformanceForExercise(
  exerciseId: UUID,
  beforeDate: Date,
  allSets: WorkoutSet[],
  allSessionExercises: WorkoutSessionExercise[],
  allSessions: WorkoutSession[]
): HistoricalExercisePerformance | null
```

Returns the most recent completed session-exercise data for a given exercise
before a date, including:
- Last actual weight, reps, RIR (from the first set of the last session)
- Average performance score across the last microcycle
- Average soreness score across the last microcycle
- Number of sets in the last microcycle for that exercise
- The SFR for that exercise in the last mesocycle (averaged)

```
getExerciseProgressionHistory(
  exerciseId: UUID,
  mesocycleCount: number,
  allMesocycles: WorkoutMesocycle[],
  ...related documents
): ExerciseProgressionEntry[]
```

Returns an array of per-mesocycle summaries showing how the exercise performed
over time (starting weight, ending weight, starting reps, ending reps, total
sets per week, average SFR, etc.).

```
getMuscleGroupVolumeHistory(
  muscleGroupId: UUID,
  mesocycleCount: number,
  ...related documents
): MuscleGroupVolumeEntry[]
```

Returns per-mesocycle volume totals for a muscle group (total effective sets per
week at peak, average SFR, soreness patterns, performance patterns). This is
crucial for estimating MEV and MRV over time.

**Integration Point:** `MesocycleService.generateOrUpdateMesocycle()` should
call `getLastPerformanceForExercise` when historical data exists and use it to
set starting weights instead of purely using calibration + formula. The logic:

1. If previous mesocycle data exists for this exercise (same exercise ID):
   - Start at the previous mesocycle's **Week 1 weight** (not ending weight,
     which was at peak fatigue)
   - If the previous mesocycle was completed successfully, consider bumping by
     the minimum increment
   - Use the previous mesocycle's starting rep count as a baseline for rep
     progression
2. If no previous data exists, fall back to calibration + `targetPercentage`
   formula (current behavior)

**Priority:** High - this is the single biggest gap

---

### Gap 2: Actual Performance Feeding Into Next Microcycle's Rep/Load Targets

**Book Reference:** pg. 58-61 (Accumulation Phase), README "Rep Progression"
and "Load Progression" sections

**Problem:** Currently, rep and load progression are purely formulaic:
- Rep progression: +2 reps/microcycle regardless of actual performance
- Load progression: +2% weight/microcycle regardless of actual performance

The book says progression should be autoregulated: if the user exceeded targets,
they may progress normally or even faster. If they fell short, hold or regress.
The key rule is: "add only enough to allow at least the same reps, at the same
or slightly lower RIR, with at least four weeks of accumulation being the goal."

**What to Change:**

Modify `ExerciseService.calculateTargetRepsAndWeightForFirstSet()` to accept an
optional `previousActualPerformance` parameter:

```typescript
interface PreviousPerformance {
  actualReps: number;
  actualWeight: number;
  actualRir: number;
  plannedReps: number;
  plannedWeight: number;
  plannedRir: number;
}
```

New logic:

**For Rep Progression:**
- If user hit or exceeded planned reps at planned RIR: apply normal +2 reps
- If user hit planned reps but at lower RIR than planned (e.g., hit 15 reps but
  at 1 RIR instead of planned 3 RIR): hold reps the same, don't add 2. The
  fatigue indicates the user is near their limit at this weight.
- If user missed planned reps: use actual reps as the baseline (don't add +2
  from planned, add +2 from actual, or even hold at actual)
- If user significantly exceeded (3+ reps over plan at same or higher RIR):
  use actual reps as baseline, progress from there

**For Load Progression:**
- If user hit targets: apply normal +2% weight increase
- If user hit targets at lower RIR than planned: hold weight, don't increase
- If user missed targets: hold weight or reduce by minimum increment
- If user significantly exceeded: consider larger weight jump (next equipment
  increment above 2%)

**Integration Point:** `MesocycleService` already passes `microcycleIndex` when
generating sets. It needs to also look up actual performance from the previous
microcycle's completed sets and pass that to `calculateTargetRepsAndWeightForFirstSet`.

**Priority:** High - directly affects the quality of weekly progression

---

### Gap 3: MEV Detection from Initial RSM Scores

**Book Reference:** pg. 50-53, Accumulation Phase section in README

**Problem:** The book prescribes using RSM scores from the first 2-3 sessions to
determine if starting volume is at MEV. No service implements this.

| Total RSM Score | Proximity to MEV | Action |
|---:|---|---|
| 0-3 | Below MEV | Increase volume next week by 2-4 sets |
| 4-6 | At or just above MEV (ideal start) | Progress normally |
| 7-9 | Between MEV and MRV | Drop volume next week |

**What to Build:**

Add a method to `VolumePlanningService`:

```
evaluateMevProximity(
  muscleGroupId: UUID,
  firstMicrocycleSessionExercises: WorkoutSessionExercise[],
  exerciseToMuscleGroupMap: Map<UUID, UUID[]>
): MevProximityResult
```

This aggregates RSM scores across all session exercises in the first microcycle
that target a given muscle group, averages them, and returns:
- `proximity`: `'below'` | `'at'` | `'above'`
- `recommendedSetAdjustment`: number (e.g., +3, 0, -2)
- `averageRsm`: number

**Integration Point:** When `generateOrUpdateMesocycle` regenerates from the
second microcycle onward (after the first microcycle is complete), it should
call `evaluateMevProximity` and apply the recommended set adjustment to the
volume plan for subsequent microcycles. This adjusts the baseline before the
normal soreness/performance progression kicks in.

**Priority:** Medium - improves initial volume calibration significantly

---

### Gap 4: Early Deload Triggers

**Book Reference:** pg. 100, 110-112, Fatigue Management section in README

**Problem:** The system schedules deloads at a fixed position (last microcycle).
The book says deload should also trigger early when:
- More than half of muscle groups required a recovery session in the last 2 weeks
- Performance drops of 3+ reps from target across 2+ consecutive sessions
- Illness lasting more than 3 days

**What to Build:**

Add to `MesocycleService` or a new `WorkoutDeloadDetectionService`:

```
shouldTriggerEarlyDeload(
  currentMicrocycleIndex: number,
  recentSessionExercises: WorkoutSessionExercise[],
  recentSets: WorkoutSet[],
  muscleGroupCount: number,
  exerciseToMuscleGroupMap: Map<UUID, UUID[]>
): DeloadRecommendation
```

Returns:
- `shouldDeload`: boolean
- `reason`: string (for UI display)
- `severity`: `'suggested'` | `'recommended'` | `'urgent'`

Detection rules:
1. Count muscle groups where `isRecoveryExercise` was true in last 2
   microcycles. If > 50% of all trained muscle groups, trigger deload.
2. For each exercise, check if actual reps fell 3+ below planned reps for 2+
   consecutive sessions. If this happens across multiple exercises, trigger
   deload.
3. (Future/UI) Allow user to flag illness, which triggers deload after 3+ days.

**Integration Point:** The frontend should call this after each session
completion and display a banner/dialog if deload is recommended. If the user
accepts, the system regenerates remaining microcycles as deload microcycles.

**Priority:** Medium - important safety feature

---

### Gap 5: Recovery Session Execution & Return Logic

**Book Reference:** pg. 101-111 (Fatigue Management)

**Problem:** The `isRecoveryExercise` field exists on `WorkoutSessionExercise`
and the `VolumePlanningService` cuts sets in half for recovery exercises. But
there's no complete logic for:
- Transitioning back from a recovery session
- The "restart at midpoint between MEV and MRV" rule
- Suggesting which muscle groups need recovery sessions

**What to Build:**

Add to `VolumePlanningService`:

```
getRecoveryRecommendations(
  muscleGroupId: UUID,
  recentSessionExercises: WorkoutSessionExercise[],
  currentSetCount: number,
  estimatedMev: number,
  estimatedMrv: number
): RecoveryRecommendation
```

Returns:
- `needsRecovery`: boolean
- `returnSetCount`: number (midpoint between MEV and MRV estimates)
- `reason`: string

The "midpoint between MEV and MRV" requires volume landmark estimates. Since
exact MEV/MRV are hard to know, use heuristics:
- Estimated MEV: the starting set count of the current mesocycle (since that's
  where the user calibrated to roughly MEV at start)
- Estimated MRV: the maximum set count the user successfully completed without
  performance drops in any previous mesocycle for this muscle group (from Gap
  1's `getMuscleGroupVolumeHistory`)
- Midpoint: `(estimatedMev + estimatedMrv) / 2`, rounded up

After a recovery session, the next non-recovery session should restart at the
midpoint set count and resume normal progression from there.

**Priority:** Medium

---

### Gap 6: Cycle-Type-Specific Progression Rules

**Book Reference:** pg. 220-221 (Cutting), pg. 181-191 (Phase Potentiation),
pg. 194 (Resensitization)

**Problem:** `CycleType` enum has `MuscleGain`, `Resensitization`, `Cut`, and
`FreeForm`, but the progression logic treats all non-FreeForm types identically.

**What to Change:**

**For `CycleType.Cut`:**
- Slower set progression: instead of +1 set per muscle group per microcycle,
  use +0.5 (alternate which exercises get the extra set each week)
- Longer target mesocycle: 6-8 weeks accumulation instead of 5
- Stay closer to MEV: don't push volume as aggressively
- Same RIR progression but potentially start at 3 RIR instead of 4

Modify `VolumePlanningService.getBaselineSetCount()` to accept `cycleType` and
apply a `cutProgressionMultiplier` of 0.5 to the set addition rate.

**For `CycleType.Resensitization`:**
- Use MV-level training (very low volume: 2-3 sets per muscle group total)
- Bias toward 5-10 rep range (heavier weight, lower volume)
- Frequency can drop to 1-2x per week per muscle group
- No volume progression (flat across all microcycles)
- Shorter duration: 3-4 weeks total, no deload needed

Modify `MesocycleService.generateOrUpdateMesocycle()` to detect
`Resensitization` and use a flat volume plan with heavy rep range bias.

**For `CycleType.MuscleGain`:**
- Current behavior is correct for this type (the default)
- No changes needed

**Priority:** Medium - important for correct periodization across phases

---

### Gap 7: Frequency Adjustment Recommendations Between Mesocycles

**Book Reference:** pg. 133-145 (Exercise Frequency)

**Problem:** No service analyzes soreness healing patterns to recommend frequency
changes for the next mesocycle.

**What to Build:**

Add to `WorkoutHistoricalDataService`:

```
getFrequencyRecommendation(
  muscleGroupId: UUID,
  completedMesocycleSessionExercises: WorkoutSessionExercise[],
  currentFrequency: number,
  sessionsPerMicrocycle: number
): FrequencyRecommendation
```

Algorithm:
1. For each microcycle, check the soreness scores for the muscle group
2. If soreness consistently resolves before the next session targeting that
   muscle group (soreness score 0-1 by next session): recommend +1 frequency
3. If soreness consistently overlaps with the next session (soreness score 2-3
   at next session time): recommend -1 frequency
4. If soreness resolves just in time (mixed 1-2 scores): recommend no change

Returns:
- `recommendedChange`: -1 | 0 | +1
- `currentFrequency`: number
- `suggestedFrequency`: number
- `reasoning`: string

**Integration Point:** Displayed to the user when creating a new mesocycle
after completing one. The mesocycle creation UI should show per-muscle-group
frequency recommendations.

**Priority:** Low-Medium - valuable but can be deferred since the user can
manually adjust session count

---

### Gap 8: Exercise Swap/Rotation Recommendations

**Book Reference:** pg. 160-161 (Exercise Selection), Variation chapter

**Problem:** No service evaluates whether an exercise should be kept or swapped
at the end of a mesocycle.

**What to Build:**

Add to `WorkoutHistoricalDataService`:

```
getExerciseRetentionRecommendation(
  exerciseId: UUID,
  mesocycleSessionExercises: WorkoutSessionExercise[],
  mesocycleSets: WorkoutSet[]
): ExerciseRetentionRecommendation
```

Uses the book's 3-question decision tree:
1. **Performance stalled?** Check if rep strength improved across the mesocycle
   (compare first microcycle actual reps/weight to last). If no improvement or
   regression -> `stalled = true`
2. **Causing pain?** Check if joint/connective tissue fatigue scores trended
   upward across the mesocycle (average of last 2 microcycles > first 2). If
   consistently high (avg > 2) -> `painful = true`
3. **Feeling stale?** Check if RSM scores trended downward (especially
   mind-muscle connection and pump). If average RSM declined from first half
   to second half of mesocycle -> `stale = true`

Returns:
- `recommendation`: `'keep'` | `'consider-replacing'` | `'replace'`
- `stalled`: boolean
- `painful`: boolean
- `stale`: boolean
- `reasoning`: string

**Integration Point:** Displayed at mesocycle completion and during new
mesocycle planning.

**Priority:** Low - nice to have, the user can make this judgment themselves

---

### Gap 9: Volume Landmark Estimation Over Time

**Book Reference:** Multiple chapters, core concept throughout

**Problem:** MEV and MRV are the foundation of the entire progression system,
but they're never estimated or tracked. Currently, the system uses fixed
formulas (2 sets baseline + 1/week).

**What to Build:**

Add to `WorkoutHistoricalDataService`:

```
estimateVolumeLandmarks(
  muscleGroupId: UUID,
  historicalData: MuscleGroupVolumeEntry[]  // from Gap 1
): VolumeLandmarkEstimate
```

Heuristics:
- **Estimated MEV**: The set count at which the user first reported RSM >= 4
  for that muscle group. Average across available mesocycles. If no RSM data,
  use the starting set count of the most recent mesocycle.
- **Estimated MRV**: The set count at which performance started declining
  (performance score hit 3) or recovery sessions were needed. If never hit,
  use the peak set count of the most recent completed mesocycle + 2.
- **Estimated MAV**: Midpoint between MEV and MRV.

These are rough estimates that improve with more data. The system should store
these as derived data (not persisted documents) and recalculate when needed.

**Integration Point:** Used by:
- `VolumePlanningService` for starting set counts (start at estimated MEV)
- Recovery session return logic (Gap 5)
- Cut mesocycle volume ceiling
- MEV proximity detection (Gap 3)

**Priority:** Medium - enables many other features but can be approximated
without it

---

### Gap 10: Mesocycle-to-Mesocycle Progression Continuity

**Book Reference:** Phase Potentiation chapter, Summary chapter

**Problem:** When a mesocycle ends and a new one begins with the same exercises,
there's no continuity. The new mesocycle generates from scratch using
calibrations. The book says:

- Same exercise, same rep range: start at or slightly below previous ending
  performance
- Same exercise, different rep range: recalculate from 1RM at new target range
  (will naturally be different weight, that's expected)
- Different exercise: use calibration data (current behavior is fine)

**What to Change:**

This is closely related to Gap 1 and Gap 2. The core change is in
`MesocycleService.generateOrUpdateMesocycle()`:

When building the plan context for a new mesocycle:
1. For each calibrated exercise, check if the same exercise was used in the
   immediately preceding completed mesocycle
2. If yes, and the rep range is the same:
   - Use the Week 1 actual weight from the previous mesocycle as this
     mesocycle's starting weight (conservative approach)
   - If the previous mesocycle completed successfully (not abandoned),
     optionally bump by minimum increment
3. If yes, but the rep range changed:
   - Recalculate from the current calibration at the new rep range target
     (current behavior is correct here)
4. If no (new exercise):
   - Use calibration + formula (current behavior)

Additionally, the RIR progression should remain the same (4 -> 0) regardless of
previous mesocycle ending RIR. The deload between mesocycles resets fatigue.

**Priority:** High - part of the same work as Gaps 1 and 2

---

### Gap 11: Rep Range Distribution Across the Microcycle

**Book Reference:** pg. 166-167 (Effective Sets), Variation chapter

**Problem:** The current system sorts exercises within a session by rep range
(Heavy -> Medium -> Light), which is correct. However, the book also recommends
distributing rep ranges across the week: heavy exercises early in the
microcycle (when fresh), light exercises late (when fatigued).

**What to Change:**

Modify `MicrocycleService.distributeExercisesAcrossSessions()` to consider
session position within the microcycle:

- Earlier sessions (lower index) should have more heavy-range exercises
- Later sessions (higher index) should have more light-range exercises
- Medium-range exercises distributed evenly

This is a refinement of the existing distribution logic. The current
fatigue-based headliner system already partially achieves this (high-fatigue
exercises tend to be heavy), but it's not explicitly optimizing for it.

**Priority:** Low - the current system already approximates this

---

## Implementation Order

Grouped by dependency and priority:

### Phase A: Historical Data Foundation (Gaps 1, 9)

Build `WorkoutHistoricalDataService` with the core lookup methods. This is the
foundation that everything else depends on.

1. `getLastPerformanceForExercise()` - most critical method
2. `getExerciseProgressionHistory()` - for analytics and cross-meso comparison
3. `getMuscleGroupVolumeHistory()` - for volume landmark estimation
4. `estimateVolumeLandmarks()` - derived from the above

**Tests:** Create test scenarios with 2-3 mesocycles of mock data, verify that
lookups return correct historical data.

### Phase B: Performance-Based Progression (Gaps 2, 10)

Modify existing services to use historical data for progression.

1. Add `PreviousPerformance` parameter to
   `ExerciseService.calculateTargetRepsAndWeightForFirstSet()`
2. Implement the autoregulated rep/load progression logic
3. Modify `MesocycleService.generateOrUpdateMesocycle()` to pass previous
   performance when regenerating microcycles
4. Add cross-mesocycle continuity logic for starting weights

**Tests:** Test scenarios where user exceeds targets (should progress faster),
meets targets (normal progression), and misses targets (should hold or regress).

### Phase C: Volume Autoregulation (Gaps 3, 5, 6)

Improve volume planning with MEV detection and cycle-type-specific rules.

1. Add `evaluateMevProximity()` to `VolumePlanningService`
2. Add recovery session return logic with midpoint calculation
3. Add cycle-type-specific progression multipliers
4. Integrate all into `generateOrUpdateMesocycle()`

**Tests:** Test MEV detection with various RSM score combinations. Test cut vs
muscle gain vs resensitization volume progression differences.

### Phase D: Safety & Deload Triggers (Gap 4)

Build early deload detection.

1. Create `shouldTriggerEarlyDeload()` with the 3 detection rules
2. Add frontend integration (banner/dialog after session completion)
3. Add mesocycle regeneration logic for converting remaining microcycles to
   deload

**Tests:** Test each trigger condition independently and in combination.

### Phase E: Recommendations (Gaps 7, 8)

Build the recommendation engine for between-mesocycle decisions.

1. `getFrequencyRecommendation()` per muscle group
2. `getExerciseRetentionRecommendation()` per exercise
3. Frontend integration in mesocycle creation flow

**Tests:** Test with various soreness/performance patterns.

### Phase F: Distribution Refinement (Gap 11)

Polish the exercise distribution algorithm.

1. Add microcycle-position-aware rep range distribution
2. Verify with existing tests that distribution still passes

---

## Data Model Changes

No new document types are needed. All the above can be built with the existing
schema. The key insight is that the data is already being captured (sets with
actual/planned values, RSM scores, fatigue scores, soreness scores, performance
scores) - it just isn't being queried or used for planning.

However, consider adding these optional fields:

### Potential Addition: `WorkoutMesocycle.previousMesocycleId`

A reference to the preceding mesocycle. This would make it easy to look up the
previous mesocycle's data without date-based queries. It's not strictly
necessary (you can sort by date), but it makes the historical chain explicit.

### Potential Addition: `WorkoutSessionExercise.estimatedMev` / `estimatedMrv`

Store per-exercise volume landmark estimates at the time of mesocycle creation.
This creates a historical record of how the system estimated these values, which
is useful for debugging and analytics. These would be set during
`generateOrUpdateMesocycle()` and never changed afterward.

---

## Follow-Up Questions

These questions could significantly change the plan's scope or approach:

1. **How much historical data should be required before autoregulation kicks
   in?** The plan assumes "if any previous mesocycle exists, use it." Should
   there be a minimum of 2-3 completed mesocycles before trusting historical
   patterns? Or should even 1 prior mesocycle inform the next?

2. **Should the system auto-regenerate future microcycles after each session,
   or only when explicitly triggered?** Auto-regeneration means better plans
   but more computation and potentially confusing UX (the user's upcoming
   sessions keep changing). Manual regeneration is simpler but means the plan
   gets stale. A middle ground: regenerate after each microcycle completes?

3. **How should the system handle partial mesocycle completions?** If a user
   abandons a mesocycle at week 3 of 6, should that data still be used for
   historical lookups? The performance data is valid but the volume progression
   is incomplete. Should abandoned mesocycles be weighted differently?

4. **Should volume landmark estimates be per-muscle-group or per-exercise?**
   The book discusses MEV/MRV per muscle group, but the app tracks data per
   exercise. An exercise-level estimate is more precise but noisier. A
   muscle-group-level estimate is smoother but less specific. The plan currently
   proposes per-muscle-group. Should it be both?

5. **What should happen when the user's calibration data is stale?** If the
   most recent calibration is 6+ months old and the user has completed several
   mesocycles since then, the 1RM estimate may be significantly off. Should the
   system prompt for re-calibration? Should it infer an updated 1RM from recent
   actual performance data?

6. **Should the frequency recommendation system actually modify the mesocycle
   template, or just advise?** The plan proposes advisory recommendations. But
   changing frequency means changing session count and exercise distribution,
   which is a significant structural change to the mesocycle. Should the system
   offer to auto-apply frequency changes, or should the user always configure
   this manually?

7. **How should the resensitization mesocycle interact with exercise selection?**
   The book offers 3 options for deload/resensitization exercises: same as
   current, next mesocycle's, or low-stress alternatives. The plan proposes
   using current exercises. Should the UI offer the choice? Does this affect
   the data model?

8. **Is there a need for a "macrocycle" concept in the data model?** The book
   describes sequencing mesocycles into blocks (muscle gain -> maintenance ->
   fat loss). Currently there's no structure above `WorkoutMesocycle`. Should a
   `WorkoutMacrocycle` document exist to group mesocycles and track block-level
   progression? Or is `previousMesocycleId` chaining sufficient?

9. **How should the system handle exercises that appear in different sessions
   within the same microcycle?** The book says don't do the exact same workout
   twice in a microcycle, but you can do the same exercise with different
   parameters. Currently, the same `WorkoutExercise` could appear in multiple
   sessions. Should the historical data service treat these as independent
   progression tracks or aggregate them?

10. **What priority should the analytics/visualization layer have?** The plan
    focuses on core logic, but the historical data service enables a rich
    analytics page. Should Phase E include frontend work for displaying
    progression charts, SFR trends, and volume landmark visualizations? Or
    should that be a separate effort?
