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
  import { cn } from '$util/svelte-shadcn-util';

  let { timerHighlight = false }: { timerHighlight?: boolean } = $props();

  const stateDisplays: Record<
    ApiActivityState,
    { label: string; icon: typeof IconCloud; class: string }
  > = {
    [ApiActivityState.Idle]: { label: 'Sync idle', icon: IconCloud, class: '' },
    [ApiActivityState.Syncing]: {
      label: 'Syncing changes',
      icon: IconCloudUp,
      class: 'text-primary animate-sync-pulse'
    },
    [ApiActivityState.Success]: {
      label: 'Changes saved',
      icon: IconCloudCheck,
      class: 'text-primary animate-sync-success'
    },
    [ApiActivityState.Error]: {
      label: 'Sync error',
      icon: IconCloudExclamation,
      class: 'text-destructive'
    },
    [ApiActivityState.Offline]: {
      label: 'Offline, changes saved on this device',
      icon: IconCloudOff,
      class: 'text-muted-foreground'
    },
    [ApiActivityState.Pending]: {
      label: 'Changes waiting to sync',
      icon: IconCloudPause,
      class: 'text-muted-foreground'
    }
  };

  const state = $derived(apiActivityService.state);
  const display = $derived(stateDisplays[state]);
</script>

<div aria-live="polite" aria-label={display.label} class="flex items-center">
  <display.icon
    size={18}
    stroke={1.5}
    class={cn(
      display.class,
      state === ApiActivityState.Idle &&
        (timerHighlight ? 'text-primary-foreground/40' : 'text-muted-foreground/40')
    )}
  />
</div>
