# Plan: Per-Set Best/Last Previews on Free-Form Exercises

## Goal

On free-form exercise sets, display a small preview under each set row showing:

- **Best:** the weight × reps from the corresponding set (by index) in the session that produced the current best performance for that exercise.
- **Last:** the weight × reps from the corresponding set (by index) in the most recent prior performance of that exercise.

Raw weight × reps values (no 1RM computation) shown as muted text beneath each set row.

## Scope

- Free-form exercises only (mesocycle sessions untouched — can extend later).
- Both lines rendered independently: either one can be shown while the other is hidden if its data is missing.

## Visibility rules

| Session mode | Show previews? |
| --- | --- |
| Planning | Always (when data is available) |
| Active | Only when the current set has no targets (`!hasTargets`) |
| Review / View / Locked | Never |

Each of the two lines (Best / Last) is hidden independently when its underlying data is unavailable. If a set index exceeds the length of the best/last session's sets, that line is hidden for that set.

---

## Required schema split: `lastSessionSets` → two fields

The current `WorkoutExerciseCTO.lastSessionSets` is **misnamed**. It actually holds the most recent **non-deload accumulation** session's sets (filtered via `WorkoutSessionExerciseService.isDeloadExercise()`, which classifies any session with `plannedRir == null` on every set as a deload). Free-form sessions never set `plannedRir`, so they're always classified as deloads and excluded from `lastSessionSets`.

For the "Last:" preview to honor "all prior performances," `lastSessionSets` must mean the literal most recent prior session — including free-form. The fix: rename the existing field to its actual meaning and reclaim `lastSessionSets` for the true latest.

### New CTO field layout (`core-ts-db-lib/src/ctos/workout/WorkoutExerciseCTO.ts`)

| Field | Meaning | Replaces |
| --- | --- | --- |
| `lastSessionExercise` | Most recent completed `WorkoutSessionExercise` for this exercise, **regardless** of deload/free-form/cycle type. | (new semantics) |
| `lastSessionSets` | All sets (in `setOrder`) from `lastSessionExercise`. | (new semantics) |
| `lastAccumulationSessionExercise` | Most recent completed non-deload accumulation `WorkoutSessionExercise`. | old `lastSessionExercise` |
| `lastAccumulationSessionSets` | All sets from `lastAccumulationSessionExercise`. | old `lastSessionSets` |

Both pairs nullable / default to empty array, same as today.

### Consumers — which field they should reference

**Stays on the new accumulation-only fields** (autoregulation / progression / non-deload-only metrics):

- `core-ts-db-lib/src/services/workout/Set/WorkoutSetService.ts:56` — surplus / progression calculation. → `lastAccumulationSessionSets`.
- `core-ts-db-lib/src/services/workout/Exercise/WorkoutExerciseService.spec.ts:1126,1172` — tests for the above. Update field references.
- `core-ts-db-lib/src/services/workout/Mesocycle/WorkoutMesocycleService.spec.ts:1032,1047,1055,1056,1112,1117,1118,1182,1183` — mesocycle plan generation tests. → `lastAccumulationSession*`.
- `workout-wt/src/pages/ExercisePage/ExercisePageTrainingQuality.svelte` — displays RSM / fatigue / soreness / performance scores. These metrics only exist for non-deload accumulation sessions, so → `lastAccumulationSessionExercise`.
- `workout-wt/src/pages/ExercisePage/ExercisePageViewMode.svelte:109` — passes the field into the above component. → `lastAccumulationSessionExercise`.

**Moves to / stays on the new "true latest" `lastSession*`:**

- The new "Last:" preview in this feature.
- (Future) Anything that asks "when did the user last touch this exercise."

### Backend pipeline (`be-ts-db-lib/src/repositories/workout/WorkoutExerciseRepository.ts:63-273`)

Pipeline B currently produces `lastSessionExercise` + `lastSessionSets` from "most recent non-deload session." Split it so the same aggregation produces both pairs:

- `lastSession*` — most recent completed session, no deload filter.
- `lastAccumulationSession*` — most recent completed non-deload session (existing logic, just renamed).

Implementation choice (left to whoever writes it): two separate sub-pipelines, or one pipeline that retains both `$first` results. Either is fine — performance shouldn't materially differ.

### Frontend incremental update (`workout-wt/src/services/documentMapServices/exerciseMapService.svelte.ts:86,87,139-182`)

