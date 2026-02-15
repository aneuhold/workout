<script lang="ts">
  import { onDestroy } from 'svelte';
  import timerService from '$services/TimerService';
  import TopBar from './TopBar.svelte';

  let {
    username = 'John Doe',
    timerActive = false,
    timerSeconds = 90
  }: {
    username?: string;
    timerActive?: boolean;
    timerSeconds?: number;
  } = $props();

  $effect(() => {
    if (timerActive) {
      timerService.start(timerSeconds);
    } else {
      timerService.stop();
    }
  });

  onDestroy(() => {
    timerService.stop();
  });
</script>

<TopBar {username} />
