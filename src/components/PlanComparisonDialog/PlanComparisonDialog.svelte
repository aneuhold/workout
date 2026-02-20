<!--
  @component

  A celebratory dialog that displays plan statistics and optional highlights.
  
  This isn't used at the moment. It needs to be thought through more as far as the backend
  implementation.
-->
<script lang="ts">
  import { triggerConfetti } from '$components/singletons/Confetti/Confetti.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Dialog from '$ui/Dialog/Dialog.svelte';
  import DialogContent from '$ui/Dialog/DialogContent.svelte';
  import DialogDescription from '$ui/Dialog/DialogDescription.svelte';
  import DialogFooter from '$ui/Dialog/DialogFooter.svelte';
  import DialogHeader from '$ui/Dialog/DialogHeader.svelte';
  import DialogTitle from '$ui/Dialog/DialogTitle.svelte';
  import type { PlanComparisonHighlight, PlanComparisonStat } from './planComparisonTypes';

  let {
    open = $bindable(false),
    title,
    subtitle,
    stats,
    highlights,
    buttonLabel = "Let's Go",
    showConfetti: shouldShowConfetti = true,
    onClose
  }: {
    open: boolean;
    title: string;
    subtitle?: string;
    stats: PlanComparisonStat[];
    highlights?: PlanComparisonHighlight[];
    buttonLabel?: string;
    showConfetti?: boolean;
    onClose?: () => void;
  } = $props();

  let hasTriggeredConfetti = $state(false);

  $effect(() => {
    if (open && shouldShowConfetti && !hasTriggeredConfetti) {
      hasTriggeredConfetti = true;
      triggerConfetti(window.innerWidth / 2, window.innerHeight / 3);
    }
    if (!open) {
      hasTriggeredConfetti = false;
    }
  });

  function handleClose() {
    open = false;
    onClose?.();
  }

  const highlightVariantClasses: Record<PlanComparisonHighlight['variant'], string> = {
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400'
  };

  const highlightBadgeVariantClasses: Record<PlanComparisonHighlight['variant'], string> = {
    info: 'border-blue-500/30 text-blue-600 dark:text-blue-400',
    warning: 'border-yellow-500/30 text-yellow-600 dark:text-yellow-400',
    success: 'border-green-500/30 text-green-600 dark:text-green-400'
  };

  const gridColsClass = $derived(
    stats.length === 2 ? 'grid-cols-2' : stats.length >= 3 ? 'grid-cols-3' : 'grid-cols-1'
  );
</script>

<Dialog bind:open>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      {#if subtitle}
        <DialogDescription>{subtitle}</DialogDescription>
      {/if}
    </DialogHeader>

    <div class="flex flex-col gap-4 py-2">
      <!-- Stats grid -->
      <div class="grid {gridColsClass} gap-3">
        {#each stats as stat (stat.label)}
          <div class="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
            <span class="text-lg font-semibold">{stat.value}</span>
            <span class="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        {/each}
      </div>

      <!-- Highlights -->
      {#if highlights?.length}
        <div class="flex flex-col gap-2">
          {#each highlights as highlight (highlight.label)}
            <div class="rounded-lg p-3 {highlightVariantClasses[highlight.variant]}">
              <span class="text-sm font-medium">{highlight.label}</span>
              {#if highlight.items?.length}
                <div class="mt-2 flex flex-wrap gap-1">
                  {#each highlight.items as item (item)}
                    <Badge
                      variant="outline"
                      class="text-xs {highlightBadgeVariantClasses[highlight.variant]}"
                    >
                      {item}
                    </Badge>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <DialogFooter>
      <Button onclick={handleClose} class="w-full">{buttonLabel}</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
