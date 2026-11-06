# UX pass findings

Issues found by clicking through every Full App Storybook scenario at a 390x844 phone viewport (2026-10-29), plus issues reported directly. Each item lists the repro steps, what happens, and the likely file(s).

- The deload start date issue lives in [deload-dialog-enhancements.md](deload-dialog-enhancements.md).
- ✅ marks items that are done.
- Verification status: #8 is confirmed in code. The rest were reproduced twice in Storybook but not yet traced in code.
- Screenshots are in [`docs/images/ux-pass/`](../images/ux-pass/).

If you are a bot tasked with doing one or a few of these, know that the workout work tree + folder is already subscribed and hooked up to /Users/aneuhold/Development/GithubRepos/ts-libs-wt-BugFixesForWorkoutApp as far as ts-libs. So if ts-libs needs to be updated, it can be done in that folder. After you are done completing something, and the user has committed it, then mark it with ✅ in this doc.

## Bugs: wrong data or broken flow

### 1. ✅ Start Deload deletes an in-progress session with logged sets

- **Repro (mid-training):** Plan, then Bulking 4, then Options, then Start Deload, then Start Deload.
- **Result:** Microcycle 2 - Session 4, which had 2 of 5 sets logged, disappears. Week 2 now shows 3/3. Neither deload dialog mentions this, while End Mesocycle does warn about discarding incomplete sessions.
- **Files:** `initiateEarlyDeload` treats every `!session.complete` session as discardable. Dialog: `SingletonDeloadDialog.svelte`.

### 2. ✅ Cancelling the deload prompt after completing a session leaves you on the completed session

- **Repro (deload-trigger):** finish the session, then Complete Session. The "Deload Recommended" dialog opens. Make a selection and then Cancel, or Cancel directly.
- **Result:** the dialog closes and you stay on the just-completed session, now in review mode. Completing a session without the prompt navigates away.
- **Expected:** you end up on Home, same as a normal completion.
- **Cause:** `handleCompleteSession` in `src/pages/SessionPage/SessionPage.service.svelte.ts` opens `deloadDialog` and returns without navigating. Only `onConfirm` navigates. See #3 for a shared fix. This overlaps with item 3 in [deload-dialog-enhancements.md](deload-dialog-enhancements.md), which proposes `/sessions` as the destination instead of Home.

### 3. ✅ Completing a session briefly shows review mode before navigating

- **Repro (any scenario with an active session):** log all sets, fill the sliders, then Complete Session.
- **Result:** for a moment the session page switches to the post-workout review mode before the navigation finishes.
- **Expected:** go straight to Home with no intermediate review state.
- **Cause:** `handleCompleteSession` sets `doc.complete = true` first, which flips `dataMode` to Review and re-renders the page, then calls `goto`. The navigation target is also inconsistent: mesocycle sessions go to `/sessions` and free-form sessions go to `/`.
- **Possible fix for #2 and #3:** navigate to Home first, then mark the session complete and run the early-deload check. The deload dialog is a layout-level singleton, so it can open on Home. Cancelling it then leaves the user on Home.

### 4. ✅ Negative reps can be logged

- **Repro (free-form-workout or mid-training):** type -3 in the reps field of a set row, then Log, then Confirm.
- **Result:** the set saves with "-3 reps". `min={0}` on the input is not enforced.
- **Note:** negative weight is intentionally allowed (for example assisted exercises). Only reps need a floor.
- **Files:** `src/pages/SessionPage/SessionPageSetRow.svelte` (`canLog` around L66, `handleConfirm`).

### 5. ✅ Deleting an exercise leaves "Unknown Exercise" in sessions

- **Repro (mid-training):** Library, then Barbell Row, then Delete, then Delete. Go Home, then Continue.
- **Result:** the session shows "Unknown Exercise" with its logged sets. The same happens to Push Day after deleting Bench Press. The dialog only warns about calibration data. Deleting an in-use muscle group or equipment is blocked, but deleting an in-use exercise is not.
- **Files:** `SingletonDeleteDialog.svelte:83`, `SessionPageExerciseCardHeader.svelte:50`.

### 6. ✅ Calendar day popup ignores logged sets for in-progress sessions

- **Repro (mid-training):** Plan, then Session Calendar, then tap 22 or 29.
- **Result:** Session 4 (Barbell Row logged 135x16 and 135x14) shows "Projected targets 15/13". Push Day (4 sets logged) shows every set as "— reps — lb". Completed free-form sessions show a meaningless "plan: — reps — lb — RIR" line on every set.
- **Files:** `src/components/WorkoutCalendar/shared/WorkoutCalendarDayDetailDialog.svelte` (around L91 to 118), `SessionCalendar/WorkoutSessionCalendar.svelte:90`.