`updateCTOsForCompletedSession()` becomes:

1. **Always** update `lastSessionExercise` / `lastSessionSets` if the new session exercise's `createdDate` is newer than the existing one. No deload check.
2. **Conditionally** update `lastAccumulationSessionExercise` / `lastAccumulationSessionSets` only when `!isDeloadExercise(seSets)` (existing behavior, just renamed and on the new field pair).

Initial CTO defaults at lines 86-87 add the two new fields (null + empty array).

### Mocks, test utils, integration tests

- `core-ts-db-lib/test-utils/WorkoutTestUtil.ts:623-641` — add the two new fields to the CTO factory's options + defaults.
- `gcloud-backend/test/test-utils/WorkoutTestUtil.ts:322,323` — add new field defaults.
- `gcloud-backend/src/routes/project/workout/WorkoutRetrieval.service.spec.ts:607-611` — assertions currently target `lastSessionExercise` / `lastSessionSets`. Determine from the test setup whether they're asserting against an accumulation session (point at accumulation variant) or against "any latest" (keep on `lastSession*`). Likely the former.
- `be-ts-db-lib/src/repositories/workout/WorkoutExerciseRepository.spec.ts:327-465` — split coverage: existing "exclude deloads" test moves to the accumulation variant; add new tests asserting that `lastSession*` includes deload + free-form sessions; verify field count and order for both.
- `workout-wt/src/services/documentMapServices/exerciseMapService.test.svelte.ts:47-281` — split the existing "should not overwrite for deload exercises" test into two assertions: `lastAccumulationSession*` is preserved, `lastSession*` IS updated. Update default-value assertions for new fields.
- `workout-wt/src/services/documentMapServices/exerciseMapService.mock.ts:56,326-434` — derivation needs to compute both pairs. The current `lastSessionExercise` derivation (`:425-434`) already filters out deloads — that becomes the accumulation variant. Add a parallel derivation without the filter for the new `lastSession*`.

### Migration / cache compatibility

Bump `LocalData.PREFIX` from `v3-` to `v4-` (`src/util/LocalData/LocalData.ts:23`) as part of the schema-rename PR. This wipes every cached document map; the next data fetch from the backend repopulates them with the new field shape, side-stepping the rename entirely.

`LocalData.cleanupOldVersions()` (added separately, runs once at class load via a static initializer block) removes any orphaned `v<n>-` keys from previous prefix versions so they don't pile up across bumps.

---

## Data sources for the preview (post-rename)

### Last-session data

After the rename, `WorkoutExerciseCTO.lastSessionSets` is the literal most recent prior session's sets (free-form, deload, or accumulation — whichever is newest). Use it directly:

- Index by set position into `cto.lastSessionSets`.
- Short previous session → later current sets silently hide the Last line.

### Best-session data (Option A)

Two-step frontend lookup:

1. `cto.bestSet` (`WorkoutExerciseCTO.ts:32-40`) — the single best set ever recorded for this exercise.
2. `sessionExerciseMapService.getDoc(bestSet.workoutSessionExerciseId)` — look up the session exercise it belongs to.
3. `sessionExerciseMapService.getOrderedSetsForSessionExercise(...)` (`sessionExerciseMapService.svelte.ts:26-28`) — returns the full ordered set list from that session.

**Fallback:** when `bestSet` is `null` but `bestCalibration` exists (manually-entered 1RM), render `bestCalibration.weight × reps` on set 1 only. Hidden on all other sets, since there is no session context to index into.

**Pre-verified:** historical session exercises and sets are loaded into `sessionExerciseMapService` / `setMapService` for the user's full history. `WorkoutAPIService.getInitialData()` requests `sessionExercises: { all: true }` and `sets: { all: true }` on every login and app reopen; backend filters only by `userId`. The frontend lookup above will resolve for any historical set.

---

## Files to change in workout-wt (preview UI)

### 1. `src/pages/SessionPage/sessionPageTypes.ts`

Add a `SetPreview` type:

```ts
export type SetPreview = {
  best?: { weight: number; reps: number };
  last?: { weight: number; reps: number };
};
```

### 2. `src/pages/SessionPage/sessionPageUtils.ts`

Add a helper alongside the existing derivation functions:

```ts
computeSetPreviews(
  cto: WorkoutExerciseCTO | undefined,
  currentSetCount: number
): SetPreview[]
```

