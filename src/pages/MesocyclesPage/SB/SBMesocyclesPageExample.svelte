<script lang="ts">
  import {
    CycleType,
    type WorkoutEquipmentType,
    type WorkoutExercise,
    type WorkoutExerciseCalibration,
    WorkoutMesocycleService
  } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import MockData from '$testUtils/MockData';
  import MesocyclesPage from '../MesocyclesPage.svelte';

  let { storyMode = 'default' }: { storyMode?: 'default' | 'empty' | 'noActive' } = $props();

  function daysAgo(n: number): Date {
    return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  }

  function resetAll() {
    MockData.muscleGroupMapServiceMock.reset();
    MockData.equipmentTypeMapServiceMock.reset();
    MockData.exerciseMapServiceMock.reset();
    MockData.exerciseCalibrationMapServiceMock.reset();
    MockData.mesocycleMapServiceMock.reset();
    MockData.microcycleMapServiceMock.reset();
    MockData.sessionMapServiceMock.reset();
    MockData.sessionExerciseMapServiceMock.reset();
    MockData.setMapServiceMock.reset();
  }

  type BaseData = {
    mockExercises: WorkoutExercise[];
    calibrations: WorkoutExerciseCalibration[];
    equipmentTypes: WorkoutEquipmentType[];
  };

  function setupBaseData(): BaseData {
    const muscleGroups = MockData.muscleGroupMapServiceMock.addDefaultMuscleGroups();
    const equipment = MockData.equipmentTypeMapServiceMock.addDefaultEquipmentTypes();
    const mockExercises = MockData.exerciseMapServiceMock.addDefaultExercises(
      muscleGroups,
      equipment
    );
    const calibrations = MockData.exerciseCalibrationMapServiceMock.addDefaultCalibrations();
    const equipmentTypes = Object.values(equipment);
    return { mockExercises, calibrations, equipmentTypes };
  }

  function generateFullMesocycle(
    baseData: BaseData,
    config: {
      title?: string;
      cycleType?: CycleType;
      microcycleCount?: number;
      startDate: Date;
      completedSessionCount?: number;
      completedDate?: Date | null;
    }
  ) {
    const mesoDoc = MockData.mesocycleMapServiceMock.addMesocycle({
      title: config.title,
      cycleType: config.cycleType ?? CycleType.MuscleGain,
      plannedMicrocycleCount: config.microcycleCount ?? 4,
      plannedMicrocycleLengthInDays: 7,
      plannedMicrocycleRestDays: [0, 6],
      plannedSessionCountPerMicrocycle: 5,
      calibratedExercises: baseData.calibrations.map((c) => c._id)
    });

    const result = WorkoutMesocycleService.generateOrUpdateMesocycle(
      mesoDoc,
      baseData.calibrations,
      baseData.mockExercises,
      baseData.equipmentTypes
    );

    const genMicrocycles = result.microcycles?.create ?? [];
    const genSessions = result.sessions?.create ?? [];
    const genSessionExercises = result.sessionExercises?.create ?? [];
    const genSets = result.sets?.create ?? [];

    // Shift dates to start from the specified startDate
    if (genMicrocycles.length > 0) {
      const firstMicroStart = new Date(genMicrocycles[0].startDate);
      const dateOffset = config.startDate.getTime() - firstMicroStart.getTime();

      for (const mc of genMicrocycles) {
        mc.startDate = new Date(new Date(mc.startDate).getTime() + dateOffset);
        mc.endDate = new Date(new Date(mc.endDate).getTime() + dateOffset);
      }
      for (const s of genSessions) {
        s.startTime = new Date(new Date(s.startTime).getTime() + dateOffset);
      }
    }

    // Mark sessions as completed
    const completedCount = config.completedSessionCount ?? 0;
    let completedSoFar = 0;
    for (const s of genSessions) {
      if (completedSoFar < completedCount) {
        s.complete = true;
        completedSoFar++;
      }
    }

    // Populate actual data on sets belonging to completed sessions
    const completedSessionIds = new Set(
      genSessions.filter((s) => s.complete).map((s) => s._id as string)
    );
    for (const set of genSets) {
      if (completedSessionIds.has(set.workoutSessionId as string)) {
        set.actualReps = (set.plannedReps ?? 8) + Math.floor(Math.random() * 3) - 1;
        set.actualWeight = set.plannedWeight ?? 135;
        set.rir = Math.max(0, (set.plannedRir ?? 3) - 1);
      }
    }

    // Mark mesocycle as completed if needed
    if (config.completedDate) {
      mesoDoc.completedDate = config.completedDate;
      mesocycleMapService.setMap({
        ...Object.fromEntries(mesocycleMapService.getDocs().map((d) => [d._id, d])),
        [mesoDoc._id as string]: mesoDoc
      });
    }

    MockData.microcycleMapServiceMock.addManyMicrocycles(genMicrocycles);
    MockData.sessionMapServiceMock.addManySessions(genSessions);
    MockData.sessionExerciseMapServiceMock.addManySessionExercises(genSessionExercises);
    MockData.setMapServiceMock.addManySets(genSets);
  }

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      resetAll();

      if (mode === 'empty') {
        // No data at all
        return;
      }

      const baseData = setupBaseData();

      if (mode === 'default') {
        // Active mesocycle (started ~3 weeks ago, 8 completed sessions)
        generateFullMesocycle(baseData, {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: daysAgo(21),
          completedSessionCount: 8
        });
      }

      // Past mesocycles for both "default" and "noActive"
      generateFullMesocycle(baseData, {
        title: 'Foundation Phase',
        cycleType: CycleType.MuscleGain,
        microcycleCount: 4,
        startDate: daysAgo(70),
        completedSessionCount: 20,
        completedDate: daysAgo(42)
      });

      generateFullMesocycle(baseData, {
        title: 'Deload & Recovery',
        cycleType: CycleType.Resensitization,
        microcycleCount: 2,
        startDate: daysAgo(98),
        completedSessionCount: 10,
        completedDate: daysAgo(72)
      });
    });

    return () => {
      untrack(() => {
        resetAll();
      });
    };
  });
</script>

<MesocyclesPage />