<img src="../images/ux-pass/session-calendar.png" alt="session-calendar" width="260"> <img src="../images/ux-pass/session-calendar2.png" alt="session-calendar2" width="260">

### 7. ✅ Deload weight is higher than the heaviest accumulation week

- **Repro:** mesocycle-start, then Start Mesocycle, then Plan, then open the mesocycle and view the Progression table.
- **Result:** Barbell Squat C5 is 235 lb, then the deload row is 245. Bulgarian Split Squat is 50 in the deload, then 45 on set 2.
- **Cause:** `#generateSetRepsAndWeight` in ts-libs `Set/WorkoutSet.service.ts` (around L202) starts the deload from the next progressed weight, while its comment says "same weight".

### 8. ✅ No date picker highlights the selected date

- **Where:** Session, then Change Start Date; Mesocycle, then Start Date. The selected day renders with a transparent background.
- **Cause:** `src/globalStyles/shadcnV4Tailwind.css:61` defines `@custom-variant data-selected` as `[data-selected="true"]`. bits-ui sets `data-selected=""` (`boolToEmptyStrOrUndef`), so `data-selected:bg-primary` in `src/components/ui/Calendar/CalendarDay.svelte:19` never applies.

<img src="../images/ux-pass/change-start-date.png" alt="change-start-date" width="260"> <img src="../images/ux-pass/edit-meso-date-picker.png" alt="edit-meso-date-picker" width="260">

## Usability: confusing or awkward

### 9. ✅ Remove the confirmation dialog for logging a set

- **Current:** tapping Log on a set row opens an "are you sure" dialog showing the values, and the set is saved only after Confirm.
- **Expected:** Log saves the set immediately. The confirmation step exists for a reason that no longer applies.
- **Files:** `src/pages/SessionPage/SessionPageSetRow.svelte`: `handleLogClick` opens the dialog, `handleConfirm` calls `onLog`, and the `AlertDialog` is around L270 to 297.

### 10. ✅ No way to finish a mesocycle session with a skipped set, and no hint why

Complete Session stays disabled until every set is logged. A hint shows only for unfilled sliders, not for incomplete sets, and there is no skip or remove set option. Complete Review is likewise disabled with no hint.

- **File:** `SessionPageSummaryCard.svelte`.

### 11. ✅ Complete Review gives no feedback

The button disappears and the page stays put, while Complete Session navigates away.

- **Files:** `SessionPageSummaryCard.svelte`, `SessionPage.service.svelte.ts`.

### 12. ✅ Exercise page "Done" always goes to Library

It ignores where the user came from: mid-workout via "View exercise details", or the onboarding "Create exercise" step.

- **File:** `src/pages/ExercisePage/ExercisePageViewMode.svelte:116` (`goto('/library')`).

### 13. ✅ The Sessions tab opens the in-progress session instead of the list

With an in-progress session, tapping Sessions again on that page does nothing. The list is reachable only through "View All Sessions".

- **File:** `src/components/NavBar/NavBar.svelte:33-46`.

### 14. ✅ The deload week has two names

After a deload starts, Home says "This Week · Week 3" while Sessions says "Deload". Sessions in both are named "Microcycle 3 - Session N".

### 15. ✅ Locked sessions look actionable

- **Repro (very-late-session):** load Home without advancing.
- **Result:** the hero card says "Microcycle 2 Complete! Your next session will be ready after advancing." Directly below, "This Week · Week 3" lists Microcycle 3 - Session 1 with a green "Next" badge and a highlighted border, so it reads as the session to start. Tapping it opens the session page with "Advance to the next microcycle from the home page to unlock this session." The page still renders every exercise with its targets and the RSM/Fatigue/Soreness sliders, all showing "Not Set".
- **Expected:** until the user advances, the upcoming week's sessions look locked (no "Next" badge, muted or with a lock icon), and the locked session page doesn't present feedback sliders that can't be used yet.
- **Files:** Home week list in `src/pages/HomePage/`, lock handling via `lockReason` in `SessionPage.service.svelte.ts`.

<img src="../images/ux-pass/locked-session-home.png" alt="locked-session-home" width="260"> <img src="../images/ux-pass/locked-session-page.png" alt="locked-session-page" width="260">

### 16. ✅ "Create Mesocycle" does not explain why it is disabled

The button is hidden until an exercise is selected. When it is disabled for a blank title, no message shows near it, and the "Required" error is about 2,500 px above with no scroll or focus.

