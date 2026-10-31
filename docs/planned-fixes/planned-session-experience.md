# Planned session experience

The flow for planning a session's targets (free-form planning mode and Edit Targets on an existing session) needs a broader pass. This doc collects the known problems so the effort can be scoped as a whole instead of fixed piecemeal.

## Known issues

### Edit Targets on an in-progress session hides logged values

- **Repro (free-form-workout or mid-training):** open a session that has logged sets, then Options, then Edit Targets.
- **Result:**
  - Logged sets show as blank target inputs, so there is no way to see what was already done while adjusting the rest.
  - The summary button says "Done Planning", which reads as if the session hasn't started.
  - The Sets Completed / Progress card is still shown in planning mode.
- **Files:** `src/pages/SessionPage/SessionPageSetRow.svelte` (planning mode reads only `planned*` fields), `src/pages/SessionPage/SessionPageSummaryCard.svelte` (Planning branch), `SessionPage.service.svelte.ts` (`#planning`, `handleDonePlanning`).

## Open questions

- Should Edit Targets be available on a session with logged sets at all, or only on sets that aren't logged yet?
- Should planning mode and active mode be one screen with editable targets on unlogged sets, instead of two separate modes?
