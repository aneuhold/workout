# Chunk 5: Storybook & Final Polish

## Goal

Add Storybook stories for all new features from chunks 1–4, update the Full App
story router, and run final lint/check/test passes to ensure everything is clean.

## Prerequisites

- Chunks 1–4 completed.

## Context

- Storybook stories live next to their components as `*.stories.ts` or
  `*.stories.svelte` files.
- The Full App story uses `SBFullAppRouter.svelte`
  (`src/pages/SBFullApp/SBFullAppRouter.svelte`) to simulate routing. New routes or
  route variations need branches here.
- Some stories already exist for the exercise picker dialog, free-form hero card,
  sessions page free-form section, and session page free-form exercise cards.
- When a wrapper is needed for a story, create an `SB<ComponentName>Example.svelte`
  file next to the component.
- Test data utilities are in `/test-utils` — use those for creating mock documents.

## Tasks

### 1. Exercise Reorder Dialog stories

**Location:** Next to the reorder dialog component (created in chunk 2).

Stories:
- **2 exercises:** Both arrows shown, top item has "down only", bottom has "up only".
- **5+ exercises:** Middle items show both arrows.
- **After reordering:** Show the list in a changed order (simulate a few swaps).

### 2. Planning Mode exercise card stories

**Location:** Next to `SessionPageExerciseCard` or in its existing story file.

Stories:
- **Planning — empty exercise:** 1 set, no planned values entered.
- **Planning — partially planned:** Some sets have `plannedReps`/`plannedWeight`,
  others don't.
- **Planning — fully planned:** All sets have planned values filled.
- **Planning — multiple exercises:** Show 2–3 exercise cards, all expanded and
  editable (no Done/Edit).

### 3. Session page Planning mode stories (Full App story)

**Location:** Update `SBFullAppRouter.svelte` and/or create new Full App story
variations.

Stories:
- **Planning — empty:** No exercises, just "Add Exercise" button and disabled "Save
  Planned Session".
- **Planning — exercises with planned values:** "Save Planned Session" enabled.
- **Planning — editing existing planned session:** Pre-loaded data from a saved
  planned session.

### 4. Session page overflow menu stories

**Location:** Next to `SessionPageHeader` or in the session page story file.

Stories:
- **Free-form session header:** Overflow menu visible with "Rename Session" and
  "Reorder Exercises" options.
- **Structured session header:** No overflow menu.
- **Rename dialog open:** Pre-filled with current title.

### 5. Sessions page planned sessions stories (Full App story)

Stories:
- **Mixed state:** Planned, in-progress, and completed free-form sessions all visible
  in their subsections, alongside structured mesocycle sessions.
- **Only planned sessions:** No in-progress or completed free-form.
- **No free-form sessions:** Section hidden or empty state shown.

### 6. Home page planned session card stories (Full App story)

Stories:
- **Planned session card visible:** Below hero card, with title and "Start" button.
- **No planned sessions:** Card not rendered.
- **Active mesocycle + planned session:** Both hero card and planned card visible,
  with planned card secondary.

### 7. Mesocycles page stories (Full App story)

Stories:
- **Mesocycles list:** "Plan Free-Form Workout" button visible alongside "New".
- **Empty mesocycles:** "Plan Free-Form Workout" button still visible.

### 8. Update `SBFullAppRouter`

**File:** `src/pages/SBFullApp/SBFullAppRouter.svelte`

- Ensure the router handles `/session/new` (and optional `?date=` /
  `?sessionId=` parameters) correctly, rendering the session page in Planning mode.
- If Planning mode uses in-memory state, the Storybook story may need to pre-populate
  mock data via the `SB*Example.svelte` wrapper pattern.

### 9. Run final checks

Run all three checks and fix any issues:

```bash
pnpm lint --fix
pnpm check
pnpm test
```

Fix any TypeScript errors, lint violations, or test failures that were introduced
across chunks 1–4. Common issues to watch for:
- Missing type imports for the new `SessionPageMode.Planning` value.
- Unused variables from refactored code.
- Test snapshots that need updating due to changed component output.

## Acceptance Criteria

- All new features from chunks 1–4 have Storybook stories.
- `SBFullAppRouter` handles the `/session/new` Planning mode route.
- All stories render correctly in Storybook (run `pnpm storybook` and verify).
- `pnpm lint --fix` produces no errors.
- `pnpm check` produces no errors.
- `pnpm test` produces no failures.
- No regressions in existing structured workout stories.

## Notes

- Each chunk's implementation instructions say to run `pnpm lint --fix`, `pnpm check`,
  and `pnpm test` at the end. This chunk is the final sweep to catch anything that
  slipped through, plus the comprehensive Storybook coverage pass.
- If any chunk introduced a workaround or TODO, clean it up here.
