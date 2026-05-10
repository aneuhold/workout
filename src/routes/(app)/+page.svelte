<script lang="ts">
  import HomePage from '$pages/HomePage/HomePage.svelte';
  import { homePageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{homePageInfo.shortTitle}</title>
  <meta name="description" content={homePageInfo.description} />
</svelte:head>

<HomePage />
