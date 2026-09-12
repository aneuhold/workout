<!--
  @component

  Free-form sessions section on the sessions page. Shows planned, in-progress,
  and completed free-form sessions in separate subsections, each with independent
  pagination. Provides buttons to start a new workout or plan a future one.
-->
<script lang="ts">
  import type { WorkoutSession } from '@aneuhold/core-ts-db-lib';
  import { WorkoutSetService } from '@aneuhold/core-ts-db-lib';
  import { IconCalendar, IconPlus } from '@tabler/icons-svelte';
  import { goto } from '$app/navigation';
  import SessionCard from '$components/SessionCard/SessionCard.svelte';
  import { SessionStatus } from '$components/SessionCard/sessionCardTypes';
  import exerciseMapService from '$services/documentMapServices/ExerciseMap.service.svelte';
  import sessionMapService from '$services/documentMapServices/SessionMap.service.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Pagination from '$ui/Pagination/Pagination.svelte';
  import PaginationContent from '$ui/Pagination/PaginationContent.svelte';
  import PaginationEllipsis from '$ui/Pagination/PaginationEllipsis.svelte';
  import PaginationItem from '$ui/Pagination/PaginationItem.svelte';
  import PaginationLink from '$ui/Pagination/PaginationLink.svelte';
  import PaginationNext from '$ui/Pagination/PaginationNext.svelte';
  import PaginationPrevious from '$ui/Pagination/PaginationPrevious.svelte';

  const PAGE_SIZE = 5;

  const { freeFormSessions } = sessionMapService;

  // --- Per-subsection page counters ---
  let plannedPage = $state(1);
  let inProgressPage = $state(1);
  let completedPage = $state(1);

  // --- In-Progress subsection ---
  const inProgressTotalPages = $derived(Math.ceil(freeFormSessions.inProgress.length / PAGE_SIZE));
  const showInProgressPagination = $derived(inProgressTotalPages > 1);
  const paginatedInProgress = $derived(
    freeFormSessions.inProgress.slice((inProgressPage - 1) * PAGE_SIZE, inProgressPage * PAGE_SIZE)
  );

  $effect(() => {
    if (inProgressPage > inProgressTotalPages && inProgressTotalPages > 0) {
      inProgressPage = 1;
    }
  });

  // --- Planned subsection ---
  const plannedTotalPages = $derived(Math.ceil(freeFormSessions.planned.length / PAGE_SIZE));
  const showPlannedPagination = $derived(plannedTotalPages > 1);
  const paginatedPlanned = $derived(
    freeFormSessions.planned.slice((plannedPage - 1) * PAGE_SIZE, plannedPage * PAGE_SIZE)
  );

  $effect(() => {
    if (plannedPage > plannedTotalPages && plannedTotalPages > 0) {
      plannedPage = 1;
    }
  });

  // --- Completed subsection ---
  const completedTotalPages = $derived(Math.ceil(freeFormSessions.completed.length / PAGE_SIZE));
  const showCompletedPagination = $derived(completedTotalPages > 1);
  const paginatedCompleted = $derived(
    freeFormSessions.completed.slice((completedPage - 1) * PAGE_SIZE, completedPage * PAGE_SIZE)
  );

  $effect(() => {
    if (completedPage > completedTotalPages && completedTotalPages > 0) {
      completedPage = 1;
    }
  });

  /**
   * Returns the in-progress status for a session based on whether any set has
   * been completed.
   *
   * @param session The session to check
   */
  function getInProgressStatus(session: WorkoutSession): SessionStatus {
    const sets = sessionMapService.getOrderedSetsForSession(session);
    return sets.some((s) => WorkoutSetService.isCompleted(s))
      ? SessionStatus.InProgress
      : SessionStatus.NextUp;
  }

  function handleStartFreeForm() {
    const session = sessionMapService.createFreeFormSession();
    void goto(`/session?sessionId=${session._id}`);
  }
</script>

