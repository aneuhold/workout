# Free-form session: targets / add-set / add-exercise not saving

## Report (clarified with user)
Original: "Bug with when saves happen on the planning screen / free form screen. It should save whenever the numbers are tapped off of or when the screen leaves."

Clarified: the **Log** flow (committing a set's actual weight/reps/RIR via the log button/dialog) is believed to work as expected (**confirm it actually persists**). The real problem is in a **free-form workout**: **setting targets, adding sets, and adding exercises do not seem to save to the DB.**

So the scope is:
1. Confirm the Log flow actually persists actuals to the DB.
2. Fix persistence for, in a free-form session: (a) setting targets, (b) adding a set, (c) adding an exercise.
3. Ensure edits also flush on screen leave as a safety net.

## Possible cross-cutting cause — read first
This may share a root cause with the data-clobber bug in `docs/planned-fixes/sync-and-save-reliability.md` (Issue 1). If an add-set/add-exercise write IS being queued but gets clobbered by a batched `all`-get response (last-write-wins in `#processApiRequests`), the doc would round-trip and then vanish, looking exactly like "doesn't save." **First determine whether the write is even being triggered/queued** (add a temp log in `WorkoutAPIService.queryApi` and `DocumentMapStoreService.updateManyDocs`). If the write never fires → it's a trigger bug (below). If it fires but the local store reverts after the next sync → it's the clobber bug, and this work should merge with the sync-reliability worktree instead.

## What the code does today

Both target screens are the same component, `SessionPage`, in different modes (`src/pages/SessionPage/sessionPageTypes.ts`): planning = `SessionPageMode.Planning`, free-form = `SessionPageMode.Active`. Route sets the mode in `src/routes/(app)/session/+page.svelte:11`.

### Numeric field save trigger
The only save trigger for numeric fields is an inline `onchange` on the weight/reps inputs in the set row, gated to Planning mode:
- `src/pages/SessionPage/SessionPageSetRow.svelte:159-162` (weight), `:183-186` (reps):
  ```js
  onchange={() => { if (mode === SessionPageMode.Planning) onPlannedChange?.(weight, reps); }}
  ```
- `onchange` on a number input fires on blur/commit, so it is effectively a blur save — but **only in Planning mode**. In a free-form (Active) session, typing a target and tapping off does nothing.
- The RIR input (`:204-211`) has **no** save handler at all.

Save chain when it fires: `onPlannedChange` → `handlePlannedChange` (`SessionPageExerciseCard/SessionPageExerciseCard.svelte:104-114`) → `setMapService.updateDoc` → `DocumentMapStoreService.updateManyDocs` (`src/services/DocumentMapStore.service.svelte.ts:126`) → `persistToLocalData` + `persistToDb` → `WorkoutAPIService.queryApi`. Immediate, no debounce — so when the trigger fires, propagation is fine.

### No save-on-leave
`SessionPage.svelte` has **no** lifecycle/navigation hooks — no `beforeNavigate`, `onDestroy`, `pagehide`, or `visibilitychange`. A value typed and left (input still focused on navigate, iOS back-gesture that emits no native `change`) is lost.

### Add set / add exercise
Need to trace the add-set and add-exercise handlers in the free-form flow (in `SessionPageExerciseCard` and the SessionPage service) and confirm each calls `updateDoc` / `queryApi`. The report says these specifically don't persist, so verify whether the handler mutates only local rune state without calling the persistence layer, or whether it persists but gets clobbered (see cross-cutting cause above).

## Research plan
1. Add temporary logging at `WorkoutAPIService.queryApi` and `DocumentMapStoreService.updateManyDocs`. In a free-form session: set a target, add a set, add an exercise. See which of the three fire a queued write.
2. For any that do NOT fire → trigger bug. For any that DO fire but revert → clobber bug (hand to the sync-reliability worktree).
3. Confirm the Log flow fires a write and the actual values land in the DB.

## Fix direction (trigger side)
- **Targets in free-form**: make the weight/reps `onchange` in `SessionPageSetRow.svelte` fire in Active mode too, routing to the planned/target fields. Cleanest: a single `onFieldBlur(field, value)` callback the parent maps to the correct field per mode.
- **Add set / add exercise**: ensure those handlers call the persistence layer (`updateDoc`) not just local state. Fix wherever the trace shows the write is missing.
- **Save on leave (safety net)**: add a flush in `SessionPage.svelte` via SvelteKit `beforeNavigate` plus a `pagehide`/`visibilitychange` listener (for mobile PWA background/close where `beforeNavigate` doesn't run). A `flushPendingEdits()` on `src/pages/SessionPage/SessionPage.service.svelte.ts` is the natural home; track the dirty field in `$state` on edit and commit it in the flush handler and on blur.
- No debounce/flush plumbing needed in the sync layer — `updateDoc` already persists synchronously and queues the API write.

## Key files
- `src/pages/SessionPage/SessionPageSetRow.svelte` — the `onchange` gating and the RIR input (trigger site).
- `src/pages/SessionPage/SessionPageExerciseCard/SessionPageExerciseCard.svelte` — `handlePlannedChange` / `handleLogSet` / add-set / add-exercise handlers.
- `src/pages/SessionPage/SessionPageExerciseCard/SessionPageExerciseCardSetTable.svelte` — prop plumbing for `onPlannedChange`.
- `src/pages/SessionPage/SessionPage.svelte` — where a save-on-leave flush lives.
- `src/pages/SessionPage/SessionPage.service.svelte.ts` — natural home for `flushPendingEdits()`.
- `src/services/DocumentMapStore.service.svelte.ts`, `src/services/WorkoutAPI.service.ts` — sync layer (immediate; likely not the trigger problem, but see clobber cross-reference).

## Worktree note
Mostly independent of the other fixes (edits are in `SessionPage/*`), **except** the possible shared clobber cause. Do the diagnosis in step 1 first; if it's the clobber, fold into the sync-reliability worktree to avoid two people editing `WorkoutAPI.service.ts`.

## Before done
Run `pnpm lint --fix`, `pnpm check`, `pnpm test`.
