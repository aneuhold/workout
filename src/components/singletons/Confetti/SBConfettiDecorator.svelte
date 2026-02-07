<script lang="ts">
  import type { Snippet } from 'svelte';
  import Confetti from './Confetti.svelte';

  let { children }: { children: Snippet } = $props();
</script>

<Confetti />
{@render children()}
