<!--
  @component

  Visualizes exercise progression across a mesocycle. Shows per-session tabs
  with exercise tables displaying cycle-by-cycle RIR, sets, and target
  weight/rep progression. Supports both planned-only and completed data.
-->
<script lang="ts">
  import type {
    WorkoutExercise,
    WorkoutMicrocycle,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import Table from '$ui/Table/Table.svelte';
  import TableBody from '$ui/Table/TableBody.svelte';
  import TableCell from '$ui/Table/TableCell.svelte';
  import TableHead from '$ui/Table/TableHead.svelte';
  import TableHeader from '$ui/Table/TableHeader.svelte';
  import TableRow from '$ui/Table/TableRow.svelte';
  import Tabs from '$ui/Tabs/Tabs.svelte';
  import TabsContent from '$ui/Tabs/TabsContent.svelte';
  import TabsList from '$ui/Tabs/TabsList.svelte';
  import TabsTrigger from '$ui/Tabs/TabsTrigger.svelte';

  type SetTarget = {
    plannedReps: number | null;
    plannedWeight: number | null;
    plannedRir: number | null;
    actualReps: number | null;
    actualWeight: number | null;
    actualRir: number | null;
    hasActual: boolean;
  };

  type CycleRow = {
    cycleLabel: string;
    isDeload: boolean;
    rirRange: string;
    setCount: number;
    prevSetCount: number | null;
    targets: SetTarget[];
    prevTargets: SetTarget[] | null;
  };

  type ExerciseProgression = {
    exerciseId: UUID;
    exerciseName: string;
    rows: CycleRow[];
  };

  type SessionTab = {
    sessionTitle: string;
    tabValue: string;
    exercises: ExerciseProgression[];
  };

  let {
    microcycles,
    sessions,
    sessionExercises,
    sets,
    exercises
  }: {
    microcycles: WorkoutMicrocycle[];
    sessions: WorkoutSession[];
    sessionExercises: WorkoutSessionExercise[];
    sets: WorkoutSet[];
    exercises: WorkoutExercise[];
  } = $props();

  const exerciseMap = $derived(
    new SvelteMap(exercises.map((exercise) => [exercise._id, exercise]))
  );

  // Build session-exercise-set lookup maps
  const sessionExercisesBySession = $derived.by(() => {
    const map = new SvelteMap<UUID, WorkoutSessionExercise[]>();
    for (const sessionExercise of sessionExercises) {
      const existing = map.get(sessionExercise.workoutSessionId) ?? [];
      existing.push(sessionExercise);
      map.set(sessionExercise.workoutSessionId, existing);
    }
    return map;
  });

  const setsBySessionExercise = $derived.by(() => {
    const map = new SvelteMap<UUID, WorkoutSet[]>();
    for (const set of sets) {
      const existing = map.get(set.workoutSessionExerciseId) ?? [];
      existing.push(set);
      map.set(set.workoutSessionExerciseId, existing);
    }
    return map;
  });

  // Group sessions by microcycle
  const sessionsByMicrocycle = $derived.by(() => {
    const map = new SvelteMap<UUID, WorkoutSession[]>();
    for (const microcycle of microcycles) {
      const microcycleSessions = microcycle.sessionOrder
        .map((sessionId) => sessions.find((session) => session._id === sessionId))
        .filter((session): session is WorkoutSession => session !== undefined);
      map.set(microcycle._id, microcycleSessions);
    }
    return map;
  });

  // Derive unique session definitions from the first microcycle
  const sessionTabs = $derived.by((): SessionTab[] => {
    if (microcycles.length === 0) return [];

    // Use sessions from first microcycle to determine session definitions
    const firstMicrocycleSessions = sessionsByMicrocycle.get(microcycles[0]._id) ?? [];
    const totalCycles = microcycles.length;
    const lastCycleIndex = totalCycles - 1;

    return firstMicrocycleSessions.map((templateSession, sessionIndex) => {
      // Collect all session exercises across all cycles for this session position
      const exerciseProgressions = new SvelteMap<UUID, CycleRow[]>();
      const exerciseOrder: UUID[] = [];

      for (let cycleIdx = 0; cycleIdx < totalCycles; cycleIdx++) {
        const microcycle = microcycles[cycleIdx];
        const microcycleSessions = sessionsByMicrocycle.get(microcycle._id) ?? [];
        const session = microcycleSessions[sessionIndex];
        const exercisesForSession = sessionExercisesBySession.get(session._id) ?? [];
        for (const sessionExercise of exercisesForSession) {
          const exerciseId = sessionExercise.workoutExerciseId;
          if (!exerciseProgressions.has(exerciseId)) {
            exerciseProgressions.set(exerciseId, []);
            exerciseOrder.push(exerciseId);
          }

          const exerciseSets = setsBySessionExercise.get(sessionExercise._id) ?? [];
          const targets: SetTarget[] = exerciseSets.map((set) => ({
            plannedReps: set.plannedReps ?? null,
            plannedWeight: set.plannedWeight ?? null,
            plannedRir: set.plannedRir ?? null,
            actualReps: set.actualReps ?? null,
            actualWeight: set.actualWeight ?? null,
            actualRir: set.rir ?? null,
            hasActual: set.actualReps != null || set.actualWeight != null
          }));

          const isDeload = cycleIdx === lastCycleIndex && totalCycles > 1;

          // Compute RIR range string
          const rirValues = targets
            .map((target) => (target.hasActual ? target.actualRir : target.plannedRir))
            .filter((rir): rir is number => rir != null);
          const rirRange =
            rirValues.length > 0
              ? rirValues.length === 1 || new SvelteSet(rirValues).size === 1
                ? `${rirValues[0]}`
                : `${Math.max(...rirValues)} \u2192 ${Math.min(...rirValues)}`
              : '-';

          const prevRows = exerciseProgressions.get(exerciseId) ?? [];
          const prevRow = prevRows.length > 0 ? prevRows[prevRows.length - 1] : null;

          prevRows.push({
            cycleLabel: isDeload ? 'DL' : `C${cycleIdx + 1}`,
            isDeload,
            rirRange,
            setCount: exerciseSets.length,
            prevSetCount: prevRow?.setCount ?? null,
            targets,
            prevTargets: prevRow?.targets ?? null
          });
        }
      }

      const exercisesForTab: ExerciseProgression[] = exerciseOrder.map((exerciseId) => ({
        exerciseId,
        exerciseName: exerciseMap.get(exerciseId)?.exerciseName ?? 'Unknown',
        rows: exerciseProgressions.get(exerciseId) ?? []
      }));

      return {
        sessionTitle: `S${sessionIndex + 1}`,
        tabValue: `session-${sessionIndex}`,
        exercises: exercisesForTab
      };
    });
  });

  const defaultTab = $derived(sessionTabs.length > 0 ? sessionTabs[0].tabValue : '');

  function formatReps(target: SetTarget): string {
    const reps =
      target.hasActual && target.actualReps != null ? target.actualReps : target.plannedReps;
    return reps != null ? `${reps}` : '?';
  }

  function formatWeight(target: SetTarget): string {
    const weight =
      target.hasActual && target.actualWeight != null ? target.actualWeight : target.plannedWeight;
    return weight != null ? `${weight}` : '?';
  }

  function getPlannedReps(target: SetTarget): string {
    return target.plannedReps != null ? `${target.plannedReps}` : '?';
  }

  function getPlannedWeight(target: SetTarget): string {
    return target.plannedWeight != null ? `${target.plannedWeight}` : '?';
  }

  function actualDiffersFromPlanned(target: SetTarget): boolean {
    if (!target.hasActual) return false;
    return (
      (target.actualReps != null && target.actualReps !== target.plannedReps) ||
      (target.actualWeight != null && target.actualWeight !== target.plannedWeight)
    );
  }

  function getRepsDelta(current: SetTarget, prev: SetTarget | undefined): number | null {
    if (!prev) return null;
    const currentReps = current.hasActual ? current.actualReps : current.plannedReps;
    const previousReps = prev.hasActual ? prev.actualReps : prev.plannedReps;
    if (currentReps == null || previousReps == null) return null;
    return currentReps - previousReps;
  }

  function getWeightDelta(current: SetTarget, prev: SetTarget | undefined): number | null {
    if (!prev) return null;
    const currentWeight = current.hasActual ? current.actualWeight : current.plannedWeight;
    const previousWeight = prev.hasActual ? prev.actualWeight : prev.plannedWeight;
    if (currentWeight == null || previousWeight == null) return null;
    return currentWeight - previousWeight;
  }
</script>

{#if sessionTabs.length === 0}
  <p class="text-sm text-muted-foreground">No progression data available.</p>
{:else}
  <Tabs value={defaultTab}>
    <TabsList>
      {#each sessionTabs as tab (tab.tabValue)}
        <TabsTrigger value={tab.tabValue}>{tab.sessionTitle}</TabsTrigger>
      {/each}
    </TabsList>

    {#each sessionTabs as tab (tab.tabValue)}
      <TabsContent value={tab.tabValue}>
        <div class="flex flex-col gap-4">
          {#each tab.exercises as exercise (exercise.exerciseId)}
            <div class="flex flex-col gap-1">
              <span class="text-sm font-medium">{exercise.exerciseName}</span>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="w-12">Cycle</TableHead>
                    <TableHead class="w-16">RIR</TableHead>
                    <TableHead class="w-12">Sets</TableHead>
                    <TableHead>Targets (reps x lb)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {#each exercise.rows as row, rowIdx (rowIdx)}
                    <TableRow class={row.isDeload ? 'bg-muted' : ''}>
                      <TableCell class="font-medium">{row.cycleLabel}</TableCell>
                      <TableCell>{row.rirRange}</TableCell>
                      <TableCell>
                        {row.setCount}
                        {#if row.prevSetCount != null && row.setCount !== row.prevSetCount}
                          <span
                            class="text-xs {row.setCount > row.prevSetCount
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-amber-600 dark:text-amber-400'}"
                          >
                            {row.setCount > row.prevSetCount ? '\u2191' : '\u2193'}
                          </span>
                        {/if}
                      </TableCell>
                      <TableCell>
                        <div class="flex flex-wrap gap-1">
                          {#each row.targets as target, targetIdx (targetIdx)}
                            {@const weightDelta = getWeightDelta(
                              target,
                              row.prevTargets?.[targetIdx]
                            )}
                            {@const repsDelta = getRepsDelta(target, row.prevTargets?.[targetIdx])}
                            {@const isNew =
                              row.prevTargets != null && targetIdx >= row.prevTargets.length}
                            <span
                              class="text-xs {isNew
                                ? 'text-green-600 dark:text-green-400'
                                : ''} {!target.hasActual && !isNew ? 'text-muted-foreground' : ''}"
                            >
                              <span
                                class={repsDelta != null && repsDelta > 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : repsDelta != null && repsDelta < 0
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : ''}>{formatReps(target)}</span
                              >x<span
                                class={weightDelta != null && weightDelta > 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : weightDelta != null && weightDelta < 0
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : ''}>{formatWeight(target)}</span
                              >
                              {#if actualDiffersFromPlanned(target)}
                                <span
                                  class="text-[0.6rem] text-muted-foreground block leading-tight"
                                >
                                  ({getPlannedReps(target)}x{getPlannedWeight(target)})
                                </span>
                              {/if}
                            </span>
                          {/each}
                        </div>
                      </TableCell>
                    </TableRow>
                  {/each}
                </TableBody>
              </Table>
            </div>
          {/each}
        </div>
      </TabsContent>
    {/each}
  </Tabs>
{/if}
