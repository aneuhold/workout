<!--
  @component

  Button that exits demo mode. Tapping it turns the tab's demo flag off and
  fully reloads the home page, which brings back the real stores and API.

  Fixed to the bottom left, raised above the NavBar on mobile.
-->
<script lang="ts">
  import Button from '$ui/Button/Button.svelte';
  import SessionData from '$util/LocalData/SessionData';

  const exitDemoMode = () => {
    SessionData.setDemoModeEnabled(false);
    window.location.assign('/');
  };
</script>

<Button
  class="animate-fade-in-up fixed bottom-(--bottom-nav-height) left-0 z-40 m-4 md:bottom-0"
  title="Exit demo mode"
  onclick={exitDemoMode}
>
  Demo
</Button>
