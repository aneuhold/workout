<!--
  @component

  Destructive "Delete account" row for the Settings page. Opens a confirmation
  dialog that requires the user to retype their username before the request
  goes out. On success, AuthService clears the local session and the layout
  gate swaps to the login screen.
-->
<script lang="ts">
  import { IconTrash } from '@tabler/icons-svelte';
  import authService from '$services/AuthService';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import AlertDialog from '$ui/AlertDialog/AlertDialog.svelte';
  import AlertDialogAction from '$ui/AlertDialog/AlertDialogAction.svelte';
  import AlertDialogCancel from '$ui/AlertDialog/AlertDialogCancel.svelte';
  import AlertDialogContent from '$ui/AlertDialog/AlertDialogContent.svelte';
  import AlertDialogDescription from '$ui/AlertDialog/AlertDialogDescription.svelte';
  import AlertDialogFooter from '$ui/AlertDialog/AlertDialogFooter.svelte';
  import AlertDialogHeader from '$ui/AlertDialog/AlertDialogHeader.svelte';
  import AlertDialogTitle from '$ui/AlertDialog/AlertDialogTitle.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Input from '$ui/Input/Input.svelte';
  import Label from '$ui/Label/Label.svelte';
  import { createLogger } from '$util/logging/logger';

  const log = createLogger('SettingsPageDeleteAccountButton.svelte');

  let confirmOpen = $state(false);
  let processing = $state(false);
  let errorMessage = $state<string | null>(null);
  let typedUsername = $state('');
  let confirmDisabled = $derived(processing || typedUsername !== $userConfig.username);

  function openDialog() {
    typedUsername = '';
    errorMessage = null;
    confirmOpen = true;
  }

  async function handleConfirm(event: Event) {
    // The AlertDialogAction closes the dialog by default; we want to keep it
    // open while the request is in flight so the user sees the processing
    // state and any error.
    event.preventDefault();
    processing = true;
    errorMessage = null;
    const result = await authService.deleteAccount();
    if (!result.success) {
      log.error('Failed to delete account', result);
      errorMessage = result.errors[0] ?? 'Failed to delete account.';
      processing = false;
      return;
    }
  }
</script>

<div class="flex items-center justify-between">
  <Label>Delete account</Label>
  <Button
    variant="destructive"
    onclick={openDialog}
    disabled={processing}
    data-testid="delete-account-button"
  >
    <IconTrash size={16} /> Delete account
  </Button>
</div>

{#if errorMessage}
  <p class="text-destructive text-sm">{errorMessage}</p>
{/if}

<AlertDialog bind:open={confirmOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle class="flex flex-col items-center">Delete account?</AlertDialogTitle>
      <AlertDialogDescription>
        <div class="flex flex-col gap-2">
          This permanently deletes your MesoPro account and every workout, mesocycle, exercise, and
          calibration tied to it. This action cannot be undone. You can create another user account
          by signing up in the future with the same email, but your current data will be lost
          permanently as soon as you tap / click "Delete".

          <span class="flex flex-col items-center">
            Type your username "{$userConfig.username}" to confirm:
          </span>
          <Input
            type="text"
            autocomplete="off"
            spellcheck={false}
            bind:value={typedUsername}
            disabled={processing}
          />
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
      <AlertDialogAction
        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        disabled={confirmDisabled}
        onclick={handleConfirm}
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
