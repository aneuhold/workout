<!--
  @component

  Hero card state: the previous microcycle is fully complete and ready to advance.
-->
<script lang="ts">
  import { IconChevronRight, IconTrophy } from '@tabler/icons-svelte';
  import { triggerConfetti } from '$components/singletons/Confetti/Confetti.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';

  let {
    completedMicrocycleNumber,
    blockedByPendingReviews,
    onCompleteMicrocycle
  }: {
    completedMicrocycleNumber: number;
    blockedByPendingReviews: boolean;
    onCompleteMicrocycle: () => void;
  } = $props();
</script>

<Card class="ring-green-500/30 ring-2">
  <CardHeader>
    <div class="flex items-center gap-2">
      <IconTrophy size={18} class="text-green-500" />
      <span class="text-sm font-semibold text-green-600 dark:text-green-400">
        Microcycle {completedMicrocycleNumber} Complete!
      </span>
    </div>
  </CardHeader>
  <CardContent class="flex flex-col gap-3">
    {#if blockedByPendingReviews}
      <p class="text-xs text-muted-foreground">
        Fill in your session reviews before advancing to the next microcycle. This helps optimize
        your upcoming training.
      </p>
      <Button size="sm" disabled>Advance to Next Microcycle</Button>
    {:else}
      <p class="text-xs text-muted-foreground">Your next session will be ready after advancing.</p>
      <Button
        size="sm"
        onclick={(e: MouseEvent) => {
          triggerConfetti(e.clientX, e.clientY);
          onCompleteMicrocycle();
        }}
      >
        Advance to Next Microcycle
        <IconChevronRight size={14} />
      </Button>
    {/if}
  </CardContent>
</Card>
