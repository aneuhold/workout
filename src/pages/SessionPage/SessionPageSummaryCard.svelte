<!--
  @component

  Summary card showing sets completed, progress percentage, and action button.
  Reads all state from SessionPageService.
-->
<script lang="ts">
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import sessionPageService from './SessionPageService.svelte';
  import { SessionPageMode } from './sessionPageTypes';

  let setsComplete = $derived(sessionPageService.completedCount >= sessionPageService.totalSets);
  let canComplete = $derived(
    sessionPageService.isFreeForm
      ? sessionPageService.allExercisesDone
      : setsComplete && sessionPageService.allImmediateSlidersFilled
  );
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
        onclick={() => sessionPageService.handleCompleteSession()}
      >
        Complete Session
      </Button>
      {#if sessionPageService.isFreeForm && !sessionPageService.allExercisesDone && sessionPageService.totalSets > 0}
        <p class="text-center text-xs text-muted-foreground">
          Mark all exercises as done to complete the session.
        </p>
      {:else if !sessionPageService.isFreeForm && setsComplete && !sessionPageService.allImmediateSlidersFilled}
        <p class="text-center text-xs text-muted-foreground">
          Fill in all RSM and Fatigue fields to complete the session.
        </p>
      {/if}
    {:else if sessionPageService.mode === SessionPageMode.Review}
      <Button
        class="w-full"
        disabled={!sessionPageService.allLateFieldsFilled}
        onclick={() => sessionPageService.handleCompleteReview()}
      >
        Complete Review
      </Button>
    {/if}
  </CardContent>
</Card>
