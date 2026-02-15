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
      MockData.muscleGroupMapServiceMock.reset();
      MockData.equipmentTypeMapServiceMock.reset();
      MockData.exerciseMapServiceMock.reset();
      MockData.exerciseCalibrationMapServiceMock.reset();

      const muscleGroups = MockData.muscleGroupMapServiceMock.addDefaultMuscleGroups();
      const equipment = MockData.equipmentTypeMapServiceMock.addDefaultEquipmentTypes();
      const exercises = MockData.exerciseMapServiceMock.addDefaultExercises(
        muscleGroups,
        equipment
      );
      MockData.exerciseCalibrationMapServiceMock.addDefaultCalibrations();

      if (missing) {
        exerciseId = 'non-existent-id';
      } else {
        exerciseId = creating ? null : exercises[0]._id;
      }
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

<ExercisePage {exerciseId} {isNew} />
