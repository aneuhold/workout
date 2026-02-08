<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Progress from './Progress.svelte';

  let {
    value = 50,
    max = 100,
    showLabel = false,
    label = '',
    ...rest
  }: {
    showLabel?: boolean;
    label?: string;
  } & ComponentProps<typeof Progress> = $props();
</script>

{#if showLabel && label}
  <div class="space-y-2">
    <div class="flex justify-between text-sm">
      <span>{label}</span>
      <span class="text-muted-foreground">{Math.round(((value ?? 0) / max) * 100)}%</span>
    </div>
    <Progress {value} {max} {...rest} />
  </div>
{:else}
  <Progress {value} {max} {...rest} />
{/if}
