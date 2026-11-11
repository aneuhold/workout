<script lang="ts" module>
  export enum MesocyclePageStoryMode {
    New = 'new',
    NewWithExisting = 'newWithExisting',
    NewOverlapping = 'newOverlapping',
    Edit = 'edit',
    EditWithFewerExercises = 'editWithFewerExercises',
    Static = 'static',
    ActiveInProgress = 'activeInProgress',
    Completed = 'completed',
    NotFound = 'notFound'
  }
</script>

<script lang="ts">
  import { CycleType, DocumentService } from '@aneuhold/core-ts-db-lib';
  import { DateService } from '@aneuhold/core-ts-lib';
  import type { UUID } from 'crypto';
  import { untrack } from 'svelte';
  import { MockDefaultExercise } from '$services/documentMapServices/ExerciseMap.service.mock';
  import mesocycleMapServiceMock from '$services/documentMapServices/MesocycleMap.service.mock';
  import muscleGroupMapServiceMock, {
    MockDefaultMuscleGroup
  } from '$services/documentMapServices/MuscleGroupMap.service.mock';
  import MockDataService from '$services/MockDataService/MockData.service';
  import MesocyclePage from '../MesocyclePage.svelte';

  let { storyMode = MesocyclePageStoryMode.New }: { storyMode?: MesocyclePageStoryMode } = $props();

  let mesocycleId = $state<UUID | null>(null);

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockDataService.resetAll();

      if (mode === MesocyclePageStoryMode.New) {
        MockDataService.setupBaseData();
        mesocycleId = null;
        return;
      }

      if (mode === MesocyclePageStoryMode.NewWithExisting) {
        const baseData = MockDataService.setupBaseData();
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Current Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: DateService.addDays(new Date(), -14),
          completedSessionCount: 6
        });
        mesocycleId = null;
        return;
      }

      if (mode === MesocyclePageStoryMode.NewOverlapping) {
        const baseData = MockDataService.setupBaseData();

        // Active mesocycle ending in ~7 days
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Current Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 2,
          startDate: DateService.addDays(new Date(), -7),
          completedSessionCount: 4
        });

        // Future mesocycle starting 14 days from now (not yet started, 2 microcycles
        // so its end date stays close to the gap for calendar visibility)
        mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Upcoming Strength Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 2,
          startDate: DateService.addDays(new Date(), 14),
          completedSessionCount: 0
        });

        mesocycleId = null;
        return;
      }

      if (mode === MesocyclePageStoryMode.NotFound) {
        mesocycleId = DocumentService.generateID();
        return;
      }

      const baseData = MockDataService.setupBaseData();

      if (mode === MesocyclePageStoryMode.Edit) {
        const { mesocycle } = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Strength Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: new Date(),
          completedSessionCount: 0
        });

        mesocycleId = mesocycle._id;
        return;
      }

      if (mode === MesocyclePageStoryMode.EditWithFewerExercises) {
        // The last mesocycle trained Chest and Lats with two exercises each; the next one drops
        // one of each.
        muscleGroupMapServiceMock.setVolumeHistory({
          [MockDefaultMuscleGroup.Chest]: { startingSetCount: 4, exerciseCount: 2 },
          [MockDefaultMuscleGroup.Lats]: { startingSetCount: 4, exerciseCount: 2 }
        });

        const droppedExerciseNames: string[] = [
          MockDefaultExercise.InclineDumbbellPress,
          MockDefaultExercise.BarbellRow
        ];
        const droppedExerciseIds = new Set(
          baseData.exercises
            .filter((exercise) => droppedExerciseNames.includes(exercise.exerciseName))
            .map((exercise) => exercise._id)
        );
        const mesocycle = mesocycleMapServiceMock.addMesocycle({
          title: 'Next Block',
          calibratedExercises: baseData.calibrations
            .filter((calibration) => !droppedExerciseIds.has(calibration.workoutExerciseId))
            .map((calibration) => calibration._id)
        });

        mesocycleId = mesocycle._id;
        return;
      }

      if (mode === MesocyclePageStoryMode.Completed) {
        const { mesocycle } = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
          title: 'Completed Strength Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: DateService.addDays(new Date(), -35),
          completedSessionCount: 20,
          completedDate: DateService.addDays(new Date(), -7)
        });

        mesocycleId = mesocycle._id;
        return;
      }

      // static and activeInProgress modes: active mesocycle with dropdown showing Deload / End
      const data = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: DateService.addDays(new Date(), -21),
        completedSessionCount: 8
      });

      if (mode === MesocyclePageStoryMode.ActiveInProgress) {
        mesocycleMapServiceMock.makeFirstIncompleteSessionInProgress(data);
      }

      mesocycleId = data.mesocycle._id;
    });

    return () => {
      untrack(() => {
        MockDataService.resetAll();
      });
    };
  });
</script>

<MesocyclePage {mesocycleId} />
