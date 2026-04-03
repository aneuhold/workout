<!--
  @component

  Root component for the session page.
  Initializes the SessionPageService and renders the page layout.
-->
<script lang="ts">
  import SingletonEditSetDialog from '$components/singletons/dialogs/SingletonEditSetDialog/SingletonEditSetDialog.svelte';
  import SingletonExercisePickerDialog from '$components/singletons/dialogs/SingletonExercisePickerDialog/SingletonExercisePickerDialog.svelte';
  import Button from '$ui/Button/Button.svelte';
  import SessionPageExerciseCard from './SessionPageExerciseCard';
  import SessionPageHeader from './SessionPageHeader';
  import SessionPageProgressBar from './SessionPageProgressBar.svelte';
  import sessionPageService from './SessionPageService.svelte';
  import SessionPageSummaryCard from './SessionPageSummaryCard.svelte';
  import { SessionPageMode } from './sessionPageTypes';

  let {
    sessionId,
    planning = false
  }: {
    sessionId: string | null;
    planning?: boolean;
  } = $props();

  $effect(() => {
    sessionPageService.init(sessionId, planning);
  });

  $effect(() => {
    if (sessionPageService.dataMode === SessionPageMode.Review) {
      sessionPageService.setWasInReviewMode();
    }
  });

  $effect(() => {
    sessionPageService.tryInitDoneState();
  });

  $effect(() => {
    sessionPageService.syncExpandedCards();
  });
</script>

<div class="flex flex-col gap-4 p-4">
  {#if !sessionPageService.session}
    <SessionPageHeader title="Session" />
    <p class="text-sm text-muted-foreground">Session not found.</p>
  {:else}
    <SessionPageHeader
      title={sessionPageService.session.title}
      description={sessionPageService.session.description}
      isFreeForm={sessionPageService.isFreeForm}
      mode={sessionPageService.mode}
      session={sessionPageService.session}
    />

    {#if sessionPageService.mode !== SessionPageMode.Locked && sessionPageService.mode !== SessionPageMode.Planning}
      <SessionPageProgressBar
        completed={sessionPageService.completedCount}
        total={sessionPageService.totalSets}
      />
    {/if}

    {#if sessionPageService.lockReason != null}
      <div class="rounded-lg border border-muted bg-muted/30 px-4 py-3">
        <p class="text-sm text-muted-foreground">
          {sessionPageService.lockMessages[sessionPageService.lockReason]}
        </p>
      </div>
    {/if}

    {#if sessionPageService.isFreeForm && sessionPageService.sessionExercises.length === 0 && (sessionPageService.mode === SessionPageMode.Active || sessionPageService.mode === SessionPageMode.Planning)}
      <div
        class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-muted-foreground/30 px-4 py-8"
      >
        <p class="text-sm text-muted-foreground">No exercises yet. Add one to get started.</p>
        <Button variant="outline" onclick={() => sessionPageService.handleAddExercise()}>
          Add Exercise
        </Button>
      </div>
    {/if}

    {#each sessionPageService.sessionExercises as se, i (se._id)}
      <SessionPageExerciseCard sessionExercise={se} index={i} />
    {/each}

    {#if sessionPageService.isFreeForm && sessionPageService.sessionExercises.length > 0 && (sessionPageService.mode === SessionPageMode.Active || sessionPageService.mode === SessionPageMode.Planning)}
      <Button
        variant="outline"
        class="w-full"
        onclick={() => sessionPageService.handleAddExercise()}
      >
        Add Exercise
      </Button>
    {/if}

    {#if sessionPageService.mode !== SessionPageMode.Locked}
      <SessionPageSummaryCard />
    {/if}
  {/if}
</div>

<SingletonEditSetDialog />
<SingletonExercisePickerDialog />
