<script lang="ts">
  import { libraryPageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{libraryPageInfo.shortTitle}</title>
  <meta name="description" content={libraryPageInfo.description} />
</svelte:head>

<h1>{libraryPageInfo.title}</h1>
