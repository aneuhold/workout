<!--
  @component

  A small tip card with a lightbulb icon for contextual guidance.
-->
<script lang="ts">
  import { IconBulb } from '@tabler/icons-svelte';
  import type { Snippet } from 'svelte';

  let {
    children
  }: {
    children: Snippet;
  } = $props();
</script>

<div
  class="flex gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground"
>
  <IconBulb size={16} class="shrink-0 text-amber-500" />
  <div>
    {@render children()}
  </div>
</div>
