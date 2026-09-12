<!--
  @component

  Singleton dialog that appears when a newer version of the app is deployed.
  On web, prompts the user to reload. On Android, prompts them to update from
  the Play Store. Reacts to `updateAvailable` from `UpdateCheckService`.
  Import `updateNotificationDialog` and call `.open()` to trigger imperatively.
-->
<script lang="ts" module>
  let open = $state(false);

  export const updateNotificationDialog = {
    open: () => {
      open = true;
    }
  };
</script>

<script lang="ts">
  import { Capacitor } from '@capacitor/core';
  import updateCheckService from '$services/UpdateCheck.service.svelte';
  import AlertDialog from '$ui/AlertDialog/AlertDialog.svelte';
  import AlertDialogAction from '$ui/AlertDialog/AlertDialogAction.svelte';
  import AlertDialogContent from '$ui/AlertDialog/AlertDialogContent.svelte';
  import AlertDialogDescription from '$ui/AlertDialog/AlertDialogDescription.svelte';
  import AlertDialogFooter from '$ui/AlertDialog/AlertDialogFooter.svelte';
  import AlertDialogHeader from '$ui/AlertDialog/AlertDialogHeader.svelte';
  import AlertDialogTitle from '$ui/AlertDialog/AlertDialogTitle.svelte';

  const isNative = Capacitor.isNativePlatform();

  $effect(() => {
    if (updateCheckService.updateAvailable) {
      open = true;
    }
  });

  function handleAction() {
    if (isNative) {
      window.open('https://play.google.com/store/apps/details?id=com.tonyneuhold.mesopro');
    } else {
      window.location.reload();
    }
  }
</script>

<AlertDialog bind:open>
  <AlertDialogContent escapeKeydownBehavior="ignore">
    <AlertDialogHeader>
      <AlertDialogTitle>Update Available</AlertDialogTitle>
      <AlertDialogDescription>
        {#if isNative}
          A new version of MesoPro is available on the Play Store.
        {:else}
          A new version of MesoPro is available. Reload to get the latest update.
        {/if}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogAction onclick={handleAction}>
        {isNative ? 'Update' : 'Reload'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