### 17. ✅ Delete on an in-use muscle group or equipment explains itself only in a hover tooltip

The explanation is a `title` attribute, which never shows on a phone.

- **Files:** `LibraryPageMuscleGroupCard.svelte:119`, `LibraryPageEquipmentCard.svelte:98`.

### 18. ✅ Cancel on the second late-session/deload dialog closes everything

It should return to the three-option choice instead.

### 19. ✅ Abandoned free-form workouts pile up

- **Repro:** Start New Workout, then leave the page without adding anything. Repeat.
- **Result:** each attempt leaves another empty "October 29 Workout" under Planned.
- **Cause:** `createFreeFormSession` in `src/services/documentMapServices/SessionMap.service.svelte.ts` persists the session immediately, before the user adds anything.
- **Proposed fix:** when the user leaves the session page, delete the free-form session if it has no session exercises. This keeps the current "create, then navigate by ID" flow intact, and covers every entry point (`HomePageEmptyState`, `HomePageQuickLinks`, `SessionsPageFreeFormSection`, `OnboardingChecklist`, `planNewFreeFormSession`). A session with at least one exercise is kept, since the user did start planning it.

### 20. Svelte `derived_inert` warnings flood the console

Leaving or reviewing a session prints roughly 48 to 430 warnings per action, starting from the second review in review-pending. Adding exercises and expanding Library cards also trigger it.

- **Stack:** `immediateFieldState` in `SessionPageExerciseCard.svelte` (around L413), read by `SessionPageExerciseCardRsmSliders.svelte:65/102` and `SessionPageSliderField.svelte:141` after the card is destroyed.

### 21. ✅ Storybook Full App: top bar covers the page while the rest timer runs

- **Repro (any Full App story):** start the rest timer, then go to Library.
- **Result:** the top bar becomes `fixed` and covers the page heading and the "Library / Add" controls.
- **Cause:** `src/routes/(app)/+layout.svelte` adds `pt-top-nav` to `<main>` when the timer is active, but `src/pages/SBFullApp/SBFullAppShell.svelte` (around L43) duplicates the `<main>` markup without that condition. Sharing the layout's `<main>` logic with the Storybook shell would keep them from drifting.

<img src="../images/ux-pass/timer-active-library.png" alt="timer-active-library" width="260">

## Polish: visual and wording

### 23. ✅ Missing space before "@" in targets

"Target: 45lb x 20@ 3 RIR", "20 reps@ 3 RIR" (`SessionPageSetRow.svelte` around L242 and L272). The Edit Set dialog renders "18 @ 3".

### 24. No pluralization

"1 exercises · 1 sets" in `src/components/SessionCard/SessionCard.svelte:95-131`.

- **Follow-up:** do an impact analysis for a global fix (for example a shared pluralization helper) before fixing this one spot. Count how many places build "N thing(s)" strings by hand and whether they share a pattern.

### 25. Mixed date formats

"10/15/2026" (`SessionPageExerciseCardPrevSoreness.svelte:32`) and "on 10/29/2026" / "12/14/2025" on the exercise page and Library, versus "Oct 22, 2026" elsewhere.

### 26. Hero card repeats itself

"13 days late" and "Scheduled for Oct 16 — 13 days behind" show together.

### 27. A long single-word session title causes horizontal scroll

It pushes Options off-screen (`SessionPageHeader.svelte`). Multi-word titles wrap fine.

<img src="../images/ux-pass/long-title-session-overflow.png" alt="long-title-session-overflow" width="260">

### 28. Accessibility and markup

- Icon-only buttons have no `aria-label`: session back arrow, set edit pencil, set remove minus, info icons.
- Buttons are nested inside buttons: the date-picker trigger in Change Start Date, and the mesocycle exercise rows that wrap a switch.
- The Session Calendar's accessible name is "Event Oct 2026".
- The Mesocycles list card is a clickable `div`, not a link.

### 29. Mesocycle progress bar shows 100% before the deload is done

The bar is full at "Week 3 of 3" before any deload session is complete.

## Storybook-only behavior (not app bugs)

- Scroll position carries over between pages in the story router.
- Mock data quirks: the free-form-workout session is titled "March 29 Workout", bodyweight Pull-ups are logged at 135 lb, and review-pending has week-2 sessions done before advancing.
- Exercise strength history is empty for seeded data. Live-logged sets appear correctly.

## Not covered

- Analytics (placeholder behind the Supporter check).
- The Supporter paywall (the mock user is already a Supporter).
- The rest timer completion alert.
- Backend sync and conflicts (no API in Storybook).
- Logout and delete account.
- Drag reordering.
- Desktop layout.
