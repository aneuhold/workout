<!--
  @component

  Header for the session page with back button, title/description, overflow menu,
  and "View All Sessions" button.
  For free-form sessions, shows a 3-dot overflow menu with rename, reorder, edit, and delete actions.
-->
<script lang="ts">
  import type { WorkoutSession } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import { goto } from '$app/navigation';
  import BackButton from '$components/BackButton/BackButton.svelte';
  import OptionsButtonDropdownMenu from '$components/OptionsButtonDropdownMenu/OptionsButtonDropdownMenu.svelte';
  import exerciseMapService from '$services/documentMapServices/ExerciseMap.service.svelte';
  import sessionExerciseMapService from '$services/documentMapServices/SessionExerciseMap.service.svelte';
  import sessionMapService from '$services/documentMapServices/SessionMap.service.svelte';
  import Button from '$ui/Button/Button.svelte';
  import DropdownMenuItem from '$ui/DropdownMenu/DropdownMenuItem.svelte';
  import SessionPageReorderDialog from '../SessionPageReorderDialog.svelte';
  import { SessionPageMode } from '../sessionPageTypes';
  import SessionPageHeaderChangeStartDateDialog from './SessionPageHeaderChangeStartDateDialog.svelte';
  import SessionPageHeaderDeleteDialog from './SessionPageHeaderDeleteDialog.svelte';
  import SessionPageHeaderRenameDialog from './SessionPageHeaderRenameDialog.svelte';

  let {
    title,
    description,
    isFreeForm = false,
    mode = SessionPageMode.Active,
    session = undefined
  }: {
    title: string;
    description?: string | null;
    isFreeForm?: boolean;
    mode?: SessionPageMode;
    session?: WorkoutSession;
  } = $props();

  let renameDialogOpen = $state(false);
  let deleteDialogOpen = $state(false);
  let reorderDialogOpen = $state(false);
  let changeStartDateDialogOpen = $state(false);

  const formattedStartDate = $derived(
    session?.startTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) ?? ''
  );

  const hasMenuItems = $derived(!!session && (isFreeForm || !session.complete));

  const exerciseOrderItems = $derived.by(() => {
    if (!session) return [];
    return session.sessionExerciseOrder.flatMap((seId) => {
      const se = sessionExerciseMapService.getDoc(seId);
      if (!se) return [];
      const exercise = exerciseMapService.getDoc(se.workoutExerciseId);
      if (!exercise) return [];
      return [{ id: seId, name: exercise.exerciseName }];
    });
  });

  /**
   * Persists the new exercise order to the session.
   *
   * @param newOrder The reordered session exercise IDs
   */
  function handleReorderSave(newOrder: UUID[]) {
    if (!session) return;
    sessionMapService.updateDoc(session._id, (doc) => {
      doc.sessionExerciseOrder = newOrder;
      return doc;
    });
  }

  /**
   * Re-opens a completed session for editing by setting complete = false.
   */
  function handleEditSession() {
    if (!session) return;
    sessionMapService.updateDoc(session._id, (doc) => {
      doc.complete = false;
      return doc;
    });
  }
</script>

<div class="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
  <BackButton />
  <div class="flex items-center gap-2">
    <div class="flex min-w-0 flex-1 flex-col">
      <div class="flex flex-wrap items-baseline gap-x-2">
        <h1 class="text-xl font-semibold">{title}</h1>
        {#if session}
          <span class="shrink-0 text-sm text-muted-foreground">{formattedStartDate}</span>
        {/if}
      </div>
      {#if description}
        <p class="text-sm text-muted-foreground">{description}</p>
      {/if}
    </div>
    {#if hasMenuItems && session}
      <OptionsButtonDropdownMenu ariaLabel="Session actions">
        {#if isFreeForm}
          <DropdownMenuItem onclick={() => (renameDialogOpen = true)}>
            Rename Session
          </DropdownMenuItem>
          {#if mode === SessionPageMode.Active || mode === SessionPageMode.Planning}
            <DropdownMenuItem
              disabled={exerciseOrderItems.length < 2}
              onclick={() => (reorderDialogOpen = true)}
            >
              Reorder Exercises
            </DropdownMenuItem>
          {/if}
          {#if mode === SessionPageMode.View}
            <DropdownMenuItem onclick={handleEditSession}>Edit Session</DropdownMenuItem>
          {/if}
          {#if mode !== SessionPageMode.Planning}
            <DropdownMenuItem onclick={() => (changeStartDateDialogOpen = true)}>
              Change Start Date
            </DropdownMenuItem>
          {/if}
          {#if mode !== SessionPageMode.Planning && !session.complete}
            <DropdownMenuItem
              onclick={() => goto(`/session?sessionId=${session._id}&planningMode=true`)}
            >
              Edit Targets
            </DropdownMenuItem>
          {/if}
        {/if}
        {#if !session.complete}
          <DropdownMenuItem
            class="text-destructive focus:text-destructive"
            onclick={() => (deleteDialogOpen = true)}
          >
            Delete Session
          </DropdownMenuItem>
        {/if}
      </OptionsButtonDropdownMenu>
    {/if}
  </div>
  <Button variant="outline" size="sm" class="col-start-2 w-fit" onclick={() => goto('/sessions')}>
    View All Sessions
  </Button>
</div>

{#if session}
  <SessionPageHeaderRenameDialog bind:open={renameDialogOpen} {session} />
  <SessionPageHeaderDeleteDialog bind:open={deleteDialogOpen} {session} />
  <SessionPageHeaderChangeStartDateDialog bind:open={changeStartDateDialogOpen} {session} />
{/if}

<SessionPageReorderDialog
  bind:open={reorderDialogOpen}
  exerciseOrder={exerciseOrderItems}
  onSave={handleReorderSave}
/>
