<script lang="ts">
  import { page } from '$app/state';
  import MesocyclePage from '$pages/MesocyclePage/MesocyclePage.svelte';
  import { isUUID } from '$util/isUUID';
  import { mesocyclePageInfo } from './pageInfo';

  let mesocycleId = $derived.by(() => {
    const raw = page.url.searchParams.get('mesocycleId');
    return isUUID(raw) ? raw : null;
  });
</script>

<svelte:head>
  <title>{mesocyclePageInfo.shortTitle}</title>
  <meta name="description" content={mesocyclePageInfo.description} />
</svelte:head>

<MesocyclePage {mesocycleId} />
