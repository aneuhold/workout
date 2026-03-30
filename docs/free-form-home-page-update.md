# Plan: Integrate Free-Form Workout into Hero Card

## Context

`HomePageFreeFormCard` is a standalone card sitting between the hero card and pending logs — visually awkward and architecturally inconsistent. The user wants:

1. In-progress free-form sessions shown **inside** the hero card area, but only as a fallback — any mesocycle recommendation takes priority
2. A subtle "Start Free-Form Workout" ghost button **below the QuickLinks**, hidden when already in progress
3. Delete `HomePageFreeFormCard.svelte` entirely
4. Empty state must be shown **by itself** — hero card is only rendered when it has content

---

## Files to Modify

| File                                             | Change                                                                                                           |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `src/pages/HomePage/HomePageHeroCard.svelte`     | Read free-form session from service; add `{:else if freeFormSession}` fallback branch                            |
| `src/pages/HomePage/HomePageQuickLinks.svelte`   | Read from service; add conditional ghost "Start Free-Form Workout" button below the grid                         |
| `src/pages/HomePage/HomePage.svelte`             | Add third branch for free-form-only case; remove `<HomePageFreeFormCard />`                                      |
| `src/pages/HomePage/HomePageEmptyState.svelte`   | Remove `HomePageFreeFormCard`; always show both buttons (empty state only renders when no free-form in progress) |
| `src/pages/HomePage/HomePageFreeFormCard.svelte` | **Delete**                                                                                                       |
| `src/pages/HomePage/SB/SBHomePageExample.svelte` | Remove free-form card story refs; add story mode for no-mesocycle + free-form in progress                        |

---

## Detailed Changes

### 1. `HomePageHeroCard.svelte` — new fallback branch

**Priority order** (no changes to existing `getHeroCardState` logic):

1. Mesocycle `inProgressSession` → ContinueSession
2. Any mesocycle recommendation (StartSession, CompleteMicrocycle, etc.) → those states
3. **`state === null` AND free-form in progress → "Continue Free-Form Workout" card**
4. `state === null` AND no free-form → renders nothing (unchanged)

Implementation:

- Import `sessionMapService`
- Add derived free-form data:
  ```ts
  const freeFormSession = $derived(sessionMapService.freeFormSessions.inProgress);
  const freeFormExercises = $derived(
    freeFormSession ? sessionMapService.getOrderedSessionExercisesForSession(freeFormSession) : []
  );
  const freeFormSets = $derived(
    freeFormSession ? sessionMapService.getOrderedSetsForSession(freeFormSession) : []
  );
  const freeFormCompleted = $derived(countCompletedSets(freeFormSets));
  const freeFormPercent = $derived(
    freeFormSets.length > 0 ? Math.round((freeFormCompleted / freeFormSets.length) * 100) : 0
  );
  ```
- Change `{#if state}...{/if}` to:
  ```svelte
  {#if state}
    ... existing blocks unchanged ...
  {:else if freeFormSession}
    <Card class="ring-1 ring-foreground/10">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold">Free-Form Workout</span>
            <Badge variant="secondary" class="text-xs">In Progress</Badge>
          </div>
          <Button size="sm" href="/session?sessionId={freeFormSession._id}">
            Continue <IconChevronRight size={14} />
          </Button>
        </div>
      </CardHeader>
      <CardContent class="flex flex-col gap-2">
        <span class="text-sm font-medium">{freeFormSession.title}</span>
        {#if freeFormSets.length > 0}
          <Progress value={freeFormPercent} max={100} class="h-1.5" />
          <span class="text-xs text-muted-foreground">
            {freeFormCompleted}/{freeFormSets.length} sets · {freeFormExercises.length} exercises
          </span>
        {:else}
          <span class="text-xs text-muted-foreground">
            {freeFormExercises.length} exercises · No sets yet
          </span>
        {/if}
      </CardContent>
    </Card>
  {/if}
  ```

### 2. `HomePageQuickLinks.svelte` — add ghost button below grid

- Import `sessionMapService` and `goto`
- Add `handleStartFreeForm` function (create session → navigate)
- Wrap in `flex flex-col gap-2`; add ghost button below the grid:
  ```svelte
  <div class="flex flex-col gap-2">
    <div class="grid grid-cols-2 gap-2">... existing buttons unchanged ...</div>
    {#if !sessionMapService.freeFormSessions.inProgress}
      <Button variant="ghost" class="text-muted-foreground" onclick={handleStartFreeForm}>
        Start Free-Form Workout
      </Button>
    {/if}
  </div>
  ```

### 3. `HomePage.svelte` — three-branch structure

Hero card is only rendered when it has content. Empty state is shown alone.

```svelte
<div class="flex flex-col gap-4 p-4">
  {#if activeMesocycle && docs}
    <HomePageMesocycleOverview ... />
    <HomePageHeroCard
      {activeMesocycle}
      {microcycles}
      sessions={docs.sessions}
      {inProgressSession}
      {nextUpSession}
      {pendingLogs}
    />
    {#if pendingLogs.length}
      <HomePagePendingLogs {pendingLogs} />
    {/if}
    {#if currentMicrocycleInfo}
      <HomePageWeekSessions ... />
    {/if}
    {#if allRecentSessions.length}
      <HomePageRecentSessions ... />
    {/if}
    <HomePageQuickLinks />
  {:else if sessionMapService.freeFormSessions.inProgress}
    <HomePageHeroCard
      activeMesocycle={null}
      microcycles={[]}
      sessions={[]}
      inProgressSession={null}
      nextUpSession={null}
      pendingLogs={[]}
    />
  {:else}
    <HomePageEmptyState />
  {/if}
</div>
```

Remove `<HomePageFreeFormCard />` and its import.

### 4. `HomePageEmptyState.svelte` — simplified

- Remove `HomePageFreeFormCard` import and usage
- `readyButtons` is a static array with both buttons (empty state only renders when no free-form is in progress, so the conditional is unnecessary):
  ```ts
  // No longer needs $derived.by — always show both buttons
  const readyButtons = [
    {
      label: 'View Mesocycles',
      onclick: () => {
        goto('/mesocycles');
      }
    },
    { label: 'Start Free-Form Workout', onclick: handleStartFreeForm }
  ];
  ```
- Keep `handleStartFreeForm` in the component

### 5. Delete `HomePageFreeFormCard.svelte`

### 6. Update `SBHomePageExample.svelte` / stories

- Remove any `HomePageFreeFormCard` references
- Add story mode for "No mesocycle, free-form in progress" to show the new hero card fallback branch
- Ensure existing story modes still work

---

## Verification

1. `pnpm lint --fix && pnpm check && pnpm test`
2. Storybook: hero card shows free-form card in the new story mode; QuickLinks ghost button hidden when free-form in progress
3. Empty state renders alone (no hero card) when there's no mesocycle and no free-form in progress
