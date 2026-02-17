<script lang="ts">
  import { onDestroy } from 'svelte';
  import apiActivityService, {
    ApiActivityState
  } from '$services/ApiActivityService/ApiActivityService.svelte';
  import timerService from '$services/TimerService';
  import TopBar from './TopBar.svelte';

  let {
    username = 'John Doe',
    timerActive = false,
    timerSeconds = 90,
    syncState = ApiActivityState.Idle
  }: {
    username?: string;
    timerActive?: boolean;
    timerSeconds?: number;
    syncState?: ApiActivityState;
  } = $props();

  $effect(() => {
    if (timerActive) {
      timerService.start(timerSeconds);
    } else {
      timerService.stop();
    }
  });

  $effect(() => {
    switch (syncState) {
      case ApiActivityState.Syncing:
        apiActivityService.setSyncing();
        break;
      case ApiActivityState.Success:
        apiActivityService.setSuccess();
        break;
      case ApiActivityState.Error:
        apiActivityService.setError();
        break;
      default:
        apiActivityService.setIdle();
    }
  });

  onDestroy(() => {
    timerService.stop();
    apiActivityService.setIdle();
  });
</script>

<TopBar {username} />
