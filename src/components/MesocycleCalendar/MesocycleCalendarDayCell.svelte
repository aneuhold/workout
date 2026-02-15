<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const dayCellVariants = tv({
    base: 'relative flex flex-col items-center rounded-md p-1 min-h-12 text-xs transition-colors',
    variants: {
      visual: {
        past: 'bg-muted/50 text-muted-foreground',
        current: 'bg-primary/10 ring-2 ring-primary',
        future: 'bg-muted/30 ring-1 ring-border',
        deload: 'bg-muted/20 ring-1 ring-dashed ring-border opacity-80',
        'session-preview': 'bg-primary/10 ring-1 ring-primary',
        rest: 'bg-muted/40 text-muted-foreground',
        empty: 'bg-muted/20 text-muted-foreground'
      },
      cycleStart: {
        true: 'border-l-2 border-l-primary rounded-l-none'
      }
    }
  });

  export type DayCellVisual = VariantProps<typeof dayCellVariants>['visual'];
</script>

<script lang="ts">
  import { IconCheck } from '@tabler/icons-svelte';
  import type { MesocycleCalendarDayCell, MesocycleCalendarMode } from './mesocycleCalendarTypes';

  let {
    day,
    mode,
    currentCycleNumber,
    onDayClick
  }: {
    day: MesocycleCalendarDayCell;
    mode: MesocycleCalendarMode;
    currentCycleNumber: number;
    onDayClick: (day: MesocycleCalendarDayCell) => void;
  } = $props();

  const visual: DayCellVisual = $derived.by(() => {
    if (mode === 'preview') {
      if (day.type === 'rest') return 'rest';
      if (day.type === 'session') return 'session-preview';
      if (day.isDeload) return 'deload';
      return 'empty';
    }
    // in-progress mode
    if (day.cycleNumber < currentCycleNumber) return 'past';
    if (day.cycleNumber === currentCycleNumber) {
      if (day.type === 'rest') return 'rest';
      return 'current';
    }
    if (day.isDeload) return 'deload';
    return 'future';
  });

  const isClickable = $derived(day.type === 'session');
  const dateLabel = $derived(day.date.getDate());
</script>

{#if isClickable}
  <button
    type="button"
    class={dayCellVariants({ visual, cycleStart: day.isCycleStart })}
    onclick={() => onDayClick(day)}
  >
    <span class="font-medium">{dateLabel}</span>
    <div class="flex gap-0.5 mt-0.5">
      {#each day.sessions as session (session.sessionId)}
        {#if session.completed}
          <IconCheck class="size-3 text-primary" />
        {:else}
          <span class="size-2 rounded-full bg-primary/60"></span>
        {/if}
      {/each}
    </div>
  </button>
{:else}
  <div class={dayCellVariants({ visual, cycleStart: day.isCycleStart })}>
    <span class="font-medium">{dateLabel}</span>
    {#if day.type === 'rest'}
      <span class="text-[10px] text-muted-foreground mt-0.5">Rest</span>
    {/if}
  </div>
{/if}
