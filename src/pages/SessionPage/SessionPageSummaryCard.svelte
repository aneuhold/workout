<!--
  @component

  Summary card showing sets completed, progress percentage, and action button, with a hint
  explaining what is left when the action button is disabled.
  Reads all state from SessionPageService.
-->
<script lang="ts">
  import { triggerConfetti } from '$components/singletons/Confetti/Confetti.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import sessionPageService from './SessionPage.service.svelte';
  import { SessionPageMode } from './sessionPageTypes';

  let setsComplete = $derived(sessionPageService.completedCount >= sessionPageService.totalSets);
  let canComplete = $derived(
    sessionPageService.isFreeForm
      ? sessionPageService.allExercisesDone
      : setsComplete && sessionPageService.allImmediateSlidersFilled
  );

  let blockedHint: string | undefined = $derived.by(() => {
    if (sessionPageService.mode === SessionPageMode.Review) {
      return sessionPageService.allLateFieldsFilled
        ? undefined
        : 'Fill in all sliders to complete the review.';
    }
    if (sessionPageService.mode !== SessionPageMode.Active) return undefined;
    if (sessionPageService.isFreeForm) {
      return !sessionPageService.allExercisesDone && sessionPageService.totalSets > 0
        ? 'Mark all exercises as done to complete the session.'
        : undefined;
    }
    if (!setsComplete) return 'Log all sets to complete the session.';
    if (!sessionPageService.allImmediateSlidersFilled) {
      return 'Fill in all RSM and Fatigue fields to complete the session.';
    }
    return undefined;
  });
</script>

<Card>
  <CardContent class="flex flex-col gap-3 p-4">
    <div class="grid grid-cols-2 gap-4 text-center">
      <div>
        <p class="text-xs text-muted-foreground">Sets Completed</p>
        <p class="text-lg font-semibold">
          {sessionPageService.completedCount}/{sessionPageService.totalSets}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted-foreground">Progress</p>
        <p class="text-lg font-semibold">{sessionPageService.percent}%</p>
      </div>
    </div>

    {#if sessionPageService.mode === SessionPageMode.Planning}
      <Button class="w-full" onclick={() => sessionPageService.handleDonePlanning()}>
        Done Planning
      </Button>
    {:else if sessionPageService.mode === SessionPageMode.Active}
      <Button
        class="w-full"
        disabled={!canComplete}
        onclick={async (e: MouseEvent) => {
          triggerConfetti(e.clientX, e.clientY);
          await sessionPageService.handleCompleteSession();
        }}
      >
        Complete Session
      </Button>
    {:else if sessionPageService.mode === SessionPageMode.Review}
      <Button
        class="w-full"
        disabled={!sessionPageService.allLateFieldsFilled}
        onclick={() => sessionPageService.handleCompleteReview()}
      >
        Complete Review
      </Button>
    {/if}
    {#if blockedHint}
      <p class="text-center text-xs text-muted-foreground">{blockedHint}</p>
    {/if}
  </CardContent>
</Card>
