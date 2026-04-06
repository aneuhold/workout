<!--
  @component

  Hero card state: all microcycles are done, mesocycle is ready to complete.
-->
<script lang="ts">
  import { IconChevronRight, IconTrophy } from '@tabler/icons-svelte';
  import { triggerConfetti } from '$components/singletons/Confetti/Confetti.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';

  let {
    blockedByPendingReviews,
    onCompleteMesocycle
  }: {
    blockedByPendingReviews: boolean;
    onCompleteMesocycle: () => void;
  } = $props();
</script>

<Card class="ring-green-500/30 ring-2">
  <CardHeader>
    <div class="flex items-center gap-2">
      <IconTrophy size={18} class="text-green-500" />
      <span class="text-sm font-semibold text-green-600 dark:text-green-400">
        Mesocycle Complete!
      </span>
    </div>
  </CardHeader>
  <CardContent class="flex flex-col gap-3">
    {#if blockedByPendingReviews}
      <p class="text-xs text-muted-foreground">
        Fill in your session reviews before completing the mesocycle. This helps optimize your next
        training block.
      </p>
      <Button size="sm" disabled>Complete Mesocycle</Button>
    {:else}
      <p class="text-xs text-muted-foreground">All microcycles are done. Great work!</p>
      <Button
        size="sm"
        onclick={(e: MouseEvent) => {
          triggerConfetti(e.clientX, e.clientY);
          onCompleteMesocycle();
        }}
      >
        Complete Mesocycle
        <IconChevronRight size={14} />
      </Button>
    {/if}
  </CardContent>
</Card>
