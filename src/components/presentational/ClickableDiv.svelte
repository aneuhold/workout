<!--
  @component
  
  A div that is clickable. It is setup to be accessible.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let { clickAction, children }: { clickAction: (event?: MouseEvent) => void; children: Snippet } =
    $props();
</script>

<div
  onclick={(event) => {
    clickAction(event);
  }}
  role="button"
  tabindex="0"
  onkeypress={() => {
    clickAction();
  }}
>
  {@render children()}
</div>

<style>
  div {
    cursor: pointer;
    /* The below styles will likely need to be changed */
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
</style>
