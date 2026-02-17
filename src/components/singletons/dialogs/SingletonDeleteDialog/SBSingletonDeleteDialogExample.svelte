<script lang="ts">
  import type { UUID } from 'crypto';
  import { untrack } from 'svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import MockData from '$testUtils/MockData';
  import Button from '$ui/Button/Button.svelte';
  import { WorkoutDocumentType } from '$util/WorkoutDocumentType';
  import { deleteDialog } from './SingletonDeleteDialog.svelte';
  import SingletonDeleteDialog from './SingletonDeleteDialog.svelte';

  let exercises = $state<{ _id: UUID; exerciseName: string }[]>([]);
  let muscleGroups = $state<{ _id: UUID; name: string }[]>([]);
  let equipment = $state<{ _id: UUID; title: string }[]>([]);

  $effect(() => {
    untrack(() => {
      MockData.resetAll();

      const baseData = MockData.setupBaseData();

      exercises = baseData.exercises;
      muscleGroups = muscleGroupMapService.getDocs();
      equipment = baseData.equipmentTypes;
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

<div class="flex flex-col gap-3 p-4">
  <h3 class="text-sm font-medium">Delete Dialog Triggers</h3>
  <div class="flex flex-wrap gap-2">
    {#if exercises[0]}
      <Button
        variant="destructive"
        onclick={() =>
          deleteDialog.open(
            exercises[0].exerciseName,
            WorkoutDocumentType.Exercise,
            exercises[0]._id
          )}
      >
        Delete Exercise
      </Button>
    {/if}
    {#if muscleGroups[0]}
      <Button
        variant="destructive"
        onclick={() =>
          deleteDialog.open(
            muscleGroups[0].name,
            WorkoutDocumentType.MuscleGroup,
            muscleGroups[0]._id
          )}
      >
        Delete Muscle Group
      </Button>
    {/if}
    {#if equipment[0]}
      <Button
        variant="destructive"
        onclick={() =>
          deleteDialog.open(equipment[0].title, WorkoutDocumentType.Equipment, equipment[0]._id)}
      >
        Delete Equipment
      </Button>
    {/if}
  </div>
</div>
<SingletonDeleteDialog />
