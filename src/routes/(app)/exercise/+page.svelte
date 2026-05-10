<script lang="ts">
  import { page } from '$app/state';
  import ExercisePage from '$pages/ExercisePage/ExercisePage.svelte';
  import { isUUID } from '$util/isUUID';
  import { exercisePageInfo } from './pageInfo';

  let exerciseId = $derived.by(() => {
    const raw = page.url.searchParams.get('exerciseId');
    return isUUID(raw) ? raw : null;
  });
</script>

<svelte:head>
  <title>{exercisePageInfo.shortTitle}</title>
  <meta name="description" content={exercisePageInfo.description} />
</svelte:head>

<ExercisePage {exerciseId} isNew={false} />
