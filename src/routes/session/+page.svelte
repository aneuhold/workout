<script lang="ts">
  import { page } from '$app/state';
  import SessionPage from '$pages/SessionPage/SessionPage.svelte';
  import { sessionPageInfo } from './pageInfo';

  let sessionId = $derived(page.url.searchParams.get('sessionId'));
</script>

<svelte:head>
  <title>{sessionPageInfo.shortTitle}</title>
  <meta name="description" content={sessionPageInfo.description} />
</svelte:head>

<SessionPage {sessionId} />
