<!--
  @component

  Storybook wrapper that opens the SingletonUpdateNotification dialog via the
  exported imperative handle.
-->
<script lang="ts">
  import Button from '$ui/Button/Button.svelte';
  import SingletonUpdateNotification from './SingletonUpdateNotification.svelte';
  import { updateNotificationDialog } from './SingletonUpdateNotification.svelte';
</script>

<div class="flex flex-col gap-3 p-4">
  <h3 class="text-sm font-medium">Update Notification Dialog</h3>
  <Button onclick={() => updateNotificationDialog.open()} data-testid="open-dialog-button">
    Open Dialog
  </Button>
</div>
<SingletonUpdateNotification />
