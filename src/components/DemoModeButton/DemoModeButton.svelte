<!--
  @component

  Button that exits demo mode, returning the tab to the real stores and API.

  Fixed to the bottom left, raised above the NavBar on mobile.
-->
<script lang="ts">
  import demoModeService from '$services/DemoMode.service.svelte';
  import Button from '$ui/Button/Button.svelte';
</script>

<Button
  class="[view-transition-name:match-element] animate-fade-in-up fixed bottom-(--bottom-nav-height) left-0 z-40 m-4 md:bottom-0"
  title="Exit demo mode"
  onclick={() => demoModeService.exit()}
>
  Demo
</Button>
