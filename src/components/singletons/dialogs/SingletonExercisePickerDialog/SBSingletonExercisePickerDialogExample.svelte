<script lang="ts">
  import { untrack } from 'svelte';
  import MockData from '$testUtils/MockData';
  import Button from '$ui/Button/Button.svelte';
  import { exercisePickerDialog } from './SingletonExercisePickerDialog.svelte';
  import SingletonExercisePickerDialog from './SingletonExercisePickerDialog.svelte';

  let selectedIds = $state<string[]>([]);

  $effect(() => {
    untrack(() => {
      MockData.resetAll();
      MockData.setupBaseData();
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });

  function handleOpen() {
    exercisePickerDialog.open({
      onConfirm: (ids) => {
        selectedIds = ids;
      }
    });
  }
</script>

<div class="flex flex-col gap-3 p-4">
  <Button onclick={handleOpen}>Open Exercise Picker</Button>
  {#if selectedIds.length > 0}
    <p class="text-sm text-muted-foreground">
      Selected {selectedIds.length} exercise{selectedIds.length !== 1 ? 's' : ''}
    </p>
  {/if}
</div>
<SingletonExercisePickerDialog />
