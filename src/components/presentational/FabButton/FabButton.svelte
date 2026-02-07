<!--
  @component
  
  A FAB Button that will be put at the bottom right of the screen
-->
<script lang="ts">
  import Fab, { Icon, Label } from '@smui/fab';

  let {
    clickHandler,
    iconName,
    label
  }: {
    clickHandler: () => void;
    iconName: string;
    label?: string;
  } = $props();
</script>

<div class="fabButton">
  <Fab color="primary" onclick={clickHandler} extended={!!label}>
    <Icon class="material-icons">{iconName}</Icon>
    {#if label}
      <Label>{label}</Label>
    {/if}
  </Fab>
</div>

<style>
  .fabButton {
    z-index: 2;
    position: fixed;
    bottom: 32px;
    right: 32px;
  }
</style>
