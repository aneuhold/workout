<script lang="ts">
  import type { MesocycleCalendarLabelEntry } from './mesocycleCalendarTypes';

  let { labels }: { labels: MesocycleCalendarLabelEntry[] } = $props();

  // Build a sparse array of 7 columns
  const labelsByColumn = $derived.by(() => {
    const result: (MesocycleCalendarLabelEntry | undefined)[] = Array.from({ length: 7 });
    for (const entry of labels) {
      result[entry.columnIndex] = entry;
    }
    return result;
  });
</script>

<div class="grid grid-cols-7 gap-1">
  {#each labelsByColumn as entry, col (col)}
    <div class="text-xs truncate px-0.5">
      {#if entry}
        {#if entry.cycleLabel}
          <span class="font-semibold text-foreground">{entry.cycleLabel}</span>
        {/if}
        {#if entry.monthLabel}
          <span class="text-muted-foreground">{entry.monthLabel}</span>
        {/if}
      {/if}
    </div>
  {/each}
</div>
