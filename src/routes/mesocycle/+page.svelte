<script lang="ts">
  import { page } from '$app/state';
  import MesocyclePage from '$pages/MesocyclePage/MesocyclePage.svelte';
  import { mesocyclePageInfo } from './pageInfo';

  let mesocycleId = $derived(page.url.searchParams.get('mesocycleId'));
</script>

<svelte:head>
  <title>{mesocyclePageInfo.shortTitle}</title>
  <meta name="description" content={mesocyclePageInfo.description} />
</svelte:head>

<MesocyclePage {mesocycleId} />
