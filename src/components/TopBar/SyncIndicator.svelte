<!--
  @component

  Small cloud icon that reflects the current API sync state (idle, syncing,
  success, error) with subtle animations.
-->
<script lang="ts">
  import { IconCloud, IconCloudCheck, IconCloudOff, IconCloudUp } from '@tabler/icons-svelte';
  import apiActivityService, {
    ApiActivityState
  } from '$services/ApiActivityService/ApiActivityService.svelte';

  let { timerHighlight = false }: { timerHighlight?: boolean } = $props();

  const state = $derived(apiActivityService.state);

  const ariaLabel = $derived(
    state === ApiActivityState.Syncing
      ? 'Syncing changes'
      : state === ApiActivityState.Success
        ? 'Changes saved'
        : state === ApiActivityState.Error
          ? 'Sync error'
          : 'Sync idle'
  );
</script>

<div aria-live="polite" aria-label={ariaLabel} class="flex items-center">
  {#if state === ApiActivityState.Syncing}
    <IconCloudUp size={18} stroke={1.5} class="text-primary animate-sync-pulse" />
  {:else if state === ApiActivityState.Success}
    <IconCloudCheck size={18} stroke={1.5} class="text-primary animate-sync-success" />
  {:else if state === ApiActivityState.Error}
    <IconCloudOff size={18} stroke={1.5} class="text-destructive" />
  {:else}
    <IconCloud
      size={18}
      stroke={1.5}
      class={timerHighlight ? 'text-primary-foreground/40' : 'text-muted-foreground/40'}
    />
  {/if}
</div>
