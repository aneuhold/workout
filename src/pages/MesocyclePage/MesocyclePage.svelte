<!--
  @component

  Unified mesocycle page that handles three modes:
  - "new": Full form for creating a new mesocycle
  - "edit": Full form initialized from existing mesocycle (before it's started)
  - "static": Read-only view of a started mesocycle (only title is editable)
-->
<script lang="ts">
  import { CycleType, WorkoutMesocycleSchema } from '@aneuhold/core-ts-db-lib';
  import { IconArrowLeft } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { formatCycleType } from '$pages/MesocyclesPage/mesocyclesPageUtils';
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import mesocycleMapService, {
    type MesocycleChildDocs
  } from '$services/documentMapServices/mesocycleMapService.svelte';
  import { currentUserId } from '$stores/derived/currentUserId';
  import Button from '$ui/Button/Button.svelte';
  import MesocycleConfigCard from './MesocycleConfigCard.svelte';
  import MesocycleExercisesCard from './MesocycleExercisesCard.svelte';
  import {
    buildCalibratedExercisePairs,
    generateMesocycleChildren,
    getEarliestStartDate,
    MesocyclePageMode,
    persistMesocycleEdits,
    persistNewMesocycle
  } from './mesocyclePageUtils';
  import MesocycleProgressionCard from './MesocycleProgressionCard.svelte';
  import MesocycleScheduleCard from './MesocycleScheduleCard.svelte';
  import MesocycleSessionLayoutCard from './MesocycleSessionLayoutCard.svelte';
  import MesocycleSummaryCard from './MesocycleSummaryCard.svelte';

  let {
    mesocycleId
  }: {
    mesocycleId?: string | null;
  } = $props();

  // --- Data ---

  const mesocycle = $derived(
    mesocycleId ? mesocycleMapService.getDoc(mesocycleId as UUID) : undefined
  );

  const associatedDocs = $derived(
    mesocycleId ? mesocycleMapService.getAssociatedDocsForMesocycle(mesocycleId as UUID) : null
  );

  // --- Mode ---

  const mode = $derived.by(() => {
    if (!mesocycleId) return MesocyclePageMode.New;
    if (!mesocycle) return null;
    return mesocycle.startDate ? MesocyclePageMode.Static : MesocyclePageMode.Edit;
  });
  const isFormMode = $derived(mode === MesocyclePageMode.New || mode === MesocyclePageMode.Edit);

  // --- Form state ---

  let formTitle = $state('');
  let formStartDate = $state(new Date());
  let formCycleType = $state<CycleType>(CycleType.MuscleGain);
  let formWeeks = $state(6);
  let formSessionsPerWeek = $state(5);
  let formDaysPerCycle = $state(7);
  let formRestDays = $state<number[]>([0, 6]);
  let formSelectedCalibrationIds = $state<UUID[]>([]);

  // Initialize form from existing mesocycle (edit and static modes)
  let formInitialized = $state(false);

  $effect(() => {
    const currentMode = mode;
    const currentMesocycle = mesocycle;
    const currentDocs = associatedDocs;

    untrack(() => {
      if (formInitialized || !currentMesocycle) return;
      formTitle = currentMesocycle.title ?? '';
      if (currentMode === MesocyclePageMode.Edit) {
        formCycleType = currentMesocycle.cycleType;
        formWeeks = currentMesocycle.plannedMicrocycleCount ?? 6;
        formSessionsPerWeek = currentMesocycle.plannedSessionCountPerMicrocycle;
        formDaysPerCycle = currentMesocycle.plannedMicrocycleLengthInDays;
        formRestDays = [...currentMesocycle.plannedMicrocycleRestDays];
        formSelectedCalibrationIds = [...currentMesocycle.calibratedExercises];
        const mcs = currentDocs?.microcycles ?? [];
        if (mcs.length > 0) {
          formStartDate = getEarliestStartDate(mcs);
        }
        formInitialized = true;
      } else if (currentMode === MesocyclePageMode.Static) {
        formInitialized = true;
      }
    });
  });

  // --- Data sources (for form mode) ---

  const dataSources = $derived({
    calibrations: exerciseCalibrationMapService.getDocs(),
    exercises: exerciseMapService.getDocs(),
    equipmentTypes: equipmentTypeMapService.getDocs()
  });

  // --- Calibration-exercise pairs ---

  const calibratedExercisePairs = $derived(
    isFormMode
      ? buildCalibratedExercisePairs(dataSources.calibrations, dataSources.exercises)
      : buildCalibratedExercisePairs(
          associatedDocs?.calibrations ?? [],
          associatedDocs?.exercises ?? []
        )
  );

  // Prune selected calibration IDs that no longer exist (form mode only)
  $effect(() => {
    if (!isFormMode) return;
    const validIds = new Set(calibratedExercisePairs.map((p) => p.calibration._id));

    untrack(() => {
      const pruned = formSelectedCalibrationIds.filter((id) => validIds.has(id));
      if (pruned.length !== formSelectedCalibrationIds.length) {
        formSelectedCalibrationIds = pruned;
      }
    });
  });

  // --- Reactive preview (form mode) ---

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

  const generationMesocycle = $derived.by(() => {
    if (!isFormMode || formSelectedCalibrationIds.length === 0) return null;
    try {
      return WorkoutMesocycleSchema.parse(buildMesocycleInput());
    } catch {
      return null;
    }
  });

  const previewResult = $derived.by(() => {
    if (!generationMesocycle) return null;
    return generateMesocycleChildren(
      generationMesocycle,
      formSelectedCalibrationIds,
      dataSources,
      formStartDate
    );
  });

  // --- Display data (unified across modes) ---

  const emptyDocs: MesocycleChildDocs = {
    microcycles: [],
    sessions: [],
    sessionExercises: [],
    sets: [],
    exercises: []
  };
  const displayDocs = $derived(
    isFormMode ? (previewResult ?? emptyDocs) : (associatedDocs ?? emptyDocs)
  );

  /**
   * Static mode start date (from earliest microcycle)
   */
  const staticStartDate = $derived(getEarliestStartDate(associatedDocs?.microcycles ?? []));

  const totalSessions = $derived(displayDocs.sessions.length);
  const uniqueExercises = $derived(
    isFormMode ? formSelectedCalibrationIds.length : (mesocycle?.calibratedExercises ?? []).length
  );
  const cycleTypeLabel = $derived(
    isFormMode
      ? formatCycleType(formCycleType)
      : mesocycle
        ? formatCycleType(mesocycle.cycleType)
        : ''
  );

  // --- Validation (form mode) ---

  const isValid = $derived(
    formTitle.trim() !== '' &&
      generationMesocycle !== null &&
      (previewResult?.microcycles ?? []).length > 0
  );

  // --- Title editing (static mode) ---

  function handleTitleBlur() {
    if (!mesocycle) return;
    const trimmed = formTitle.trim();
    if (trimmed === (mesocycle.title ?? '')) return;
    mesocycleMapService.updateDoc(mesocycle._id, (doc) => {
      doc.title = trimmed || null;
      return doc;
    });
  }

  // --- Submission ---

  function handleCreate() {
    if (!isValid) return;
    persistNewMesocycle(
      { ...buildMesocycleInput(), title: formTitle || null },
      dataSources,
      formStartDate
    );
    goto('/mesocycles');
  }

  function handleSave() {
    if (!isValid || !mesocycle) return;
    persistMesocycleEdits(
      mesocycle,
      { ...buildMesocycleInput(), title: formTitle || null },
      dataSources,
      formStartDate
    );
    goto('/mesocycles');
  }
</script>

<div class="flex flex-col gap-4 p-4">
  <!-- Header -->
  {#if mode === MesocyclePageMode.New}
    <h1 class="text-xl font-semibold">New Mesocycle</h1>
  {:else}
    <div class="flex items-center gap-2">
      <Button variant="ghost" size="sm" onclick={() => goto('/mesocycles')}>
        <IconArrowLeft size={16} />
      </Button>
      <h1 class="text-xl font-semibold">Mesocycle</h1>
    </div>
  {/if}

  {#if mesocycleId && !mesocycle}
    <p class="text-sm text-muted-foreground">Mesocycle not found.</p>
  {:else if isFormMode}
    <MesocycleConfigCard
      bind:title={formTitle}
      bind:startDate={formStartDate}
      bind:cycleType={formCycleType}
      bind:weeks={formWeeks}
      bind:sessionsPerWeek={formSessionsPerWeek}
      bind:daysPerCycle={formDaysPerCycle}
      bind:restDays={formRestDays}
    />

    <MesocycleExercisesCard
      {calibratedExercisePairs}
      bind:selectedCalibrationIds={formSelectedCalibrationIds}
    />

    <MesocycleSessionLayoutCard
      firstMicrocycle={displayDocs.microcycles[0]}
      previewSessions={displayDocs.sessions}
      previewSessionExercises={displayDocs.sessionExercises}
      exercises={displayDocs.exercises}
    />

    {#if generationMesocycle && displayDocs.microcycles.length > 0}
      <MesocycleScheduleCard
        mesocycle={generationMesocycle}
        microcycles={displayDocs.microcycles}
        sessions={displayDocs.sessions}
        sessionExercises={displayDocs.sessionExercises}
        sets={displayDocs.sets}
        exercises={displayDocs.exercises}
      />

      <MesocycleProgressionCard
        microcycles={displayDocs.microcycles}
        sessions={displayDocs.sessions}
        sessionExercises={displayDocs.sessionExercises}
        sets={displayDocs.sets}
        exercises={displayDocs.exercises}
      />

      <MesocycleSummaryCard
        totalWeeks={formWeeks}
        {totalSessions}
        {uniqueExercises}
        sessionsPerCycle={formSessionsPerWeek}
        {cycleTypeLabel}
        {isValid}
        onCreate={mode === MesocyclePageMode.New ? handleCreate : undefined}
        onSave={mode === MesocyclePageMode.Edit ? handleSave : undefined}
      />
    {/if}
  {:else if mesocycle}
    <MesocycleConfigCard
      bind:title={formTitle}
      startDate={staticStartDate}
      cycleType={mesocycle.cycleType}
      weeks={mesocycle.plannedMicrocycleCount ?? 0}
      sessionsPerWeek={mesocycle.plannedSessionCountPerMicrocycle}
      daysPerCycle={mesocycle.plannedMicrocycleLengthInDays}
      restDays={mesocycle.plannedMicrocycleRestDays}
      disabled
      onTitleBlur={handleTitleBlur}
    />

    <MesocycleExercisesCard
      {calibratedExercisePairs}
      selectedCalibrationIds={mesocycle.calibratedExercises}
      disabled
    />

    <MesocycleSessionLayoutCard
      firstMicrocycle={displayDocs.microcycles[0]}
      previewSessions={displayDocs.sessions}
      previewSessionExercises={displayDocs.sessionExercises}
      exercises={displayDocs.exercises}
    />

    {#if displayDocs.microcycles.length > 0}
      <MesocycleScheduleCard
        {mesocycle}
        microcycles={displayDocs.microcycles}
        sessions={displayDocs.sessions}
        sessionExercises={displayDocs.sessionExercises}
        sets={displayDocs.sets}
        exercises={displayDocs.exercises}
      />

      <MesocycleProgressionCard
        microcycles={displayDocs.microcycles}
        sessions={displayDocs.sessions}
        sessionExercises={displayDocs.sessionExercises}
        sets={displayDocs.sets}
        exercises={displayDocs.exercises}
      />

      <MesocycleSummaryCard
        totalWeeks={mesocycle.plannedMicrocycleCount ?? 0}
        {totalSessions}
        {uniqueExercises}
        {cycleTypeLabel}
      />
    {/if}
  {/if}
</div>
