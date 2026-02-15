<script lang="ts">
  import { untrack } from 'svelte';
  import timerService from '$services/TimerService';
  import TimerPage from '../TimerPage.svelte';

  timerService.init();

  let {
    timerActive = false,
    timerSeconds = 90
  }: {
    timerActive?: boolean;
    timerSeconds?: number;
  } = $props();

  $effect(() => {
    const active = timerActive;
    const seconds = timerSeconds;

    untrack(() => {
      if (active) {
        timerService.start(seconds);
      } else {
        timerService.stop();
      }
    });

    return () => {
      untrack(() => {
        timerService.stop();
      });
    };
  });
</script>

<TimerPage />
