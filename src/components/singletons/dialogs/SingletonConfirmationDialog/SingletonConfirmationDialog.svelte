<!--
  @component
  
  This component is a singleton, and should only ever be used once. Use the
  exported functions to show the dialog.
-->
<script lang="ts" module>
  import Button, { Label } from '@smui/button';
  import { Actions, Content, Title } from '@smui/dialog';
  import { writable } from 'svelte/store';
  import SmartDialog from '$components/presentational/SmartDialog.svelte';

  export type ConfirmationDialogSettings = {
    title: string;
    message: string;
    confirmationButtonText?: string;
    cancelButtonText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  };

  /**
   * A confirmation dialog that can be used anywhere in the app.
   */
  export const confirmationDialog = {
    open: (settings: ConfirmationDialogSettings) => {
      dialogStore.set(settings);
      open.set(true);
    }
  };

  const open = writable(false);
  const dialogStore = createDialogStore();

  function createDialogStore() {
    const initialSettings: ConfirmationDialogSettings = {
      title: 'Confirm?',
      message: 'Are you sure?',
      confirmationButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      onConfirm: () => {}
    };
    const { subscribe, set } = writable(initialSettings);

    return {
      subscribe,
      set: (newSettings: ConfirmationDialogSettings) => {
        if (!newSettings.confirmationButtonText) {
          newSettings.confirmationButtonText = initialSettings.confirmationButtonText;
        }
        if (!newSettings.cancelButtonText) {
          newSettings.cancelButtonText = initialSettings.cancelButtonText;
        }
        set(newSettings);
      }
    };
  }
</script>

<script lang="ts">
  let previousOpen = $state($open);

  function handleConfirm() {
    $open = false;
    $dialogStore.onConfirm();
  }

  function handleCancel() {
    // Will cause the onCancel to trigger
    $open = false;
  }

  $effect(() => {
    // So that if the dialog is closed by any other means, it will trigger the
    // onCancel function
    if (previousOpen !== $open) {
      if (previousOpen && !$open && $dialogStore.onCancel) {
        $dialogStore.onCancel();
      }
      previousOpen = $open;
    }
  });
</script>

<SmartDialog bind:open={$open}>
  <!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
  <Title>{$dialogStore.title}</Title>
  <Content>{$dialogStore.message}</Content>
  <Actions>
    <Button onclick={handleConfirm}>
      <Label>{$dialogStore.confirmationButtonText}</Label>
    </Button>
    <Button onclick={handleCancel}>
      <Label>{$dialogStore.cancelButtonText}</Label>
    </Button>
  </Actions>
</SmartDialog>
