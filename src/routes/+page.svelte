<!--
  @component

  Home dashboard page. Shows CTAs for logging sessions, pending logs, and
  recent session history.
-->
<script lang="ts">
  import {
    IconAlertCircle,
    IconBarbell,
    IconCalendarEvent,
    IconChevronDown,
    IconChevronRight,
    IconChevronUp,
    IconPlayerPlay,
    IconTrendingUp
  } from '@tabler/icons-svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import Progress from '$ui/Progress/Progress.svelte';
  import Separator from '$ui/Separator/Separator.svelte';

  // Fake data
  const currentMesocycle = {
    title: 'Upper/Lower Hypertrophy',
    cycleType: 'MuscleGain',
    week: 3,
    totalWeeks: 5
  };

  const nextSession = {
    id: 'demo',
    title: 'Push Day A',
    description: '5 exercises, ~45 min estimated',
    exercises: [
      'Barbell Bench Press',
      'Incline DB Press',
      'Cable Fly',
      'Lateral Raise',
      'Tricep Pushdown'
    ]
  };

  const pendingLogs = [
    {
      id: 'sess-2',
      title: 'Pull Day A',
      date: 'Feb 7',
      missing: ['RSM scores', 'Soreness']
    }
  ];

  const recentSessions = [
    {
      id: 'sess-3',
      title: 'Legs A',
      date: 'Feb 6',
      setsCompleted: 18,
      totalSets: 18,
      rsmTotal: 7
    },
    {
      id: 'sess-2',
      title: 'Pull Day A',
      date: 'Feb 5',
      setsCompleted: 16,
      totalSets: 16,
      rsmTotal: 6
    },
    {
      id: 'sess-1',
      title: 'Push Day B',
      date: 'Feb 3',
      setsCompleted: 14,
      totalSets: 14,
      rsmTotal: 5
    }
  ];

  // Available exercises (same data as plan page - shared module in real app)
  const availableExercises = [
    { id: 'ex-1', name: 'Barbell Bench Press', repRange: 'Heavy' },
    { id: 'ex-2', name: 'Incline DB Press', repRange: 'Medium' },
    { id: 'ex-3', name: 'Cable Fly', repRange: 'Medium' },
    { id: 'ex-4', name: 'Barbell Squat', repRange: 'Heavy' },
    { id: 'ex-5', name: 'Romanian Deadlift', repRange: 'Medium' },
    { id: 'ex-6', name: 'Lateral Raise', repRange: 'Light' },
    { id: 'ex-7', name: 'Tricep Pushdown', repRange: 'Medium' },
    { id: 'ex-8', name: 'Barbell Row', repRange: 'Heavy' },
    { id: 'ex-9', name: 'Pull Up', repRange: 'Heavy' },
    { id: 'ex-10', name: 'Barbell Curl', repRange: 'Medium' },
    { id: 'ex-11', name: 'Leg Press', repRange: 'Medium' },
    { id: 'ex-12', name: 'Leg Curl', repRange: 'Medium' }
  ];

  const exerciseCalibrations: Record<string, { oneRepMax: number; baseSets: number }> = {
    'ex-1': { oneRepMax: 225, baseSets: 3 },
    'ex-2': { oneRepMax: 160, baseSets: 3 },
    'ex-3': { oneRepMax: 50, baseSets: 3 },
    'ex-4': { oneRepMax: 315, baseSets: 3 },
    'ex-5': { oneRepMax: 275, baseSets: 3 },
    'ex-6': { oneRepMax: 30, baseSets: 3 },
    'ex-7': { oneRepMax: 80, baseSets: 3 },
    'ex-8': { oneRepMax: 205, baseSets: 3 },
    'ex-9': { oneRepMax: 100, baseSets: 3 },
    'ex-10': { oneRepMax: 105, baseSets: 3 },
    'ex-11': { oneRepMax: 400, baseSets: 3 },
    'ex-12': { oneRepMax: 140, baseSets: 3 }
  };

  const baseReps: Record<string, number> = {
    Heavy: 6,
    Medium: 10,
    Light: 15
  };

  function getWeekProgression(weekNum: number, totalWeeks: number) {
    if (weekNum > totalWeeks) {
      return { rir: 5, setsModifier: -1 };
    }
    const rirStart = totalWeeks - 1;
    const rir = Math.max(0, rirStart - (weekNum - 1));
    const setsModifier = weekNum <= 2 ? 0 : weekNum <= 4 ? 1 : 2;
    return { rir, setsModifier };
  }

  function calculateWeight(oneRepMax: number, reps: number, rir: number): number {
    const effectiveReps = reps + rir;
    const weight = oneRepMax / (1 + effectiveReps / 30);
    return Math.round(weight / 5) * 5;
  }

  type SetTarget = { setNum: number; reps: number; weight: number };

  function generateSetTargets(
    oneRepMax: number,
    baseRepsVal: number,
    numSets: number,
    rir: number
  ): SetTarget[] {
    const targets: SetTarget[] = [];
    for (let i = 1; i <= numSets; i++) {
      if (i === 1) {
        targets.push({
          setNum: i,
          reps: baseRepsVal,
          weight: calculateWeight(oneRepMax, baseRepsVal, rir)
        });
      } else {
        const backoffReps = baseRepsVal + 2;
        targets.push({
          setNum: i,
          reps: backoffReps,
          weight: calculateWeight(oneRepMax, backoffReps, rir)
        });
      }
    }
    return targets;
  }

  // Mesocycle session definitions
  const mesoSessions = [
    { title: 'Push Day A', exercises: ['ex-1', 'ex-2', 'ex-3', 'ex-6', 'ex-7'] },
    { title: 'Pull Day A', exercises: ['ex-8', 'ex-9', 'ex-10'] },
    { title: 'Legs A', exercises: ['ex-4', 'ex-5', 'ex-11', 'ex-12'] },
    { title: 'Push Day B', exercises: ['ex-1', 'ex-3', 'ex-6', 'ex-7'] }
  ];

  // Upcoming sessions for this week with computed targets
  const upcomingSessions = $derived.by(() => {
    const { rir, setsModifier } = getWeekProgression(
      currentMesocycle.week,
      currentMesocycle.totalWeeks
    );
    return mesoSessions.map((session, idx) => ({
      title: session.title,
      isNext: idx === 0,
      exerciseCount: session.exercises.length,
      totalSets: session.exercises.reduce((sum, exId) => {
        const cal = exerciseCalibrations[exId];
        return sum + (cal ? Math.max(1, cal.baseSets + setsModifier) : 3);
      }, 0),
      rir,
      details: session.exercises
        .map((exId) => {
          const exercise = availableExercises.find((e) => e.id === exId);
          const cal = exerciseCalibrations[exId];
          if (!exercise || !cal) return null;
          const reps = baseReps[exercise.repRange] ?? 10;
          const sets = Math.max(1, cal.baseSets + setsModifier);
          const setTargets = generateSetTargets(cal.oneRepMax, reps, sets, rir);
          return { name: exercise.name, setTargets };
        })
        .filter((e): e is NonNullable<typeof e> => e !== null)
    }));
  });

  let expandedUpcoming = $state<number | null>(null);
