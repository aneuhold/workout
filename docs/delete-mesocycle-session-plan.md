# Delete Mesocycle Session — Implementation Plan

## Goal

Let a user delete a workout session that belongs to a mesocycle (i.e. `session.workoutMicrocycleId != null`) as long as `session.complete === false`. A session being in the past is fine; only completion status gates deletion. Free-form deletion stays as-is, but its internals are shared with the new path so we keep the code minimal.

## Warning copy (mesocycle only)

When the user deletes a mesocycle session, the confirmation dialog adapts to three cases. A `MesocycleDeleteContext` helper (co-located at the top of the dialog file) classifies the session:

| Case | Detection | Copy |
| --- | --- | --- |
| **Deload session** | session's microcycle is the last one in the mesocycle's ordered microcycles *and* there is more than one (mirrors the `isDeload` heuristic already used in `homePageUtils.ts:53` and `SessionsPage.svelte:48`) | Default "This will remove the session along with its exercises and sets. This can't be undone." — no extra warning. |
| **Future microcycle** | session's microcycle is ordered *after* the current microcycle (the current microcycle is the first one with `completedDate == null`) | "This session will be regenerated automatically when you finish the current microcycle, so deleting it now is low-risk." |
| **Current microcycle, not deload** | session's microcycle is the current one *and* not the deload | "Heads up: deleting a planned session in the microcycle you're actively training can skew the app's volume and fatigue calculations, so recommendations may be off for the rest of this mesocycle. Only delete if you're sure you won't run this session." |

Default copy (used as the fallback and for free-form sessions) stays the current short message.

All classification is done in the dialog component using `microcycleMapService.getOrderedMicrocyclesForMesocycle(mesocycleId)` — no new service method required.

## Plan

### Step 1 — Unify session deletion in `sessionMapService`

File: `src/services/documentMapServices/sessionMapService.svelte.ts`

- Rename the public `deleteFreeFormSession(sessionId)` to `deleteSession(sessionId)`.
- Inside `deleteSession`:
  - Early-return when the session is missing or `session.complete === true` (defense-in-depth; the UI already gates this).
  - Build `apiOptions` via the existing private `prepareDeleteSessionExercisesWithSets(session.sessionExerciseOrder)`.
  - Queue `this.prepareDocsForSave({ delete: [sessionId] }, apiOptions)`.
  - **New branch:** when `session.workoutMicrocycleId != null`, load the microcycle with `microcycleMapService.getDoc(...)`, strip the ID out of `mc.sessionOrder`, and queue `microcycleMapService.prepareDocsForSave({ update: [mc] }, apiOptions)`. Leave the microcycle doc in place even when its `sessionOrder` empties out. Add a short comment on this branch explaining the choice: unlike `initiateEarlyDeload`, we intentionally don't delete an emptied microcycle here — regeneration's existing cleanup (`WorkoutMesocycleService.cleanUpIncompleteMicrocycles`) treats an empty `sessionOrder` as incomplete and will sweep it up on the next advance, which avoids mid-mesocycle index gaps from piecemeal deletion.
  - Call `WorkoutAPIService.queryApi(apiOptions)`.
- Update the single existing caller.

> **Circular-import note.** `microcycleMapService.svelte.ts` already imports `sessionMapService`. Adding the reverse import is worth attempting first (Svelte/Vite usually handle it fine for singleton service modules), but if load order breaks, lift the pruning step into the caller: add a small `pruneSessionFromMicrocycle(sessionId)` on `microcycleMapService` and invoke it from the delete dialog before `deleteSession`.

### Step 2 — Update the delete dialog

File: `src/pages/SessionPage/SessionPageHeader/SessionPageHeaderDeleteDialog.svelte`

