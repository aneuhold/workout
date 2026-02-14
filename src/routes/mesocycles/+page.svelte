<script lang="ts">
  import { mesocyclesPageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{mesocyclesPageInfo.shortTitle}</title>
  <meta name="description" content={mesocyclesPageInfo.description} />
</svelte:head>

<h1>{mesocyclesPageInfo.title}</h1>
