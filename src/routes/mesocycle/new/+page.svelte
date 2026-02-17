<script lang="ts">
  import NewMesocyclePage from '$pages/MesocyclePage/NewMesocyclePage.svelte';
  import { mesocycleNewPageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{mesocycleNewPageInfo.shortTitle}</title>
  <meta name="description" content={mesocycleNewPageInfo.description} />
</svelte:head>

<NewMesocyclePage />