- Returns an array of length `currentSetCount`.
- For "Last:" — index directly into `cto.lastSessionSets` (the post-rename "true latest").
- For "Best:" — call `sessionExerciseMapService.getDoc(...)` + `getOrderedSetsForSessionExercise(...)` to resolve the best session's sets from `cto.bestSet.workoutSessionExerciseId`. Same map-service-direct style as the rest of this file (e.g. `deriveCurrentExerciseIndex`, `exerciseHasAllSessionMetricsFilled`).
- Handles all branches: no data, best-only, last-only, both, short best session, short last session, manual-calibration fallback.

### 3. `src/pages/SessionPage/SessionPageExerciseCard/SessionPageExerciseCard.svelte`

- Derive `setPreviews` via `computeSetPreviews(cto, currentSetCount)`.
- Derive `isFreeForm` (already known at the card level via session context).
- Pass `preview` (single entry) and `showPreviews` (the `isFreeForm` flag) down to each `<SessionPageSetRow />`.

### 4. `src/pages/SessionPage/SessionPageSetRow.svelte`

- Add props `preview?: SetPreview` and `showPreviews: boolean`.
- Add a new markup block beneath the existing Target line (currently `SessionPageSetRow.svelte:205-213`) that renders Best and Last lines based on mode + `hasTargets`.
- Reuse the existing grid column alignment from the Target block (empty col 1 + remaining cols for muted text).

---

## Tests

### CTO / repository / map service (cross-repo)

- `be-ts-db-lib` repository spec: assert `lastSession*` includes free-form + deload sessions when they're the most recent; assert `lastAccumulationSession*` excludes them. Cover both pairs in the existing "no data" test.
- `workout-wt` `exerciseMapService.test.svelte.ts`: split the deload-no-overwrite test into two assertions (accumulation preserved, true-latest updated). Add a free-form session test asserting the same.
- `core-ts-db-lib` autoregulation specs: rename references from `lastSessionSets` → `lastAccumulationSessionSets`. No behavior change expected.

### Preview helper (`computeSetPreviews`)

Unit tests with fake CTOs covering:

- No best data, no last data → empty previews
- Best only → only Best line populated
- Last only → only Last line populated
- Both present, equal length
- Best session shorter than current set count → later sets hide Best
- Last session shorter than current set count → later sets hide Last
- Manual-calibration fallback (`bestSet` null, `bestCalibration` present) → set 1 only
- Best set's session exercise not in the map (session not loaded) → Best silently hidden

---

## Implementation order

1. **Core schema rename in `core-ts-db-lib`**: add `lastAccumulationSession*` fields to the CTO schema; keep old `lastSession*` fields temporarily during the migration if needed, or do an atomic rename via single PR.
2. **Update autoregulation consumers** in `core-ts-db-lib` (`WorkoutSetService.ts:56`, related specs and test utils).
3. **Backend pipeline** in `be-ts-db-lib` to populate both pairs; update its specs.
4. **Frontend incremental update** in `workout-wt` `exerciseMapService.svelte.ts` to update both pairs; update its mocks and tests.
5. **Frontend display consumers** in `workout-wt` (`ExercisePageTrainingQuality.svelte`, `ExercisePageViewMode.svelte`) point at the accumulation variant.
6. **Wait 6 seconds** for the library change to propagate after each library publish.
7. **Build the preview feature** itself (the four files in the workout-wt section above).
8. Run `pnpm lint --fix && pnpm check && pnpm test` in workout-wt.

---

## Decisions locked in

1. **1RM display location:** show on all sets where a corresponding best-session set exists (indexed by position). Hidden for set indices beyond the best session's set count.
2. **Format:** raw calibration values — `W × R`, no computed 1RM.
3. **"Same set index" semantics:** set N in the current session shows set N's weight/reps from the source session.
4. **Last scope:** all prior performances (free-form + mesocycle), not just free-form.
5. **Visibility:** Planning always; Active only when `!hasTargets`; Review/View/Locked never.
6. **No-data fallback:** hide each line independently. If only one data source is present, show only that one.
7. **Best-session source:** prefer `bestSet` → its session exercise (Option A). Fall back to raw `bestCalibration` values on set 1 only when `bestSet` is null.
8. **`lastSessionSets` semantics:** rename the existing accumulation-filtered field to `lastAccumulationSessionSets` and reclaim `lastSessionSets` for the literal most recent prior session (any cycle type, any deload status).
