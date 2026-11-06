<script lang="ts">
  import { untrack } from 'svelte';
  import MockDataService from '$services/MockDataService/MockData.service';
  import stringFormatService from '$services/StringFormat.service';
  import Button from '$ui/Button/Button.svelte';
  import SingletonExercisePickerDialog from './SingletonExercisePickerDialog.svelte';
  import { exercisePickerDialog } from './SingletonExercisePickerDialog.svelte';

  let selectedIds = $state<string[]>([]);

  $effect(() => {
    untrack(() => {
      MockDataService.resetAll();
      MockDataService.setupBaseData();
    });

    return () => {
      untrack(() => {
        MockDataService.resetAll();
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
      Selected {stringFormatService.pluralize(selectedIds.length, 'exercise')}
    </p>
  {/if}
</div>
<SingletonExercisePickerDialog />
