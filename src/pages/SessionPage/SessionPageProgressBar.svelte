<!--
  @component

  Progress bar showing completed sets count and percentage.
-->
<script lang="ts">
  import Progress from '$ui/Progress/Progress.svelte';

  let {
    completed,
    total
  }: {
    completed: number;
    total: number;
  } = $props();

  let percent = $derived(total > 0 ? Math.round((completed / total) * 100) : 0);
</script>

<div class="flex flex-col gap-1.5">
  <div class="flex items-center justify-between text-sm">
    <span class="text-muted-foreground">{completed}/{total} sets</span>
    <span class="font-medium">{percent}%</span>
  </div>
  <Progress value={percent} max={100} />
</div>
