<!--
  @component

  Wrapper that applies a staggered fly-in entrance animation to its children.
  Use inside `{#each}` loops to create a cascading reveal effect.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fly } from 'svelte/transition';

  let {
    index,
    children
  }: {
    /** Zero-based position in the list, used to calculate stagger delay. */
    index: number;
    children: Snippet;
  } = $props();

  const DURATION_MS = 200;
  const STAGGER_MS = 50;
  const OFFSET_Y = 8;
</script>

<div in:fly={{ y: OFFSET_Y, duration: DURATION_MS, delay: index * STAGGER_MS }}>
  {@render children()}
</div>
