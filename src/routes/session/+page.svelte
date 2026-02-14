<script lang="ts">
  import { page } from '$app/stores';
  import { sessionPageInfo } from './pageInfo';

  let sessionId = $derived($page.url.searchParams.get('sessionId'));
</script>

<svelte:head>
  <title>{sessionPageInfo.shortTitle}</title>
  <meta name="description" content={sessionPageInfo.description} />
</svelte:head>

<h1>{sessionPageInfo.title}</h1>
{#if sessionId}
  <p>Session: {sessionId}</p>
{/if}
