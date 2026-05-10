<script lang="ts">
  import MesocyclesPage from '$pages/MesocyclesPage/MesocyclesPage.svelte';
  import { mesocyclesPageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{mesocyclesPageInfo.shortTitle}</title>
  <meta name="description" content={mesocyclesPageInfo.description} />
</svelte:head>

<MesocyclesPage />