</script>

<div class="mx-auto max-w-lg space-y-4 p-4">
  <!-- Mesocycle overview -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-lg font-semibold">{currentMesocycle.title}</h1>
      <p class="text-muted-foreground text-sm">
        Week {currentMesocycle.week} of {currentMesocycle.totalWeeks}
      </p>
    </div>
    <Badge variant="secondary">{currentMesocycle.cycleType}</Badge>
  </div>
  <Progress
    value={(currentMesocycle.week / currentMesocycle.totalWeeks) * 100}
    max={100}
    class="h-1.5"
  />

  <!-- Next session CTA -->
  <Card>
    <CardHeader>
      <CardTitle>Next Up</CardTitle>
      <CardDescription>{nextSession.title}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3">
      <p class="text-muted-foreground text-sm">{nextSession.description}</p>
      <div class="flex flex-wrap gap-1.5">
        {#each nextSession.exercises as exercise (exercise)}
          <Badge variant="outline">{exercise}</Badge>
        {/each}
      </div>
      <Button href="/session/{nextSession.id}" class="w-full" size="lg">
        <IconPlayerPlay size={18} data-icon="inline-start" />
        Start Session
      </Button>
    </CardContent>
  </Card>

  <!-- This Week's Sessions -->
  <Card>
    <CardHeader>
      <CardTitle>This Week's Sessions</CardTitle>
      <CardDescription>Week {currentMesocycle.week} targets</CardDescription>
    </CardHeader>
    <CardContent class="space-y-2">
      {#each upcomingSessions as session, idx (idx)}
        <div class="border-border rounded-lg border">
          <button
            class="flex w-full items-center justify-between p-3 text-left"
            onclick={() => {
              expandedUpcoming = expandedUpcoming === idx ? null : idx;
            }}
          >
            <div class="flex min-w-0 items-center gap-2">
              <span class="truncate text-sm font-medium">{session.title}</span>
              {#if session.isNext}
                <Badge variant="default" class="shrink-0">Next</Badge>
              {/if}
            </div>
            <div class="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
              <span>{session.exerciseCount} ex</span>
              <span>{session.totalSets} sets</span>
              <span>RIR {session.rir}</span>
              {#if expandedUpcoming === idx}
                <IconChevronUp size={14} />
              {:else}
                <IconChevronDown size={14} />
              {/if}
            </div>
          </button>
          {#if expandedUpcoming === idx}
            <div class="space-y-2 border-t px-3 pb-3 pt-2">
              {#each session.details as ex (ex.name)}
                <div class="text-xs">
                  <p class="font-medium">{ex.name}</p>
                  <p class="text-muted-foreground">
                    {ex.setTargets
                      .map((st) => `${String(st.weight)}\u00d7${String(st.reps)}`)
                      .join(' \u00b7 ')}
                  </p>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </CardContent>
  </Card>

  <!-- Pending logs -->
  {#if pendingLogs.length > 0}
    <Card>
      <CardHeader>
        <CardTitle class="text-destructive flex items-center gap-2">
          <IconAlertCircle size={16} />
          Pending Logs
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-2">
        {#each pendingLogs as log (log.id)}
          <a
            href="/session/{log.id}"
            class="hover:bg-muted flex items-center justify-between rounded-lg p-2 transition-colors"
          >
            <div>
              <p class="text-sm font-medium">{log.title}</p>
              <p class="text-muted-foreground text-xs">
                {log.date} - Missing: {log.missing.join(', ')}
              </p>
            </div>
            <IconChevronRight size={16} class="text-muted-foreground" />
          </a>
        {/each}
      </CardContent>
    </Card>
  {/if}

  <!-- Recent sessions -->
  <div>
    <h2 class="mb-2 text-sm font-medium">Recent Sessions</h2>
    <div class="space-y-2">
      {#each recentSessions as session (session.id)}
        <a href="/session/{session.id}" class="block">
          <Card size="sm">
            <CardContent class="flex items-center gap-3">
              <div
                class="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg"
              >
                <IconBarbell size={18} class="text-primary" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between">
                  <p class="truncate text-sm font-medium">{session.title}</p>
                  <span class="text-muted-foreground shrink-0 text-xs">{session.date}</span>
                </div>
                <div class="text-muted-foreground mt-0.5 flex items-center gap-3 text-xs">
                  <span>{session.setsCompleted}/{session.totalSets} sets</span>
                  <span>RSM: {session.rsmTotal}/9</span>
                </div>
              </div>
              <IconChevronRight size={16} class="text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </a>
      {/each}
    </div>
  </div>

  <!-- Quick links -->
  <Separator />
  <div class="grid grid-cols-2 gap-2">
    <Button variant="outline" href="/plan" class="h-auto flex-col gap-1 py-3">
      <IconCalendarEvent size={20} />
      <span class="text-xs">Plan Mesocycle</span>
    </Button>
    <Button variant="outline" href="/analytics" class="h-auto flex-col gap-1 py-3">
      <IconTrendingUp size={20} />
      <span class="text-xs">View Analytics</span>
    </Button>
  </div>
</div>
