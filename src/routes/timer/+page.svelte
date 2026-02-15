<script lang="ts">
  import TimerPage from '$pages/TimerPage/TimerPage.svelte';
  import { timerPageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{timerPageInfo.shortTitle}</title>
  <meta name="description" content={timerPageInfo.description} />
</svelte:head>

<TimerPage />
