<script lang="ts">
  import { untrack } from 'svelte';
  import MockData from '$testUtils/MockData';
  import ExercisePage from '../ExercisePage.svelte';

  let {
    isNew = false,
    notFound = false
  }: {
    isNew?: boolean;
    notFound?: boolean;
  } = $props();

  let exerciseId = $state<string | null>(null);

  $effect(() => {
    const creating = isNew;
    const missing = notFound;

    untrack(() => {
      MockData.resetAll();

      const { exercises } = MockData.setupBaseData();

      if (missing) {
        exerciseId = 'non-existent-id';
      } else {
        exerciseId = creating ? null : exercises[0]._id;
      }
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

<ExercisePage {exerciseId} {isNew} />
