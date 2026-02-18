<!--
  @component

  Summary card showing sets completed, progress percentage, and "Complete Session" button.
-->
<script lang="ts">
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import { SessionPageMode } from './sessionPageTypes';

  let {
    completed,
    total,
    percent,
    mode,
    allImmediateSlidersFilled = false,
    allLateFieldsFilled = false,
    onComplete,
    onCompleteReview
  }: {
    completed: number;
    total: number;
    percent: number;
    mode: SessionPageMode;
    allImmediateSlidersFilled?: boolean;
    allLateFieldsFilled?: boolean;
    onComplete: () => void;
    onCompleteReview: () => void;
  } = $props();

  let setsComplete = $derived(completed >= total);
  let canComplete = $derived(setsComplete && allImmediateSlidersFilled);
</script>

<Card>
  <CardContent class="flex flex-col gap-3 p-4">
    <div class="grid grid-cols-2 gap-4 text-center">
      <div>
        <p class="text-xs text-muted-foreground">Sets Completed</p>
        <p class="text-lg font-semibold">{completed}/{total}</p>
      </div>
      <div>
        <p class="text-xs text-muted-foreground">Progress</p>
        <p class="text-lg font-semibold">{percent}%</p>
      </div>
    </div>

    {#if mode === SessionPageMode.Active}
      <Button class="w-full" disabled={!canComplete} onclick={onComplete}>Complete Session</Button>
      {#if setsComplete && !allImmediateSlidersFilled}
        <p class="text-center text-xs text-muted-foreground">
          Fill in all RSM, Fatigue, and Performance sliders to complete the session.
        </p>
      {/if}
    {:else if mode === SessionPageMode.Review}
      <Button class="w-full" disabled={!allLateFieldsFilled} onclick={onCompleteReview}>
        Complete Review
      </Button>
    {/if}
  </CardContent>
</Card>
