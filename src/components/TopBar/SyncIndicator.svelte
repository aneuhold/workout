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

  /**
   * `timerColor` replaces `color` while the timer highlight gives the top bar a
   * primary background, where `text-primary` would not show.
   */
  const stateDisplays: Record<
    ApiActivityState,
    { label: string; icon: typeof IconCloud; color: string; timerColor: string; class?: string }
  > = {
    [ApiActivityState.Idle]: {
      label: 'Sync idle',
      icon: IconCloud,
      color: 'text-muted-foreground/40',
      timerColor: 'text-primary-foreground/40'
    },
    [ApiActivityState.Syncing]: {
      label: 'Syncing changes',
      icon: IconCloudUp,
      color: 'text-primary',
      timerColor: 'text-primary-foreground',
      class: 'animate-sync-pulse'
    },
    [ApiActivityState.Success]: {
      label: 'Changes saved',
      icon: IconCloudCheck,
      color: 'text-primary',
      timerColor: 'text-primary-foreground',
      class: 'animate-sync-success'
    },
    [ApiActivityState.Error]: {
      label: 'Sync error',
      icon: IconCloudExclamation,
      color: 'text-destructive',
      timerColor: 'text-destructive'
    },
    [ApiActivityState.Offline]: {
      label: 'Offline, changes saved on this device',
      icon: IconCloudOff,
      color: 'text-muted-foreground',
      timerColor: 'text-primary-foreground/70'
    },
    [ApiActivityState.Pending]: {
      label: 'Changes waiting to sync',
      icon: IconCloudPause,
      color: 'text-muted-foreground',
      timerColor: 'text-primary-foreground/70'
    }
  };

  const state = $derived(apiActivityService.state);
  const display = $derived(stateDisplays[state]);
</script>

<div aria-live="polite" aria-label={display.label} class="flex items-center">
  <display.icon
    size={18}
    stroke={1.5}
    class={cn(display.class, timerHighlight ? display.timerColor : display.color)}
  />
</div>
