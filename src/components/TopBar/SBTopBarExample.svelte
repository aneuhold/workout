<script lang="ts">
  import { onDestroy } from 'svelte';
  import { timerStore } from '$stores/session/timerStore.svelte';
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
      timerStore.start(timerSeconds);
    } else {
      timerStore.stop();
    }
  });

  onDestroy(() => {
    timerStore.stop();
  });
</script>

<TopBar {username} />
