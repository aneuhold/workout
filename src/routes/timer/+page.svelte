<script lang="ts">
  import { timerPageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{timerPageInfo.shortTitle}</title>
  <meta name="description" content={timerPageInfo.description} />
</svelte:head>

<h1>{timerPageInfo.title}</h1>
