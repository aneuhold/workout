<!--
  @component
  
  A component that wraps a normal Dialog component. Currently, it resolves
  an issue where the screen isn't scrollable if the back button is pressed
  while a dialog is open.
-->
<script lang="ts">
  import Dialog from '@smui/dialog';
  import { onMount, type Snippet } from 'svelte';

  let { open = $bindable(false), children }: { open?: boolean; children: Snippet } = $props();

  function closeDialog() {
    open = false;
  }

  onMount(() => {
    window.addEventListener('popstate', closeDialog);
    return () => {
      window.removeEventListener('popstate', closeDialog);
    };
  });
</script>

<Dialog bind:open>
  {@render children()}
</Dialog>
