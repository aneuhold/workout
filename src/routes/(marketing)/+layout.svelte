<!--
  @component

  Layout for publicly-reachable marketing pages.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children?: Snippet } = $props();
</script>

<main class="[view-transition-name:main-content]">
  {@render children?.()}
</main>