<div class="flex flex-col gap-4">
  <!-- Header with action buttons -->
  <div class="flex flex-wrap items-center gap-2">
    <h2 class="flex-1 text-sm font-semibold">Free-Form Sessions</h2>
    <div class="flex shrink-0 items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={!exerciseMapService.hasAny}
        onclick={() => sessionMapService.planNewFreeFormSession()}
      >
        <IconCalendar size={14} />
        Plan New Workout
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={!exerciseMapService.hasAny}
        onclick={handleStartFreeForm}
      >
        <IconPlus size={14} />
        Start New Workout
      </Button>
    </div>
  </div>

  <!-- In Progress subsection -->
  {#if freeFormSessions.inProgress.length > 0}
    <div class="flex flex-col gap-2">
      <span class="text-xs font-medium text-muted-foreground">In Progress</span>
      {#each paginatedInProgress as session (session._id)}
        <SessionCard
          {session}
          status={getInProgressStatus(session)}
          sessionExercises={sessionMapService.getOrderedSessionExercisesForSession(session)}
          sets={sessionMapService.getOrderedSetsForSession(session)}
        />
      {/each}
      {#if showInProgressPagination}
        <Pagination
          bind:page={inProgressPage}
          count={freeFormSessions.inProgress.length}
          perPage={PAGE_SIZE}
        >
          {#snippet children({ pages })}
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious />
              </PaginationItem>
              {#each pages as p (p.key)}
                {#if p.type === 'page'}
                  <PaginationItem>
                    <PaginationLink page={p} isActive={inProgressPage === p.value} />
                  </PaginationItem>
                {:else}
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                {/if}
              {/each}
              <PaginationItem>
                <PaginationNext />
              </PaginationItem>
            </PaginationContent>
          {/snippet}
        </Pagination>
      {/if}
    </div>
  {/if}

  <!-- Planned subsection -->
  {#if freeFormSessions.planned.length > 0}
    <div class="flex flex-col gap-2">
      <span class="text-xs font-medium text-muted-foreground">Planned</span>
      {#each paginatedPlanned as session (session._id)}
        <SessionCard
          {session}
          status={SessionStatus.Upcoming}
          sessionExercises={sessionMapService.getOrderedSessionExercisesForSession(session)}
          sets={sessionMapService.getOrderedSetsForSession(session)}
        />
      {/each}
      {#if showPlannedPagination}
        <Pagination
          bind:page={plannedPage}
          count={freeFormSessions.planned.length}
          perPage={PAGE_SIZE}
        >
          {#snippet children({ pages })}
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious />
              </PaginationItem>
              {#each pages as p (p.key)}
                {#if p.type === 'page'}
                  <PaginationItem>
                    <PaginationLink page={p} isActive={plannedPage === p.value} />
                  </PaginationItem>
                {:else}
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                {/if}
              {/each}
              <PaginationItem>
                <PaginationNext />
              </PaginationItem>
            </PaginationContent>
          {/snippet}
        </Pagination>
      {/if}
    </div>
  {/if}

  <!-- Completed subsection -->
  {#if freeFormSessions.completed.length > 0}
    <div class="flex flex-col gap-2">
      <span class="text-xs font-medium text-muted-foreground">Completed</span>
      {#each paginatedCompleted as session (session._id)}
        <SessionCard
          {session}
          status={SessionStatus.Completed}
          sessionExercises={sessionMapService.getOrderedSessionExercisesForSession(session)}
          sets={sessionMapService.getOrderedSetsForSession(session)}
        />
      {/each}
      {#if showCompletedPagination}
        <Pagination
          bind:page={completedPage}
          count={freeFormSessions.completed.length}
          perPage={PAGE_SIZE}
        >
          {#snippet children({ pages })}
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious />
              </PaginationItem>
              {#each pages as p (p.key)}
                {#if p.type === 'page'}
                  <PaginationItem>
                    <PaginationLink page={p} isActive={completedPage === p.value} />
                  </PaginationItem>
                {:else}
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                {/if}
              {/each}
              <PaginationItem>
                <PaginationNext />
              </PaginationItem>
            </PaginationContent>
          {/snippet}
        </Pagination>
      {/if}
    </div>
  {/if}

  {#if freeFormSessions.inProgress.length === 0 && freeFormSessions.planned.length === 0 && freeFormSessions.completed.length === 0}
    <p class="text-xs text-muted-foreground">No free-form sessions yet.</p>
  {/if}
</div>
