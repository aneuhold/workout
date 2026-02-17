<!--
  @component

  View page for an existing mesocycle. Displays all details in disabled cards,
  with only the title remaining editable (auto-saved on blur).
-->
<script lang="ts">
  import { IconArrowLeft } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import { goto } from '$app/navigation';
  import { formatCycleType } from '$pages/MesocyclesPage/mesocyclesPageUtils';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import Button from '$ui/Button/Button.svelte';
  import MesocycleConfigCard from './MesocycleConfigCard.svelte';
  import MesocycleExercisesCard from './MesocycleExercisesCard.svelte';
  import { buildCalibratedExercisePairs, getDocsForCalibrationIds } from './mesocyclePageUtils';
  import MesocycleProgressionCard from './MesocycleProgressionCard.svelte';
  import MesocycleScheduleCard from './MesocycleScheduleCard.svelte';
  import MesocycleSummaryCard from './MesocycleSummaryCard.svelte';

  let {
    mesocycleId
  }: {
    mesocycleId: string | null;
  } = $props();

  // --- Data ---

  const mesocycle = $derived(
    mesocycleId ? mesocycleMapService.getDoc(mesocycleId as UUID) : undefined
  );

  const associatedDocs = $derived(
    mesocycleId ? mesocycleMapService.getAssociatedDocsForMesocycle(mesocycleId as UUID) : null
  );

  const allCalibrations = $derived(exerciseCalibrationMapService.getDocs());
  const allExercises = $derived(exerciseMapService.getDocs());

  // Build calibration-exercise pairs for the mesocycle's calibrated exercises
  const filteredCalibrations = $derived(
    mesocycle ? allCalibrations.filter((c) => mesocycle.calibratedExercises.includes(c._id)) : []
  );
  const calibratedExercisePairs = $derived(
    buildCalibratedExercisePairs(filteredCalibrations, allExercises)
  );

  const selectedCalibrationIds = $derived(mesocycle?.calibratedExercises ?? []);

  // --- Title editing ---

  let formTitle = $state('');
  let titleInitialized = $state(false);

  $effect(() => {
    if (mesocycle && !titleInitialized) {
      formTitle = mesocycle.title ?? '';
      titleInitialized = true;
    }
  });

  function handleTitleBlur() {
    if (!mesocycle) return;
    const trimmed = formTitle.trim();
    if (trimmed === (mesocycle.title ?? '')) return;
    mesocycleMapService.updateDoc(mesocycle._id, (doc) => {
      doc.title = trimmed || null;
      return doc;
    });
  }

  // --- Derived values for cards ---

  const microcycles = $derived(associatedDocs?.microcycles ?? []);
  const sessions = $derived(associatedDocs?.sessions ?? []);
  const sessionExercises = $derived(associatedDocs?.sessionExercises ?? []);
  const sets = $derived(associatedDocs?.sets ?? []);
  const exercises = $derived(
    mesocycle
      ? getDocsForCalibrationIds(mesocycle.calibratedExercises, allCalibrations, allExercises)
          .exercises
      : []
  );

  // Start date from the earliest microcycle
  const mesocycleStartDate = $derived.by(() => {
    if (microcycles.length === 0) return new Date();
    const sorted = [...microcycles].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    return new Date(sorted[0].startDate);
  });

  // Summary stats
  const totalSessions = $derived(sessions.length);
  const uniqueExercises = $derived(selectedCalibrationIds.length);
  const cycleTypeLabel = $derived(mesocycle ? formatCycleType(mesocycle.cycleType) : '');
</script>

<div class="flex flex-col gap-4 p-4">
  <!-- Header -->
  <div class="flex items-center gap-2">
    <Button variant="ghost" size="sm" onclick={() => goto('/mesocycles')}>
      <IconArrowLeft size={16} />
    </Button>
    <h1 class="text-xl font-semibold">Mesocycle</h1>
  </div>

  {#if !mesocycleId}
    <p class="text-sm text-muted-foreground">No mesocycle ID provided.</p>
  {:else if !mesocycle}
    <p class="text-sm text-muted-foreground">Mesocycle not found.</p>
  {:else}
    <MesocycleConfigCard
      bind:title={formTitle}
      startDate={mesocycleStartDate}
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
      {selectedCalibrationIds}
      firstMicrocycle={microcycles[0]}
      previewSessions={sessions}
      previewSessionExercises={sessionExercises}
      {exercises}
      disabled
    />

    {#if microcycles.length > 0}
      <MesocycleScheduleCard
        {mesocycle}
        {microcycles}
        {sessions}
        {sessionExercises}
        {sets}
        {exercises}
      />

      <MesocycleProgressionCard {microcycles} {sessions} {sessionExercises} {sets} {exercises} />

      <MesocycleSummaryCard
        totalWeeks={mesocycle.plannedMicrocycleCount ?? 0}
        {totalSessions}
        {uniqueExercises}
        {cycleTypeLabel}
      />
    {/if}
  {/if}
</div>
