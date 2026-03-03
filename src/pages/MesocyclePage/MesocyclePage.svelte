<!--
  @component

  Unified mesocycle page that handles three modes:
  - "new": Full form for creating a new mesocycle
  - "edit": Full form initialized from existing mesocycle (before it's started)
  - "static": Read-only view of a started mesocycle (only title is editable)

  In static mode, management actions (deload, end, delete) are handled by
  MesocyclePageActions.
-->
<script lang="ts">
  import { CycleType, WorkoutMesocycleSchema } from '@aneuhold/core-ts-db-lib';
  import { IconArrowLeft } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { formatCycleType } from '$pages/MesocyclesPage/mesocyclesPageUtils';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import mesocycleMapService, {
    type MesocycleChildDocs
  } from '$services/documentMapServices/mesocycleMapService.svelte';
  import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import { currentUserId } from '$stores/derived/currentUserId';
  import Button from '$ui/Button/Button.svelte';
  import { getCTOsForCalibrationIds } from '$util/exerciseCTOUtils';
  import MesocycleConfigCard from './MesocycleConfigCard.svelte';
  import MesocycleExercisesCard from './MesocycleExercisesCard.svelte';
  import MesocyclePageActions from './MesocyclePageActions.svelte';
  import {
    generateMesocycleChildren,
    getDefaultNewMesocycleStartDate,
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
    mesocycleId
      ? mesocycleMapService.getAssociatedDocsAndCTOsForMesocycle(mesocycleId as UUID)
      : null
  );

  // --- Mode ---

  const mode = $derived.by(() => {
    if (!mesocycleId) return MesocyclePageMode.New;
    if (!mesocycle) return null;
    return mesocycle.startDate ? MesocyclePageMode.Static : MesocyclePageMode.Edit;
  });
  const isFormMode = $derived(mode === MesocyclePageMode.New || mode === MesocyclePageMode.Edit);

  // --- Form state (derived from mesocycle, locally writable by form inputs) ---

  let formTitle = $derived(mesocycle?.title ?? '');

  let formStartDate = $derived.by(() => {
    if (mode === MesocyclePageMode.New) {
      return getDefaultNewMesocycleStartDate(mesocycleMapService.allDocs, (mId) =>
        microcycleMapService.getOrderedMicrocyclesForMesocycle(mId)
      );
    }
    if (mode === MesocyclePageMode.Edit) {
      const mcs = associatedDocs?.microcycles ?? [];
      return mcs.length > 0 ? getEarliestStartDate(mcs) : new Date();
    }
    return new Date();
  });

  let formCycleType = $derived<CycleType>(mesocycle?.cycleType ?? CycleType.MuscleGain);
  let formWeeks = $derived(mesocycle?.plannedMicrocycleCount ?? 6);
  let formSessionsPerWeek = $derived(mesocycle?.plannedSessionCountPerMicrocycle ?? 5);
  let formDaysPerCycle = $derived(mesocycle?.plannedMicrocycleLengthInDays ?? 7);
  let formRestDays = $derived<number[]>([...(mesocycle?.plannedMicrocycleRestDays ?? [0, 6])]);
  let formSelectedCalibrationIds = $derived<UUID[]>([...(mesocycle?.calibratedExercises ?? [])]);

  // --- Exercise CTOs ---

  /** Calibrated CTOs (form mode, for the selection UI) or scoped CTOs (static mode). */
  const exerciseCTOs = $derived(
    isFormMode
      ? exerciseMapService.exerciseCTOs.filter((cto) => cto.bestCalibration != null)
      : getCTOsForCalibrationIds(mesocycle?.calibratedExercises ?? [])
  );

  /** CTOs narrowed to only the user's current selection (form mode preview). */
  const selectedExerciseCTOs = $derived(getCTOsForCalibrationIds(formSelectedCalibrationIds));

  /** Exercises for display cards — selected subset in form mode, scoped set in static mode. */
  const displayExercises = $derived(isFormMode ? selectedExerciseCTOs : exerciseCTOs);

  // Prune selected calibration IDs that no longer exist (form mode only)
  $effect(() => {
    if (!isFormMode) return;
    const validIds = new Set(
      exerciseCTOs.map((cto) => cto.bestCalibration?._id).filter((id): id is UUID => id != null)
    );

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

  const generatedMesocycle = $derived.by(() => {
    if (!isFormMode || formSelectedCalibrationIds.length === 0) return null;
    try {
      return WorkoutMesocycleSchema.parse(buildMesocycleInput());
    } catch {
      return null;
    }
  });

  const previewResult = $derived.by(() => {
    if (!generatedMesocycle) return null;
    return generateMesocycleChildren(
      generatedMesocycle,
      selectedExerciseCTOs,
      muscleGroupMapService.allVolumeCTOs,
      formStartDate
    );
  });

  // --- Display data (unified across modes) ---

  const emptyDocs: MesocycleChildDocs = {
    microcycles: [],
    sessions: [],
    sessionExercises: [],
    sets: []
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

  // Overlap warning is computed by MesocycleConfigCard and synced back via bind
  let overlapWarning = $state<string | null>(null);

  // --- Validation (form mode) ---

  const isValid = $derived(
    formTitle.trim() !== '' &&
      generatedMesocycle !== null &&
      (previewResult?.microcycles ?? []).length > 0 &&
      overlapWarning == null
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
    persistNewMesocycle({ ...buildMesocycleInput(), title: formTitle || null }, formStartDate);
    goto('/mesocycles');
  }

  function handleSave() {
    if (!isValid || !mesocycle) return;
    persistMesocycleEdits(
      mesocycle,
      { ...buildMesocycleInput(), title: formTitle || null },
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
      {#if mesocycle}
        <div class="ml-auto">
          <MesocyclePageActions {mesocycle} microcycles={associatedDocs?.microcycles ?? []} />
        </div>
      {/if}
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
      bind:overlapWarning
      editingMesocycleId={mesocycle ? mesocycle._id : undefined}
    />

    <MesocycleExercisesCard
      {exerciseCTOs}
      bind:selectedCalibrationIds={formSelectedCalibrationIds}
    />

    <MesocycleSessionLayoutCard
      firstMicrocycle={displayDocs.microcycles[0]}
      previewSessions={displayDocs.sessions}
      previewSessionExercises={displayDocs.sessionExercises}
      exercises={displayExercises}
    />

    {#if generatedMesocycle && displayDocs.microcycles.length > 0}
      <MesocycleScheduleCard
        mesocycle={generatedMesocycle}
        microcycles={displayDocs.microcycles}
        sessions={displayDocs.sessions}
        sessionExercises={displayDocs.sessionExercises}
        sets={displayDocs.sets}
        exercises={displayExercises}
      />

      <MesocycleProgressionCard
        microcycles={displayDocs.microcycles}
        sessions={displayDocs.sessions}
        sessionExercises={displayDocs.sessionExercises}
        sets={displayDocs.sets}
        exercises={displayExercises}
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
      {exerciseCTOs}
      selectedCalibrationIds={mesocycle.calibratedExercises}
      disabled
    />

    <MesocycleSessionLayoutCard
      firstMicrocycle={displayDocs.microcycles[0]}
      previewSessions={displayDocs.sessions}
      previewSessionExercises={displayDocs.sessionExercises}
      exercises={displayExercises}
    />

    {#if displayDocs.microcycles.length > 0}
      <MesocycleScheduleCard
        {mesocycle}
        microcycles={displayDocs.microcycles}
        sessions={displayDocs.sessions}
        sessionExercises={displayDocs.sessionExercises}
        sets={displayDocs.sets}
        exercises={displayExercises}
      />

      <MesocycleProgressionCard
        microcycles={displayDocs.microcycles}
        sessions={displayDocs.sessions}
        sessionExercises={displayDocs.sessionExercises}
        sets={displayDocs.sets}
        exercises={displayExercises}
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
