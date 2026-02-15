<script lang="ts">
  import ExercisePage from '$pages/ExercisePage/ExercisePage.svelte';
  import { exercisePageInfo } from '../pageInfo';
</script>

<svelte:head>
  <title>{exercisePageInfo.shortTitle}</title>
  <meta name="description" content={exercisePageInfo.description} />
</svelte:head>

<ExercisePage exerciseId={null} isNew={true} />
