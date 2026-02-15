<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const dayCellVariants = tv({
    base: 'relative flex flex-col items-center rounded-md p-1 min-h-12 text-xs transition-colors',
    variants: {
      visual: {
        completed: 'bg-muted/50 text-muted-foreground',
        'session-next': 'bg-primary/10 ring-2 ring-primary',
        session: 'bg-primary/10 ring-1 ring-primary/40',
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
  import type { MesocycleCalendarDayCell } from './mesocycleCalendarTypes';

  let {
    day,
    nextSessionDayIndex,
    onDayClick
  }: {
    day: MesocycleCalendarDayCell;
    nextSessionDayIndex: number;
    onDayClick: (day: MesocycleCalendarDayCell) => void;
  } = $props();

  const visual: DayCellVisual = $derived.by(() => {
    if (day.type === 'rest') return 'rest';
    if (day.type === 'empty') return 'empty';
    const allCompleted = day.sessions.every((s) => s.completed);
    if (allCompleted) return 'completed';
    if (day.dayIndex === nextSessionDayIndex) return 'session-next';
    return 'session';
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
    <span class="text-foreground">{dateLabel}</span>
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
    <span class="text-foreground">{dateLabel}</span>
    {#if day.type === 'rest'}
      <span class="text-[10px] text-muted-foreground mt-0.5">Rest</span>
    {/if}
  </div>
{/if}
