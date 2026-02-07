<script lang="ts">
  import type { Snippet } from 'svelte';
  import SingletonTaskAssignmentDialog from './SingletonTaskAssignmentDialog.svelte';

  let {
    children
  }: {
    children?: Snippet;
  } = $props();
</script>

{@render children?.()}
<SingletonTaskAssignmentDialog />
