<script lang="ts" module>
  import IconButton from '@smui/icon-button';
  import Snackbar, { Actions, Label } from '@smui/snackbar';
  import { writable } from 'svelte/store';

  let snackBarRef: Snackbar | undefined;

  function openSnackBar() {
    if (snackBarRef) {
      snackBarRef.open();
    }
  }

  export const snackbar = {
    success: (message: string, timeout = 5000) => {
      snackbarSettings.set({
        message,
        currentClass: 'success',
        timeout
      });
      openSnackBar();
    },
    error: (message: string, timeout = 5000) => {
      snackbarSettings.set({
        message,
        currentClass: 'error',
        timeout
      });
      openSnackBar();
    },
    warning: (message: string, timeout = 5000) => {
      snackbarSettings.set({
        message,
        currentClass: 'warning',
        timeout
      });
      openSnackBar();
    }
  };

  type SnackbarSettings = {
    message: string;
    currentClass: 'success' | 'error' | 'warning';
    /**
     * This must be a number between 4000 and 10000 according to SMUI.
     * Otherwise it will throw an error.
     */
    timeout: number;
  };

  function createSnackbarSettingsStore() {
    const { subscribe, set } = writable<SnackbarSettings>({
      message: 'Success!',
      currentClass: 'success',
      timeout: 5000
    });

    return {
      subscribe,
      set
    };
  }

  const snackbarSettings = createSnackbarSettingsStore();
</script>

<!--
  @component
  
  A component that provides a snackbar to the rest of the application. This
  should only be used in the top level of the application and interacted with
  through the exported snackbar object.
-->
<script lang="ts">
</script>

<Snackbar
  bind:this={snackBarRef}
  class={$snackbarSettings.currentClass}
  timeoutMs={$snackbarSettings.timeout}
>
  <Label>{$snackbarSettings.message}</Label>
  <Actions>
    <div class={$snackbarSettings.currentClass === 'error' ? 'light-button' : 'dark-button'}>
      <IconButton class="material-icons" title="Dismiss">close</IconButton>
    </div>
  </Actions>
</Snackbar>

<style>
  .light-button {
    color: white;
  }
  .dark-button {
    color: black;
  }
</style>
