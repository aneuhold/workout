<script lang="ts">
  import type { Snippet } from 'svelte';
  import SingletonDeleteDialog from './SingletonDeleteDialog.svelte';

  let { children }: { children?: Snippet } = $props();
</script>

{@render children?.()}
<SingletonDeleteDialog />
