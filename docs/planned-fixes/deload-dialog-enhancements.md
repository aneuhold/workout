# Deload dialog enhancements

## Report
1. Add a "Don't ask again for this mesocycle" checkbox to the deload dialog.
2. If the user checks that, they should be able to manually start a deload from the mesocycle screen (confirm whether that already exists).
3. Make it so the app leaves the session when the user moves out of that menu.

## Current behavior

### Deload dialog
`src/components/singletons/dialogs/SingletonDeloadDialog/SingletonDeloadDialog.svelte` — a module-level singleton exporting `deloadDialog.open(params)`. Two modes:
- **Manual** (no `severity`): "Start Deload Early" title, optional start-now/as-scheduled radio when a future `scheduledDeloadDate` is passed.
- **Fatigue warning** (`severity` set): "Deload Recommended" title, severity alert + triggered-rule bullet list.

`DeloadDialogParams` (`:19-30`): `mesocycleTitle`, `scheduledDeloadDate`, `onConfirm(choice)`, optional `severity`, `triggeredRules`. Footer is Cancel + "Start Deload" (`handleConfirm`, `:115-127`). There is **no** "don't ask again" option and **no dismiss callback** — Cancel/Escape/backdrop just sets `dialogOpen = false` and does nothing.

Four call sites:
- `src/pages/SessionPage/SessionPage.service.svelte.ts:401` — after completing a mesocycle session; if `shouldTriggerEarlyDeload`, the dialog opens and the method `return`s early (stays on the session page). `onConfirm` runs `initiateEarlyDeload` then `goto('/sessions')`. **Cancelling strands the user on the completed session page — this is the "leave the session" gap.**
- `src/pages/HomePage/HomePageHeroCard/HomePageHeroCard.svelte:130` (complete-microcycle flow) and `:211` (move-sessions dialog when a session is late).
- `src/pages/MesocyclePage/MesocyclePageActions.svelte:61` — manual start.

### Sub-part 2 already exists
`src/pages/MesocyclePage/MesocyclePageActions.svelte:128-133` already renders a **"Start Deload"** dropdown item, gated by `isActive && mesocycle.cycleType !== CycleType.FreeForm`. `handleStartDeload` (`:57-70`) computes the scheduled date, opens the dialog, and on confirm calls `mesocycleMapService.initiateEarlyDeload(...)` then `goto('/mesocycles')`. It is unconditional (not tied to any dismissal). **So sub-part 2 is essentially satisfied** — just verify it stays visible for a mesocycle whose prompt was dismissed. No new action needed.

### Per-mesocycle persistence
`~/Development/GithubRepos/ts-libs/packages/core-ts-db-lib/src/documents/workout/WorkoutMesocycle.ts` (`WorkoutMesocycleSchema:32-91`) has **no dismissal field**. The trigger is `WorkoutMesocycleService.shouldTriggerEarlyDeload` (`src/services/workout/Mesocycle/WorkoutMesocycle.service.ts:367`), a pure function over the mesocycle + its docs.

### "The session" and "leave the session when they move out of that menu"
"The session" = the `/session?sessionId=...` route rendering `SessionPage`. Entered via `goto('/session?sessionId=...')`, left via `goto('/sessions')` / `goto('/')`. "That menu" = the deload dialog opened after session completion in `handleCompleteSession` (`SessionPage.service.svelte.ts:400`). Because that method returns without navigating when the dialog opens, dismissing (Cancel/Escape) leaves the user on the session page. Desired: when dismissed without confirming, still `goto('/sessions')`.

## Implementation plan

### Library (`@aneuhold/core-ts-db-lib`)
1. Add `deloadPromptDismissed: z.boolean().default(false)` to `WorkoutMesocycleSchema` (`documents/workout/WorkoutMesocycle.ts`).
2. Add an early-return guard at the top of `shouldTriggerEarlyDeload` returning the no-deload result when `mesocycle.deloadPromptDismissed` is true — this centrally covers all fatigue-warning call sites. Add a case to `WorkoutMesocycle.service.spec.ts`.
3. Follow `~/Development/GithubRepos/ts-libs/.github/copilot-instructions.md`; run tests; wait ~6s for propagation.

### App
4. `SingletonDeloadDialog.svelte`: add a "Don't ask again for this mesocycle" checkbox, gated to **fatigue-warning mode only** (`hasFatigueWarning`) — the manual and move-dialog call sites have no `severity`, so the checkbox should not appear there. Add an optional `onDismiss` param and carry the checkbox value on confirm (extend `onConfirm` signature or add `onDontAskAgain`). Track a `confirmed` flag so dismiss vs confirm is distinguishable; fire `onDismiss` when the dialog closes unconfirmed. The dialog already forwards `...restProps` through `AlertDialog` → bits-ui `Root`, so `onOpenChange` is available.
5. `src/services/documentMapServices/MesocycleMap.service.svelte.ts`: add `dismissDeloadPrompt(id)` using the base `updateDoc` (`doc.deloadPromptDismissed = true`).
6. `SessionPage.service.svelte.ts` `handleCompleteSession`: wire the checkbox to `dismissDeloadPrompt`, and set `onDismiss: () => goto('/sessions')` so leaving the menu leaves the session. Apply the same `onDismiss`/checkbox wiring to the two `HomePageHeroCard.svelte` fatigue call sites (note their dismiss navigation differs — the home card stays on home, so its `onDismiss` should not `goto('/sessions')`).
7. Verify the existing manual "Start Deload" on `MesocyclePageActions.svelte:128-133` remains available for dismissed mesocycles.

## Key files
- App: `src/components/singletons/dialogs/SingletonDeloadDialog/SingletonDeloadDialog.svelte`, `src/pages/SessionPage/SessionPage.service.svelte.ts`, `src/pages/HomePage/HomePageHeroCard/HomePageHeroCard.svelte`, `src/pages/MesocyclePage/MesocyclePageActions.svelte`, `src/services/documentMapServices/MesocycleMap.service.svelte.ts`.
- Library: `documents/workout/WorkoutMesocycle.ts`, `services/workout/Mesocycle/WorkoutMesocycle.service.ts` (+ spec), `WorkoutMesocycle.service.types.ts`.

## Worktree note
Independent of the other fixes. Touches `SessionPage.service.svelte.ts` (also touched by the free-form persistence doc) only in `handleCompleteSession`, so low conflict risk, but be aware.

## Before done
Run `pnpm lint --fix`, `pnpm check`, `pnpm test` (app), and the library test suite.
