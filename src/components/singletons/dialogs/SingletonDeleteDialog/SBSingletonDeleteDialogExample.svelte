<script lang="ts">
  import type { UUID } from 'crypto';
  import { untrack } from 'svelte';
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
      MockData.muscleGroupMapServiceMock.reset();
      MockData.equipmentTypeMapServiceMock.reset();
      MockData.exerciseMapServiceMock.reset();
      MockData.exerciseCalibrationMapServiceMock.reset();

      const mg = MockData.muscleGroupMapServiceMock.addDefaultMuscleGroups();
      const eq = MockData.equipmentTypeMapServiceMock.addDefaultEquipmentTypes();
      const ex = MockData.exerciseMapServiceMock.addDefaultExercises(mg, eq);
      MockData.exerciseCalibrationMapServiceMock.addDefaultCalibrations();

      exercises = ex;
      muscleGroups = Object.values(mg);
      equipment = Object.values(eq);
    });

    return () => {
      untrack(() => {
        MockData.muscleGroupMapServiceMock.reset();
        MockData.equipmentTypeMapServiceMock.reset();
        MockData.exerciseMapServiceMock.reset();
        MockData.exerciseCalibrationMapServiceMock.reset();
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
