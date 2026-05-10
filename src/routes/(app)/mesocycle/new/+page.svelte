<script lang="ts">
  import MesocyclePage from '$pages/MesocyclePage/MesocyclePage.svelte';
  import { mesocycleNewPageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{mesocycleNewPageInfo.shortTitle}</title>
  <meta name="description" content={mesocycleNewPageInfo.description} />
</svelte:head>

<MesocyclePage />
