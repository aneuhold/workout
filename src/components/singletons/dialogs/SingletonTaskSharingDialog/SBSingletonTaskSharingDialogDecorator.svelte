<script lang="ts">
  import type { Snippet } from 'svelte';
  import SingletonTaskSharingDialog from './SingletonTaskSharingDialog.svelte';

  let {
    children
  }: {
    children?: Snippet;
  } = $props();
</script>

{@render children?.()}
<SingletonTaskSharingDialog />
