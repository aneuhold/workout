<!--
  @component

  Full page for creating a new mesocycle. Contains form state, reactive preview
  generation via WorkoutMesocycleService, and submission logic.
-->
<script lang="ts">
  import {
    CycleType,
    WorkoutMesocycleSchema,
    WorkoutMesocycleService
  } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import { goto } from '$app/navigation';
  import { formatCycleType } from '$pages/MesocyclesPage/mesocyclesPageUtils';
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
  import sessionExerciseMapService from '$services/documentMapServices/sessionExerciseMapService.svelte';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
  import setMapService from '$services/documentMapServices/setMapService.svelte';
  import { currentUserId } from '$stores/derived/currentUserId';
  import MesocycleConfigCard from './MesocycleConfigCard.svelte';
  import MesocycleExercisesCard from './MesocycleExercisesCard.svelte';
  import { buildCalibratedExercisePairs, getDocsForCalibrationIds } from './mesocyclePageUtils';
  import MesocycleProgressionCard from './MesocycleProgressionCard.svelte';
  import MesocycleScheduleCard from './MesocycleScheduleCard.svelte';
  import MesocycleSummaryCard from './MesocycleSummaryCard.svelte';

  // --- Form state ---

  let formTitle = $state('');
  let formCycleType = $state<CycleType>(CycleType.MuscleGain);
  let formWeeks = $state(6);
  let formSessionsPerWeek = $state(5);
  let formDaysPerCycle = $state(7);
  let formRestDays = $state<number[]>([0, 6]);
  let formSelectedCalibrationIds = $state<UUID[]>([]);

  // --- Data sources ---

  const allCalibrations = $derived(exerciseCalibrationMapService.getDocs());
  const allExercises = $derived(exerciseMapService.getDocs());
  const allEquipmentTypes = $derived(equipmentTypeMapService.getDocs());

  // Build calibration-exercise pairs (latest calibration per exercise)
  const calibratedExercisePairs = $derived(
    buildCalibratedExercisePairs(allCalibrations, allExercises)
  );

  // Prune selected calibration IDs that no longer exist in the available pairs
  $effect(() => {
    const validIds = new Set(calibratedExercisePairs.map((p) => p.calibration._id));
    const pruned = formSelectedCalibrationIds.filter((id) => validIds.has(id));
    if (pruned.length !== formSelectedCalibrationIds.length) {
      formSelectedCalibrationIds = pruned;
    }
  });

  // --- Helpers ---

  function buildMesocycleInput() {
    return {
      userId: $currentUserId,
      cycleType: formCycleType,
      plannedSessionCountPerMicrocycle: formSessionsPerWeek,
      plannedMicrocycleLengthInDays: formDaysPerCycle,
      plannedMicrocycleRestDays: formRestDays,
      plannedMicrocycleCount: formWeeks,
      calibratedExercises: formSelectedCalibrationIds
    };
  }

  // --- Reactive preview ---

  /**
   * A mesocycle parsed from the form fields that affect generation (excludes
   * title so that typing in the title field doesn't re-run the generation).
   */
  const generationMesocycle = $derived.by(() => {
    if (formSelectedCalibrationIds.length === 0) return null;
    try {
      return WorkoutMesocycleSchema.parse(buildMesocycleInput());
    } catch {
      return null;
    }
  });

  const previewResult = $derived.by(() => {
    if (!generationMesocycle) return null;
    const { calibrations, exercises } = getDocsForCalibrationIds(
      formSelectedCalibrationIds,
      allCalibrations,
      allExercises
    );
    try {
      const result = WorkoutMesocycleService.generateOrUpdateMesocycle(
        generationMesocycle,
        calibrations,
        exercises,
        allEquipmentTypes
      );
      return {
        microcycles: result.microcycles?.create ?? [],
        sessions: result.sessions?.create ?? [],
        sessionExercises: result.sessionExercises?.create ?? [],
        sets: result.sets?.create ?? [],
        exercises
      };
    } catch {
      return null;
    }
  });

  const previewMicrocycles = $derived(previewResult?.microcycles ?? []);
  const previewSessions = $derived(previewResult?.sessions ?? []);
  const previewSessionExercises = $derived(previewResult?.sessionExercises ?? []);
  const previewSets = $derived(previewResult?.sets ?? []);
  const previewExercises = $derived(previewResult?.exercises ?? []);

  // --- Summary stats ---

  const totalSessions = $derived(previewSessions.length);
  const uniqueExercises = $derived(formSelectedCalibrationIds.length);
  const cycleTypeLabel = $derived(formatCycleType(formCycleType));
  const isValid = $derived(
    formTitle.trim() !== '' && generationMesocycle !== null && previewMicrocycles.length > 0
  );

  // --- Submission ---

  function handleCreate() {
    if (!isValid) return;

    // Create a fresh mesocycle document (not reusing preview IDs)
    const mesocycleDoc = WorkoutMesocycleSchema.parse({
      ...buildMesocycleInput(),
      title: formTitle || null
    });

    mesocycleMapService.addDoc(mesocycleDoc);

    // Generate fresh child documents
    const { calibrations, exercises } = getDocsForCalibrationIds(
      formSelectedCalibrationIds,
      allCalibrations,
      allExercises
    );

    const result = WorkoutMesocycleService.generateOrUpdateMesocycle(
      mesocycleDoc,
      calibrations,
      exercises,
      allEquipmentTypes
    );

    const microcycles = result.microcycles?.create ?? [];
    const sessions = result.sessions?.create ?? [];
    const sessionExercises = result.sessionExercises?.create ?? [];
    const sets = result.sets?.create ?? [];

    if (microcycles.length > 0) microcycleMapService.addManyDocs(microcycles);
    if (sessions.length > 0) sessionMapService.addManyDocs(sessions);
    if (sessionExercises.length > 0) sessionExerciseMapService.addManyDocs(sessionExercises);
    if (sets.length > 0) setMapService.addManyDocs(sets);

    goto('/mesocycles');
  }
</script>

<div class="flex flex-col gap-4 p-4">
  <h1 class="text-xl font-semibold">New Mesocycle</h1>

  <MesocycleConfigCard
    bind:title={formTitle}
    bind:cycleType={formCycleType}
    bind:weeks={formWeeks}
    bind:sessionsPerWeek={formSessionsPerWeek}
    bind:daysPerCycle={formDaysPerCycle}
    bind:restDays={formRestDays}
  />

  <MesocycleExercisesCard
    {calibratedExercisePairs}
    bind:selectedCalibrationIds={formSelectedCalibrationIds}
    firstMicrocycle={previewMicrocycles[0]}
    {previewSessions}
    {previewSessionExercises}
    exercises={previewExercises}
  />

  {#if generationMesocycle && previewMicrocycles.length > 0}
    <MesocycleScheduleCard
      mesocycle={generationMesocycle}
      microcycles={previewMicrocycles}
      sessions={previewSessions}
      sessionExercises={previewSessionExercises}
      sets={previewSets}
      exercises={previewExercises}
    />

    <MesocycleProgressionCard
      microcycles={previewMicrocycles}
      sessions={previewSessions}
      sessionExercises={previewSessionExercises}
      sets={previewSets}
      exercises={previewExercises}
    />

    <MesocycleSummaryCard
      totalWeeks={formWeeks}
      {totalSessions}
      {uniqueExercises}
      {cycleTypeLabel}
      {isValid}
      onCreate={handleCreate}
    />
  {/if}
</div>
