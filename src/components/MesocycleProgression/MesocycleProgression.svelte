<!--
  @component

  Visualizes exercise progression across a mesocycle. Shows per-session tabs
  with exercise tables displaying cycle-by-cycle per-set progression for
  reps, weight, and RIR. Each set gets its own row for clarity.
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
  import { SvelteMap } from 'svelte/reactivity';
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

  type SetRow = {
    cycleLabel: string;
    isDeload: boolean;
    isFirstSetInCycle: boolean;
    isNewSet: boolean;
    isPlannedOnly: boolean;
    setNumber: number;
    displayReps: number | null;
    displayWeight: number | null;
    displayRir: number | null;
    plannedReps: number | null;
    plannedWeight: number | null;
    plannedRir: number | null;
    repsDifferFromPlan: boolean;
    weightDiffersFromPlan: boolean;
    rirDiffersFromPlan: boolean;
    repsDelta: number | null;
    weightDelta: number | null;
    rirDelta: number | null;
  };

  type ExerciseProgression = {
    exerciseId: UUID;
    exerciseName: string;
    rows: SetRow[];
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
      const exerciseRows = new SvelteMap<UUID, SetRow[]>();
      const exerciseOrder: UUID[] = [];
      const prevTargetsMap = new SvelteMap<UUID, SetTarget[]>();

      for (let cycleIdx = 0; cycleIdx < totalCycles; cycleIdx++) {
        const microcycle = microcycles[cycleIdx];
        const microcycleSessions = sessionsByMicrocycle.get(microcycle._id) ?? [];
        const session = microcycleSessions[sessionIndex];
        const exercisesForSession = sessionExercisesBySession.get(session._id) ?? [];

        for (const sessionExercise of exercisesForSession) {
          const exerciseId = sessionExercise.workoutExerciseId;
          if (!exerciseRows.has(exerciseId)) {
            exerciseRows.set(exerciseId, []);
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
          const cycleLabel = isDeload ? 'DL' : `C${cycleIdx + 1}`;
          const prevTargets = prevTargetsMap.get(exerciseId) ?? null;
          const rows = exerciseRows.get(exerciseId) ?? [];

          for (let setIdx = 0; setIdx < targets.length; setIdx++) {
            const target = targets[setIdx];
            const prevTarget = prevTargets?.[setIdx];
            const isNewSet = prevTargets != null && setIdx >= prevTargets.length;
            const isPlannedOnly = !target.hasActual;

            const displayReps =
              target.hasActual && target.actualReps != null
                ? target.actualReps
                : target.plannedReps;
            const displayWeight =
              target.hasActual && target.actualWeight != null
                ? target.actualWeight
                : target.plannedWeight;
            const displayRir =
              target.hasActual && target.actualRir != null ? target.actualRir : target.plannedRir;

            let repsDelta: number | null = null;
            let weightDelta: number | null = null;
            let rirDelta: number | null = null;

            if (prevTarget) {
              const prevReps = prevTarget.hasActual
                ? prevTarget.actualReps
                : prevTarget.plannedReps;
              const prevWeight = prevTarget.hasActual
                ? prevTarget.actualWeight
                : prevTarget.plannedWeight;
              const prevRir = prevTarget.hasActual ? prevTarget.actualRir : prevTarget.plannedRir;

              if (displayReps != null && prevReps != null) repsDelta = displayReps - prevReps;
              if (displayWeight != null && prevWeight != null)
                weightDelta = displayWeight - prevWeight;
              if (displayRir != null && prevRir != null) rirDelta = displayRir - prevRir;
            }

            rows.push({
              cycleLabel,
              isDeload,
              isFirstSetInCycle: setIdx === 0,
              isNewSet,
              isPlannedOnly,
              setNumber: setIdx + 1,
              displayReps,
              displayWeight,
              displayRir,
              plannedReps: target.plannedReps,
              plannedWeight: target.plannedWeight,
              plannedRir: target.plannedRir,
              repsDifferFromPlan:
                target.hasActual &&
                target.actualReps != null &&
                target.actualReps !== target.plannedReps,
              weightDiffersFromPlan:
                target.hasActual &&
                target.actualWeight != null &&
                target.actualWeight !== target.plannedWeight,
              rirDiffersFromPlan:
                target.hasActual &&
                target.actualRir != null &&
                target.actualRir !== target.plannedRir,
              repsDelta,
              weightDelta,
              rirDelta
            });
          }

          prevTargetsMap.set(exerciseId, targets);
        }
      }

      const exercisesForTab: ExerciseProgression[] = exerciseOrder.map((exerciseId) => ({
        exerciseId,
        exerciseName: exerciseMap.get(exerciseId)?.exerciseName ?? 'Unknown',
        rows: exerciseRows.get(exerciseId) ?? []
      }));

      return {
        sessionTitle: `S${sessionIndex + 1}`,
        tabValue: `session-${sessionIndex}`,
        exercises: exercisesForTab
      };
    });
  });

  const defaultTab = $derived(sessionTabs.length > 0 ? sessionTabs[0].tabValue : '');

  function deltaClass(delta: number | null): string {
    if (delta == null || delta === 0) return '';
    return delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400';
  }

  function rirDeltaClass(delta: number | null): string {
    if (delta == null || delta === 0) return '';
    // Lower RIR = closer to failure = improvement = green
    return delta < 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400';
  }

  function deltaArrow(delta: number | null): string {
    if (delta == null || delta === 0) return '';
    return delta > 0 ? '\u2191' : '\u2193';
  }

  function fmt(value: number | null): string {
    return value != null ? `${value}` : '-';
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
                    <TableHead class="w-10">Set</TableHead>
                    <TableHead class="w-16">Reps</TableHead>
                    <TableHead class="w-20">Wt (lb)</TableHead>
                    <TableHead class="w-12">RIR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {#each exercise.rows as row, rowIdx (rowIdx)}
                    {@const rowClasses = [
                      row.isFirstSetInCycle && rowIdx > 0
                        ? 'border-t-2 border-muted-foreground/20'
                        : '',
                      row.isDeload ? 'bg-muted' : '',
                      row.isNewSet
                        ? 'text-green-600 dark:text-green-400'
                        : row.isPlannedOnly
                          ? 'text-muted-foreground'
                          : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    <TableRow class={rowClasses}>
                      <TableCell class="font-medium">
                        {row.isFirstSetInCycle ? row.cycleLabel : ''}
                      </TableCell>
                      <TableCell>{row.setNumber}</TableCell>
                      <TableCell>
                        <span class={deltaClass(row.repsDelta)}>
                          {fmt(row.displayReps)}{deltaArrow(row.repsDelta)}
                        </span>
                        {#if row.repsDifferFromPlan}
                          <span class="text-[0.6rem] text-muted-foreground block leading-tight">
                            plan: {fmt(row.plannedReps)}
                          </span>
                        {/if}
                      </TableCell>
                      <TableCell>
                        <span class={deltaClass(row.weightDelta)}>
                          {fmt(row.displayWeight)}{deltaArrow(row.weightDelta)}
                        </span>
                        {#if row.weightDiffersFromPlan}
                          <span class="text-[0.6rem] text-muted-foreground block leading-tight">
                            plan: {fmt(row.plannedWeight)}
                          </span>
                        {/if}
                      </TableCell>
                      <TableCell>
                        <span class={rirDeltaClass(row.rirDelta)}>
                          {fmt(row.displayRir)}{deltaArrow(row.rirDelta)}
                        </span>
                        {#if row.rirDiffersFromPlan}
                          <span class="text-[0.6rem] text-muted-foreground block leading-tight">
                            plan: {fmt(row.plannedRir)}
                          </span>
                        {/if}
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
