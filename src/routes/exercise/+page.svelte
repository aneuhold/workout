<script lang="ts">
  import { page } from '$app/state';
  import ExercisePage from '$pages/ExercisePage/ExercisePage.svelte';
  import { exercisePageInfo } from './pageInfo';

  let exerciseId = $derived(page.url.searchParams.get('exerciseId'));
  let isNew = $derived(page.url.searchParams.get('new') === 'true');
</script>

<svelte:head>
  <title>{exercisePageInfo.shortTitle}</title>
  <meta name="description" content={exercisePageInfo.description} />
</svelte:head>

<ExercisePage {exerciseId} {isNew} />
