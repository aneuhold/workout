# Progression & Historical Data - Gap Analysis

This document catalogs the remaining gaps between the app's current progression
logic and the strategies prescribed by the book. Each gap describes the problem,
the book's prescribed solution (algorithms, formulas, decision tables), and links
to the phase document(s) that address it.

For the technical implementation plan, see the phase documents linked from each
gap.

---

## Gap 1: Dynamic 1RM from Best Performance

**Book Reference:** pg. 30-32 (1 Rep Max), README "1 Rep Max Calculations"
section

**Problem:** The system currently derives 1RM exclusively from explicit
`WorkoutExerciseCalibration` documents. A user who never re-calibrates but
steadily improves over several mesocycles will have an increasingly stale 1RM.
This means target weights drift further from reality over time, making planned
sets either too easy or too hard.

Meanwhile, every completed set the user logs contains enough data (weight, reps)
to compute a 1RM via the same NASM formula used for calibrations:

```
1RM = (weight * reps / 30.48) + weight
```

The best 1RM across **all** sources (calibrations AND actual sets) should be
used when planning a new mesocycle. For a mesocycle that has already started, the
1RM remains locked to whatever was recorded at the start so that mid-cycle
progression stays consistent.

**Addresses:** [Phase 1 - CTO Definitions & 1RM](./progression-plan-phase-1.md#gap-1-dynamic-1rm-from-best-performance)

---

## Gap 2: Cross-Mesocycle Historical Performance Lookup

**Book Reference:** Phase Potentiation chapter (pg. 181-191), Summary chapter
(pg. 338+), README `setOrder` note

**Problem:** When generating a new mesocycle, the system builds every plan from
calibration data and fixed formulas. It never asks "what did the user actually
do last time with this exercise?" This means valuable performance data - actual
weights lifted, reps achieved, fatigue generated, soreness patterns - is
discarded when crossing mesocycle boundaries.

The book is clear that cross-mesocycle data should inform planning:

- **Same exercise, same rep range:** Start at or slightly below the previous
  mesocycle's starting weight and build up again. Starting from scratch via
  calibration formula may dramatically undershoot or overshoot.
- **Same exercise, different rep range:** Recalculate from 1RM at the new
  target range. The weight will be different, which is expected and not a
  violation of progressive overload.
- **New exercise:** Use calibration + formula. No historical data exists.

Additionally, historical volume data per muscle group (set counts, SFR trends,
soreness patterns across mesocycles) is needed for volume landmark estimation
(Gap 6), recovery logic (Gap 7), and frequency planning.

**Addresses:** [Phase 1 - CTO Definitions](./progression-plan-phase-1.md#gap-2-cross-mesocycle-historical-performance-lookup)

---

## Gap 3: Autoregulated Rep/Load Progression

**Book Reference:** pg. 58-61 (Accumulation Phase), pg. 181-191 (Phase
Potentiation load/rep progression rules), README "Rep Progression" and "Load
Progression" sections

**Problem:** Rep and load progression are currently formulaic:

- Rep progression: +2 reps per microcycle regardless of actual performance
- Load progression: +2% weight per microcycle regardless of actual performance

The book prescribes autoregulated progression. The key rule is:

> "Add only enough load to allow at least the same reps, at the same or slightly
> lower RIR, with at least four weeks of accumulation being the goal."

**Algorithm - Rep Progression Autoregulation:**

| Scenario | Planned | Actual | Action |
|----------|---------|--------|--------|
| Hit target at target RIR | 15 reps @ 3 RIR | 15 reps @ 3 RIR | Normal: +2 reps next microcycle |
| Hit target at lower RIR | 15 reps @ 3 RIR | 15 reps @ 1 RIR | **Hold**: keep 15 reps, don't add. The user is near their limit at this weight |
| Missed target | 15 reps @ 3 RIR | 12 reps @ 1 RIR | **Regress**: use actual reps (12) as baseline for next microcycle |
| Exceeded target | 15 reps @ 3 RIR | 18 reps @ 3 RIR | **Accelerate**: use actual reps (18) as baseline, progress from there |

**Algorithm - Load Progression Autoregulation:**

| Scenario | Action |
|----------|--------|
| Hit targets at planned RIR | Normal: +2% weight (or next equipment increment) |
| Hit targets at lower RIR than planned | **Hold**: keep same weight |
| Missed targets | **Hold** or reduce by minimum increment |
| Significantly exceeded targets | Consider larger weight jump (next increment above 2%) |

**Addresses:** [Phase 2 - Autoregulated Progression](./progression-plan-phase-2.md#gap-3-autoregulated-repload-progression)

---

## Gap 4: Mesocycle-to-Mesocycle Progression Continuity

**Book Reference:** Phase Potentiation chapter, Summary chapter "Progression
Across Mesocycles" section

**Problem:** When a mesocycle ends and a new one begins with the same exercises,
there is no continuity. The new mesocycle generates from scratch using
calibrations. The deload between mesocycles resets fatigue, but the user's
strength baseline should carry forward.

**Algorithm:**

For each exercise in the new mesocycle:

1. Check if the same exercise was used in the immediately preceding completed
   mesocycle
2. If **yes** and the rep range is the same:
   - Use the previous mesocycle's **Week 1 actual weight** as this mesocycle's
     starting weight (conservative approach - not the ending weight, which was
     achieved under peak fatigue)
   - If the previous mesocycle completed successfully, optionally bump by
     minimum equipment increment
3. If **yes** but the rep range changed:
   - Recalculate from the current best 1RM at the new target rep range. The
     weight will naturally be different. This is expected.
4. If **no** (new exercise):
   - Use calibration + `targetPercentage` formula (current behavior)

The RIR progression always resets to 4 -> 3 -> 2 -> 1 -> 0 regardless of the
previous mesocycle's ending RIR. The deload resets fatigue.

**Addresses:** [Phase 2 - Cross-Mesocycle Continuity](./progression-plan-phase-2.md#gap-4-mesocycle-to-mesocycle-progression-continuity)

---

## Gap 5: MEV Detection from Initial RSM Scores

**Book Reference:** pg. 50-53, README "Accumulation Phase" section

**Problem:** The book prescribes using RSM scores from the first 2-3 sessions
of a mesocycle to determine whether starting volume is at MEV (Minimum Effective
Volume). No logic currently implements this calibration step. Without it, the
system may start a mesocycle at a volume that is too low (wasting early weeks)
or too high (accelerating fatigue and cutting the mesocycle short).

**Algorithm - MEV Proximity from RSM:**

After the first microcycle is complete, aggregate RSM scores per muscle group
across all session exercises targeting that group. Average them and apply:

| Total RSM Score | Proximity to MEV | Recommendation |
|---:|---|---|
| 0-3 | Below MEV | Increase volume next microcycle by 2-4 sets for that muscle group |
| 4-6 | At or just above MEV (ideal start) | Progress normally |
| 7-9 | Between MEV and MRV, possibly exceeding | Drop volume next microcycle |

This check happens once (after the first microcycle) and adjusts the volume
baseline before the normal soreness/performance set-addition algorithm takes
over for subsequent microcycles.

**Addresses:** [Phase 3 - MEV Detection](./progression-plan-phase-3.md#gap-5-mev-detection-from-initial-rsm-scores)

---

## Gap 6: Volume Landmark Estimation Over Time

**Book Reference:** pg. 34+ (Volume Landmarks), pg. 117 (MRV), pg. 145
(Frequency and Volume), multiple chapters throughout

**Problem:** MEV and MRV are the foundation of the entire progression system,
but they are never estimated or tracked. The system uses fixed formulas (2 sets
baseline + 1 per microcycle). The book says these landmarks are individual,
change over time, and should be calibrated from actual training data.

**Algorithm - Heuristic Estimation:**

- **Estimated MEV:** The set count at which the user first reported average
  RSM >= 4 for a muscle group. Average this across available mesocycles. If no
  RSM data exists, use the starting set count of the most recent mesocycle.
- **Estimated MRV:** The set count at which performance started declining
  (average performance score hit 3) or recovery sessions were needed for that
  muscle group. If the user never hit this threshold, use the peak set count of
  the most recent completed mesocycle + 2 as a rough upper bound.
- **Estimated MAV:** Midpoint between estimated MEV and MRV.

These estimates are rough and improve with more data. They should be
recalculated for each new mesocycle using all available historical data.

**Uses:**

- Starting set counts (start at estimated MEV instead of fixed 2)
- Recovery session return point (Gap 7)
- Cut mesocycle volume ceiling (Gap 8)
- MEV proximity validation (Gap 5)

**Addresses:** [Phase 3 - Volume Landmark Estimation](./progression-plan-phase-3.md#gap-6-volume-landmark-estimation-over-time)

---

## Gap 7: Recovery Session Return Logic

**Book Reference:** pg. 101-111 (Fatigue Management, Recovery Sessions)

**Problem:** The `isRecoveryExercise` field exists and the volume planning
service cuts sets in half for recovery exercises. But there is no logic for
what happens AFTER a recovery session - specifically, the volume level to
restart at.

The book prescribes:

> After a recovery session taken for early MRV: progress load normally, but drop
> volume to **midway between MEV and MRV**.

**Algorithm:**

1. When a session exercise was flagged as recovery (`isRecoveryExercise = true`)
   in the previous microcycle:
   - Calculate the midpoint: `returnSetCount = ceil((estimatedMev + estimatedMrv) / 2)`
   - Use this as the set count for the next non-recovery microcycle
   - Resume normal volume progression from there

2. Fallback when no volume landmark data exists:
   - Estimated MEV = starting set count of the current mesocycle
   - Estimated MRV = the hard cap (8 sets per exercise, 10 per muscle group per
     session from existing constants)
   - Midpoint = `ceil((startingSetCount + hardCap) / 2)`

3. Load stays the same after a recovery session (only volume changes)

**Addresses:** [Phase 3 - Recovery Session Return Logic](./progression-plan-phase-3.md#gap-7-recovery-session-return-logic)

---

## Gap 8: Cycle-Type-Specific Progression Rules

**Book Reference:** pg. 220-221 (Cutting), pg. 181-191 (Phase Potentiation),
pg. 194 (Resensitization)

**Problem:** The `CycleType` enum has `MuscleGain`, `Resensitization`, `Cut`,
and `FreeForm`, but the progression logic treats all non-FreeForm types
identically. The book prescribes significantly different progression strategies
for each type.

**Differences by Cycle Type:**

### MuscleGain (current behavior - no changes needed)

- Standard MEV -> MRV volume progression
- Normal set addition rate (+1 per muscle group per microcycle)
- RIR progression: 4 -> 3 -> 2 -> 1 -> 0
- 5 accumulation weeks + 1 deload week (default)

### Cut

- **Slower set progression:** Instead of +1 set per muscle group per
  microcycle, use roughly half that rate (alternate which exercises get the
  extra set each week, so effectively +0.5 per microcycle)
- **Longer target mesocycle:** 6-8 weeks accumulation instead of 5. The goal
  is to stay around MEV as long as possible until the cut is complete
- **Stay closer to MEV:** Don't push volume as aggressively toward MRV
- **Same RIR progression** but potentially start at 3 RIR instead of 4

Example comparison:

| Week | MuscleGain Sets | Cut Sets |
|---:|---:|---:|
| 1 | 2 | 2 |
| 2 | 3 | 2 |
| 3 | 4 | 3 |
| 4 | 5 | 3 |
| 5 | 6 (deload next) | 4 |
| 6 | deload | 4 |
| 7 | - | 5 (deload next) |
| 8 | - | deload |

### Resensitization

- **MV-level training** (very low volume): 2-3 sets per muscle group total,
  not per exercise
- **Bias toward 5-10 rep range** (heavier weight, lower volume) to preserve
  strength and use heavy loads
- **No volume progression** (flat set count across all microcycles)
- **Shorter duration:** 3-4 weeks total, no deload needed
- **Lower frequency:** 1-2 sessions per muscle group per microcycle

### FreeForm

- No automatic recommendations (existing behavior)

**Addresses:** [Phase 3 - Cycle-Type-Specific Progression](./progression-plan-phase-3.md#gap-8-cycle-type-specific-progression-rules)

---

## Gap 9: Early Deload Triggers

**Book Reference:** pg. 100, 110-112 (Fatigue Management, Deloads)

**Problem:** The system schedules deloads at a fixed position (last microcycle).
The book says deloads should also trigger early based on fatigue indicators.

**When to take a deload (from the book):**

1. When you have hit MRV and it is scheduled (current behavior)
2. More than half of your muscles have required a recovery session in the last
   two weeks
3. Take one after a sickness that takes more than 3 days to recover

**Detection Algorithm:**

**Rule 1 - Recovery Session Threshold:**

Count distinct muscle groups where `isRecoveryExercise` was `true` in the last
2 microcycles. If this count exceeds 50% of all trained muscle groups in the
mesocycle, trigger deload.

**Rule 2 - Consecutive Performance Drops:**

For each exercise, check if actual reps fell 3+ below planned reps for 2 or
more consecutive sessions. If this pattern appears across multiple exercises,
it indicates systemic fatigue beyond normal variation and warrants deload.

**Rule 3 - Illness (Future/UI):**

Allow the user to flag illness duration. If more than 3 days, recommend deload
followed by starting a new mesocycle.

**Severity Levels:**

- **Suggested:** One trigger condition partially met (e.g., approaching 50%
  recovery sessions)
- **Recommended:** One trigger condition fully met
- **Urgent:** Multiple trigger conditions met simultaneously

**Addresses:** [Phase 4 - Deload Detection](./progression-plan-phase-4.md#gap-9-early-deload-triggers)

---

## Phase Documents

| Phase | Title | Gaps Addressed |
|-------|-------|---------------|
| [Phase 1](./progression-plan-phase-1.md) | Data Foundation | 1, 2 |
| [Phase 2](./progression-plan-phase-2.md) | Autoregulated Progression | 3, 4 |
| [Phase 3](./progression-plan-phase-3.md) | Volume Intelligence | 5, 6, 7, 8 |
| [Phase 4](./progression-plan-phase-4.md) | Deload Detection | 9 |
