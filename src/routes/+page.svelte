<script lang="ts">
  import { homePageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{homePageInfo.shortTitle}</title>
  <meta name="description" content={homePageInfo.description} />
</svelte:head>

<h1>{homePageInfo.title}</h1>
