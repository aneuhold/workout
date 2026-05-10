<script lang="ts">
  import { page } from '$app/stores';
  import LibraryPage from '$pages/LibraryPage/LibraryPage.svelte';
  import { libraryPageInfo } from './pageInfo';

  let initialTab = $derived($page.url.searchParams.get('tab'));
</script>

<svelte:head>
  <title>{libraryPageInfo.shortTitle}</title>
  <meta name="description" content={libraryPageInfo.description} />
</svelte:head>

<LibraryPage {initialTab} />
