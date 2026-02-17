<script lang="ts">
  import { untrack } from 'svelte';
  import MockData from '$testUtils/MockData';
  import LibraryPage from '../LibraryPage.svelte';

  let { populateDefaultData = true }: { populateDefaultData?: boolean } = $props();

  $effect(() => {
    // Track props to re-run the effect when they change
    const populate = populateDefaultData;

    untrack(() => {
      MockData.resetAll();

      if (populate) {
        MockData.setupBaseData();
      }
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

<LibraryPage />
