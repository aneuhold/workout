<script lang="ts">
  import SessionsPage from '$pages/SessionsPage/SessionsPage.svelte';
  import { sessionsPageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{sessionsPageInfo.shortTitle}</title>
  <meta name="description" content={sessionsPageInfo.description} />
</svelte:head>

<SessionsPage />
