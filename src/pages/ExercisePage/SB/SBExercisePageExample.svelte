<script lang="ts">
  import { untrack } from 'svelte';
  import MockData from '$testUtils/MockData';
  import ExercisePage from '../ExercisePage.svelte';

  let {
    isNew = false
  }: {
    isNew?: boolean;
  } = $props();

  let exerciseId = $state<string | null>(null);

  $effect(() => {
    const creating = isNew;

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

      exerciseId = creating ? null : exercises[0]._id;
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
