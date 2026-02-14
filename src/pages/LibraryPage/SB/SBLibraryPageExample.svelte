<script lang="ts">
  import { untrack } from 'svelte';
  import MockData from '$testUtils/MockData';
  import LibraryPage from '../LibraryPage.svelte';

  let { populateDefaultData = true }: { populateDefaultData?: boolean } = $props();

  $effect(() => {
    // Track props to re-run the effect when they change
    const populate = populateDefaultData;

    untrack(() => {
      MockData.muscleGroupMapServiceMock.reset();
      MockData.equipmentTypeMapServiceMock.reset();
      MockData.exerciseMapServiceMock.reset();
      MockData.exerciseCalibrationMapServiceMock.reset();

      if (populate) {
        const muscleGroups = MockData.muscleGroupMapServiceMock.addDefaultMuscleGroups();
        const equipment = MockData.equipmentTypeMapServiceMock.addDefaultEquipmentTypes();
        MockData.exerciseMapServiceMock.addDefaultExercises(muscleGroups, equipment);
        MockData.exerciseCalibrationMapServiceMock.addDefaultCalibrations();
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

<LibraryPage />
