<script lang="ts">
  import LibraryPage from '$pages/LibraryPage/LibraryPage.svelte';
  import { libraryPageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{libraryPageInfo.shortTitle}</title>
  <meta name="description" content={libraryPageInfo.description} />
</svelte:head>

<LibraryPage />
