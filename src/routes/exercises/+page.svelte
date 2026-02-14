<script lang="ts">
  import { exercisesPageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{exercisesPageInfo.shortTitle}</title>
  <meta name="description" content={exercisesPageInfo.description} />
</svelte:head>

<h1>{exercisesPageInfo.title}</h1>
