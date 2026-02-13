<script lang="ts">
  import { mesocycleNewPageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{mesocycleNewPageInfo.shortTitle}</title>
  <meta name="description" content={mesocycleNewPageInfo.description} />
</svelte:head>

<h1>{mesocycleNewPageInfo.title}</h1>
