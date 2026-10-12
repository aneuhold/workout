<!--
  @component

  Small cloud icon that reflects the current API sync state (idle, syncing,
  success, error, offline, pending) with subtle animations.
-->
<script lang="ts">
  import {
    IconCloud,
    IconCloudCheck,
    IconCloudExclamation,
    IconCloudOff,
    IconCloudPause,
    IconCloudUp
  } from '@tabler/icons-svelte';
  import apiActivityService, {
    ApiActivityState
  } from '$services/ApiActivityService/ApiActivity.service.svelte';

  let { timerHighlight = false }: { timerHighlight?: boolean } = $props();

  const state = $derived(apiActivityService.state);

  const ariaLabel = $derived(
    state === ApiActivityState.Syncing
      ? 'Syncing changes'
      : state === ApiActivityState.Success
        ? 'Changes saved'
        : state === ApiActivityState.Error
          ? 'Sync error'
          : state === ApiActivityState.Offline
            ? 'Offline, changes saved on this device'
            : state === ApiActivityState.Pending
              ? 'Changes waiting to sync'
              : 'Sync idle'
  );
</script>

<div aria-live="polite" aria-label={ariaLabel} class="flex items-center">
  {#if state === ApiActivityState.Syncing}
    <IconCloudUp size={18} stroke={1.5} class="text-primary animate-sync-pulse" />
  {:else if state === ApiActivityState.Success}
    <IconCloudCheck size={18} stroke={1.5} class="text-primary animate-sync-success" />
  {:else if state === ApiActivityState.Error}
    <IconCloudExclamation size={18} stroke={1.5} class="text-destructive" />
  {:else if state === ApiActivityState.Offline}
    <IconCloudOff size={18} stroke={1.5} class="text-muted-foreground" />
  {:else if state === ApiActivityState.Pending}
    <IconCloudPause size={18} stroke={1.5} class="text-muted-foreground" />
  {:else}
    <IconCloud
      size={18}
      stroke={1.5}
      class={timerHighlight ? 'text-primary-foreground/40' : 'text-muted-foreground/40'}
    />
  {/if}
</div>