- Swap `deleteFreeFormSession` for `deleteSession`.
- Compute a local `deleteContext` (`'freeForm' | 'future' | 'current' | 'deload'`) using the rules in the warning-copy table. Treat no-mesocycle (free-form) as `'freeForm'`.
- Render a single `AlertDialogDescription` that picks its text from a map keyed by `deleteContext`. Keep the base sentence short; append the extra warning only for `current`, and the reassurance only for `future`.
- For the `current` case, render the warning inside an `Alert` component (destructive variant, same pattern as `MesocyclePageActions.svelte:212`) so it reads as a real caution rather than inline copy.
- Navigation after delete: free-form still `goto('/sessions')`; mesocycle sessions use `history.back()` so the user lands on whatever view launched them (mesocycle page, sessions page, calendar).

### Step 3 — Expose the delete action on mesocycle sessions

File: `src/pages/SessionPage/SessionPageHeader/SessionPageHeader.svelte`

- Today the overflow menu is gated behind `{#if isFreeForm && session}` (line 104). Lift that gate so the `<OptionsButtonDropdownMenu>` renders whenever the menu has at least one visible item.
- Keep Rename, Reorder, Edit Session, Change Start Date, and Edit Targets free-form-only (inner `{#if isFreeForm}` blocks).
- Show Delete Session for any session where `!session.complete` — covers both free-form (matches today) and mesocycle.
- For a completed mesocycle session, no items are visible, so skip rendering the dropdown entirely. Use a `hasMenuItems` derived boolean (`isFreeForm || !session.complete`) to keep the markup readable.

### Step 4 — Sanity-check `SessionPageService`

File: `src/pages/SessionPage/SessionPageService.svelte.ts` (read-only check — no edits expected)

- `session` is `$derived` off the map; after deletion it becomes `undefined`. The dialog calls `history.back()` before Svelte has a chance to flash the "session not found" state, and `SessionPage.svelte` already guards with `{#if session}`. Verify by scanning the template; no changes planned here.

### Step 5 — Tests

- **Frontend.** There's no existing test for `deleteFreeFormSession` (no `.test.ts` sibling to `sessionMapService.svelte.ts`). Skip adding one unless nearby tests already exercise the service — don't invent a test fixture just for this change.
- **Backend.** No ts-libs edits planned, so no new tests there. Only re-run `pnpm test` in `~/Development/GithubRepos/ts-libs/packages/core-ts-db-lib` if we end up adding a backend helper.

### Step 6 — Verification

In `workout-wt-AllowForSessionDeletion/`:

```
pnpm lint --fix
pnpm check
pnpm test
pnpm dev
```

Manual smoke in the browser:

1. Active mesocycle, open an incomplete current-microcycle non-deload session → dialog shows the prediction-accuracy warning → confirm → user returns to the prior page, session + children are gone, `microcycle.sessionOrder` no longer contains the ID.
2. Incomplete session in a *future* microcycle → dialog shows the "will be regenerated" reassurance → confirm and verify same persistence outcome.
3. Incomplete session in the deload microcycle → dialog shows base copy only, no extra warning.
4. Incomplete session dated in the past → same treatment as any other incomplete session.
5. Completed mesocycle session → overflow menu does not render.
6. Free-form session → Delete still works, dialog shows base copy, navigation still goes to `/sessions`.
7. Delete a middle session in a microcycle, then open the next session → `getSessionLockReason` reflects the new previous-session state.

## Files touched

| File | Change |
| --- | --- |
| `src/services/documentMapServices/sessionMapService.svelte.ts` | Rename `deleteFreeFormSession` → `deleteSession`; prune `microcycle.sessionOrder` for mesocycle sessions. |
| `src/pages/SessionPage/SessionPageHeader/SessionPageHeaderDeleteDialog.svelte` | Call new method; classify session into freeForm/future/current/deload; adapt dialog copy and post-delete navigation. |
| `src/pages/SessionPage/SessionPageHeader/SessionPageHeader.svelte` | Render the overflow menu for any session with at least one visible item; gate Delete on `!session.complete`. |

No new files. No new components. No ts-libs changes.
