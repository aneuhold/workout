<!--
  @component

  Navigation shortcuts grid for quick access to key pages, plus a ghost button
  to start a free-form workout when none is currently in progress.
-->
<script lang="ts">
  import { IconBarbell, IconCalendar, IconChartBar } from '@tabler/icons-svelte';
  import { goto } from '$app/navigation';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
  import Button from '$ui/Button/Button.svelte';

  function handleStartFreeForm() {
    const session = sessionMapService.createFreeFormSession();
    goto(`/session?sessionId=${session._id}`);
  }
</script>

<div class="flex flex-col gap-2">
  <div class="grid grid-cols-2 gap-2">
    <Button variant="outline" href="/mesocycles">
      <IconCalendar size={16} />
      Plan Mesocycles
    </Button>
    <Button variant="outline" href="/analytics">
      <IconChartBar size={16} />
      View Analytics
    </Button>
  </div>
  {#if !sessionMapService.freeFormSessions.inProgress}
    <Button variant="ghost" class="text-muted-foreground" onclick={handleStartFreeForm}>
      <IconBarbell size={16} />
      Start Free-Form Workout
    </Button>
  {/if}
</div>
