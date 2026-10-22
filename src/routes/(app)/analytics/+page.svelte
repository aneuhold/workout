<script lang="ts">
  import AnalyticsPage from '$pages/AnalyticsPage/AnalyticsPage.svelte';
  import { analyticsPageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{analyticsPageInfo.shortTitle}</title>
  <meta name="description" content={analyticsPageInfo.description} />
</svelte:head>

<AnalyticsPage />
