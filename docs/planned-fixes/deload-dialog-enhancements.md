# Deload dialog enhancements

## Report
1. Add a "Don't ask again for this mesocycle" checkbox to the deload dialog.
2. If the user checks that, they should be able to manually start a deload from the mesocycle screen (confirm whether that already exists).
3. ✅ Make it so the app leaves the session when the user moves out of that menu.

## Current behavior

### Deload dialog
`src/components/singletons/dialogs/SingletonDeloadDialog/SingletonDeloadDialog.svelte` — a module-level singleton exporting `deloadDialog.open(params)`. Two modes:
- **Manual** (no `severity`): "Start Deload Early" title, optional start-now/as-scheduled radio when a future `scheduledDeloadDate` is passed.
- **Fatigue warning** (`severity` set): "Deload Recommended" title, severity alert + triggered-rule bullet list.

`DeloadDialogParams`: `mesocycleId`, `scheduledDeloadDate`, optional `onDeloadStarted`, `severity`, `triggeredRules`. Footer is Cancel + "Start Deload". `handleConfirm` calls `mesocycleMapService.initiateEarlyDeload` itself, then `onDeloadStarted`. There is **no** "don't ask again" option and **no dismiss callback**: Cancel/Escape/backdrop just sets `dialogOpen = false` and does nothing.

Four call sites:
- `src/pages/SessionPage/SessionPage.service.svelte.ts` `handleCompleteSession`: navigates to Home first, then marks the session complete and, for a mesocycle session where `shouldTriggerEarlyDeload` is true, opens the dialog. The dialog therefore always opens on Home, and confirming or dismissing it leaves the user there.
- `src/pages/HomePage/HomePageHeroCard/HomePageHeroCard.svelte:130` (complete-microcycle flow) and `:211` (move-sessions dialog when a session is late).
- `src/pages/MesocyclePage/MesocyclePageActions.svelte:61` — manual start.

### Sub-part 2 already exists
`src/pages/MesocyclePage/MesocyclePageActions.svelte:128-133` already renders a **"Start Deload"** dropdown item, gated by `isActive && mesocycle.cycleType !== CycleType.FreeForm`. `handleStartDeload` (`:57-70`) computes the scheduled date, opens the dialog, and on confirm calls `mesocycleMapService.initiateEarlyDeload(...)` then `goto('/mesocycles')`. It is unconditional (not tied to any dismissal). **So sub-part 2 is essentially satisfied** — just verify it stays visible for a mesocycle whose prompt was dismissed. No new action needed.

### Per-mesocycle persistence
`~/Development/GithubRepos/ts-libs/packages/core-ts-db-lib/src/documents/workout/WorkoutMesocycle.ts` (`WorkoutMesocycleSchema:32-91`) has **no dismissal field**. The trigger is `WorkoutMesocycleService.shouldTriggerEarlyDeload` (`src/services/workout/Mesocycle/WorkoutMesocycle.service.ts:367`), a pure function over the mesocycle + its docs.

### Sub-part 3 is done
Completing any session (mesocycle or free-form) navigates to Home before the deload check runs, so the post-completion deload dialog opens on Home and no dialog callback is needed to leave the session. Fixed together with #2 and #3 in [ux-pass-findings.md](ux-pass-findings.md).

## Related: "Start deload now" does not start today

- **Repro (very-late-session):** Advance to Next Microcycle, then Start Session, then "Start deload", then Confirm. The second dialog says "The deload will start today (Oct 29, 2026)". Tap Start Deload.
- **Result:** the hero still says "13 days late, Scheduled for Oct 16". Start Session opens the late dialog again, which says the mesocycle ends Oct 22 (in the past). The Plan calendar shows the deload on Oct 15 to 21.
- **Same behavior elsewhere:**
  - deload-trigger: Complete Session, then "Deload Recommended", then Start Deload. Result: "6 days late, scheduled Oct 23".
  - mid-training: Mesocycle page, then Options, then Start Deload, then "Start now". The deload lands on Oct 25 to 31.
- **Cause:** `WorkoutMesocycleService.generateOrUpdateMesocycle` in ts-libs `WorkoutMesocycle.service.ts` (around L146 to 152) ignores `startDate` when microcycles already exist and continues from the last microcycle's `endDate`. Called from `initiateEarlyDeload` in `src/services/documentMapServices/MesocycleMap.service.svelte.ts`.

<img src="../images/ux-pass/plan-after-deload.png" alt="plan-after-deload" width="260"> <img src="../images/ux-pass/very-late-hero.png" alt="very-late-hero" width="260">

Found in the UX pass ([ux-pass-findings.md](ux-pass-findings.md)). The fix approach is still open: the dialog promises "today", but generation always appends the deload after the existing microcycles.

## Implementation plan

### Library (`@aneuhold/core-ts-db-lib`)
1. Add `deloadPromptDismissed: z.boolean().default(false)` to `WorkoutMesocycleSchema` (`documents/workout/WorkoutMesocycle.ts`).
2. Add an early-return guard at the top of `shouldTriggerEarlyDeload` returning the no-deload result when `mesocycle.deloadPromptDismissed` is true — this centrally covers all fatigue-warning call sites. Add a case to `WorkoutMesocycle.service.spec.ts`.
3. Follow `~/Development/GithubRepos/ts-libs/.github/copilot-instructions.md`; run tests; wait ~6s for propagation.

### App
4. `SingletonDeloadDialog.svelte`: add a "Don't ask again for this mesocycle" checkbox, gated to **fatigue-warning mode only** (`hasFatigueWarning`) — the manual and move-dialog call sites have no `severity`, so the checkbox should not appear there. Report the checkbox value whenever the dialog closes, whether the user confirms or cancels (for example an optional `onDontAskAgain` param). Checking the box and then cancelling is the main use case. The dialog already forwards `...restProps` through `AlertDialog` to the bits-ui `Root`, so `onOpenChange` is available.
5. `src/services/documentMapServices/MesocycleMap.service.svelte.ts`: add `dismissDeloadPrompt(id)` using the base `updateDoc` (`doc.deloadPromptDismissed = true`).
6. Wire the checkbox to `dismissDeloadPrompt` in `SessionPage.service.svelte.ts` `handleCompleteSession` and in the `HomePageHeroCard.svelte` fatigue call sites. No navigation is needed on dismiss, since every fatigue-warning call site already runs on Home.
7. Verify the existing manual "Start Deload" on `MesocyclePageActions.svelte:128-133` remains available for dismissed mesocycles.

## Key files
- App: `src/components/singletons/dialogs/SingletonDeloadDialog/SingletonDeloadDialog.svelte`, `src/pages/SessionPage/SessionPage.service.svelte.ts`, `src/pages/HomePage/HomePageHeroCard/HomePageHeroCard.svelte`, `src/pages/MesocyclePage/MesocyclePageActions.svelte`, `src/services/documentMapServices/MesocycleMap.service.svelte.ts`.
- Library: `documents/workout/WorkoutMesocycle.ts`, `services/workout/Mesocycle/WorkoutMesocycle.service.ts` (+ spec), `WorkoutMesocycle.service.types.ts`.

## Worktree note
Independent of the other fixes. Touches `SessionPage.service.svelte.ts` (also touched by the free-form persistence doc) only in `handleCompleteSession`, so low conflict risk, but be aware.

## Before done
Run `pnpm lint --fix`, `pnpm check`, `pnpm test` (app), and the library test suite.
