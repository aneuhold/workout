<script lang="ts">
  import type { Snippet } from 'svelte';
  import SingletonConfirmationDialog from './SingletonConfirmationDialog.svelte';

  let {
    children
  }: {
    children?: Snippet;
  } = $props();
</script>

{@render children?.()}
<SingletonConfirmationDialog />
