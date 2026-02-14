<script lang="ts">
  import type { WorkoutMuscleGroup } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import MockData from '$testUtils/MockData';
  import Button from '$ui/Button/Button.svelte';
  import { muscleGroupFormDialog } from './SingletonMuscleGroupFormDialog.svelte';
  import SingletonMuscleGroupFormDialog from './SingletonMuscleGroupFormDialog.svelte';

  let muscleGroups = $state<WorkoutMuscleGroup[]>([]);

  $effect(() => {
    untrack(() => {
      MockData.muscleGroupMapServiceMock.reset();
      const mg = MockData.muscleGroupMapServiceMock.addDefaultMuscleGroups();
      muscleGroups = Object.values(mg);
    });

    return () => {
      untrack(() => {
        MockData.muscleGroupMapServiceMock.reset();
      });
    };
  });
</script>

<div class="flex flex-col gap-3 p-4">
  <h3 class="text-sm font-medium">Muscle Group Form Dialog</h3>
  <div class="flex flex-wrap gap-2">
    <Button onclick={() => muscleGroupFormDialog.openNew()}>Add New</Button>
    {#if muscleGroups[0]}
      <Button variant="outline" onclick={() => muscleGroupFormDialog.openEdit(muscleGroups[0])}>
        Edit "{muscleGroups[0].name}"
      </Button>
    {/if}
  </div>
</div>
<SingletonMuscleGroupFormDialog />
