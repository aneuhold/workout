<!--
  @component

  Mesocycle list page. Shows the current active mesocycle with a compact calendar
  preview and week progression badges, plus a list of past mesocycles. The full
  planner lives at /plan/new.
-->
<script lang="ts">
  import { IconCalendarEvent, IconChevronRight, IconPlus } from '@tabler/icons-svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import Dialog from '$ui/Dialog/Dialog.svelte';
  import DialogContent from '$ui/Dialog/DialogContent.svelte';
  import DialogDescription from '$ui/Dialog/DialogDescription.svelte';
  import DialogHeader from '$ui/Dialog/DialogHeader.svelte';
  import DialogTitle from '$ui/Dialog/DialogTitle.svelte';
  import Progress from '$ui/Progress/Progress.svelte';
  import Separator from '$ui/Separator/Separator.svelte';

  // ── Shared data / logic (duplicated per page; shared module in real app) ──

  const availableExercises = [
    { id: 'ex-1', name: 'Barbell Bench Press', muscles: ['Chest', 'Triceps'], repRange: 'Heavy' },
    {
      id: 'ex-2',
      name: 'Incline DB Press',
      muscles: ['Upper Chest', 'Triceps'],
      repRange: 'Medium'
    },
    { id: 'ex-3', name: 'Cable Fly', muscles: ['Chest'], repRange: 'Medium' },
    { id: 'ex-4', name: 'Barbell Squat', muscles: ['Quads', 'Glutes'], repRange: 'Heavy' },
    {
      id: 'ex-5',
      name: 'Romanian Deadlift',
      muscles: ['Hamstrings', 'Glutes'],
      repRange: 'Medium'
    },
    { id: 'ex-6', name: 'Lateral Raise', muscles: ['Side Delts'], repRange: 'Light' },
    { id: 'ex-7', name: 'Tricep Pushdown', muscles: ['Triceps'], repRange: 'Medium' },
    { id: 'ex-8', name: 'Barbell Row', muscles: ['Lats', 'Upper Back'], repRange: 'Heavy' },
    { id: 'ex-9', name: 'Pull Up', muscles: ['Lats', 'Biceps'], repRange: 'Heavy' },
    { id: 'ex-10', name: 'Barbell Curl', muscles: ['Biceps'], repRange: 'Medium' },
    { id: 'ex-11', name: 'Leg Press', muscles: ['Quads', 'Glutes'], repRange: 'Medium' },
    { id: 'ex-12', name: 'Leg Curl', muscles: ['Hamstrings'], repRange: 'Medium' }
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
      return { rir: 5, setsModifier: -1, label: 'Deload' };
    }
    const rirStart = totalWeeks - 1;
    const rir = Math.max(0, rirStart - (weekNum - 1));
    const setsModifier = weekNum <= 2 ? 0 : weekNum <= 4 ? 1 : 2;
    return { rir, setsModifier, label: `Week ${String(weekNum)}` };
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

  // ── Current mesocycle (fake data) ──

  const cycleTypeLabels: Record<string, string> = {
    MuscleGain: 'Muscle Gain',
    Resensitization: 'Resensitization',
    Cut: 'Cut'
  };

  const currentMeso = {
    title: 'Upper/Lower Hypertrophy',
    cycleType: 'MuscleGain',
    currentWeek: 3,
    totalWeeks: 5,
    microcycleLengthDays: 7,
    restDays: [0, 3],
    sessions: [
      { title: 'Push A', exercises: ['ex-1', 'ex-2', 'ex-3', 'ex-6', 'ex-7'] },
      { title: 'Pull A', exercises: ['ex-8', 'ex-9', 'ex-10'] },
      { title: 'Legs A', exercises: ['ex-4', 'ex-5', 'ex-11', 'ex-12'] },
      { title: 'Push B', exercises: ['ex-1', 'ex-3', 'ex-6', 'ex-7'] }
    ]
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  type PlannedSession = { title: string; exercises: string[] };

  type CalendarDay = {
    day: number;
    dayOfWeek: number;
    sessions: PlannedSession[];
    isRest: boolean;
    weekNum: number;
  };

  // Calendar generation (same logic as planner)
  const generateCalendar = (): CalendarDay[][] => {
    const weeks: CalendarDay[][] = [];
    const totalDays = currentMeso.microcycleLengthDays * currentMeso.totalWeeks;
    let sessionIndex = 0;

    let currentWeek: CalendarDay[] = [];
    for (let day = 0; day < totalDays; day++) {
      const dayOfWeek = day % 7;
      const weekNum = Math.floor(day / currentMeso.microcycleLengthDays) + 1;
      const isRest = currentMeso.restDays.includes(dayOfWeek);

      let daySessions: PlannedSession[] = [];
      if (!isRest && sessionIndex < currentMeso.sessions.length * currentMeso.totalWeeks) {
        daySessions = [currentMeso.sessions[sessionIndex % currentMeso.sessions.length]];
        sessionIndex++;
      }

      if (day === 8 && daySessions.length > 0) {
        daySessions = [...daySessions, currentMeso.sessions[3]];
      }

      currentWeek.push({ day: day + 1, dayOfWeek, sessions: daySessions, isRest, weekNum });

      if (dayOfWeek === 6 || day === totalDays - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    return weeks;
  };

  const calendarWeeks = generateCalendar();

  // Day detail dialog
  let selectedDay = $state<CalendarDay | null>(null);
  let dayDialogOpen = $state(false);

  const selectedDayProjections = $derived.by(() => {
    if (!selectedDay || selectedDay.sessions.length === 0) return [];
    const { rir, setsModifier } = getWeekProgression(selectedDay.weekNum, currentMeso.totalWeeks);
    return selectedDay.sessions.map((session) => ({
      title: session.title,
      rir,
      exercises: session.exercises
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

  // Week progression badges
  const weekProgressions = $derived(
    Array.from({ length: currentMeso.totalWeeks + 1 }, (_, i) =>
      getWeekProgression(i + 1, currentMeso.totalWeeks)
    )
  );

  // ── Past mesocycles (fake data) ──

  const pastMesocycles = [
    {
      id: 'meso-2',
      title: 'Push/Pull/Legs Vol. 2',
      cycleType: 'MuscleGain',
      dateRange: 'Dec 2 – Jan 12',
      totalSessions: 24,
      completedSessions: 22
    },
    {
      id: 'meso-1',
      title: 'Resensitization Block',
      cycleType: 'Resensitization',
      dateRange: 'Nov 11 – Nov 30',
      totalSessions: 12,
      completedSessions: 12
    },
    {
      id: 'meso-0',
      title: 'Upper/Lower Hypertrophy',
      cycleType: 'MuscleGain',
      dateRange: 'Sep 23 – Nov 3',
      totalSessions: 24,
      completedSessions: 24
    }
  ];
</script>

<div class="mx-auto max-w-lg space-y-4 p-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-lg font-semibold">Mesocycles</h1>
    <Button href="/plan/new" size="sm">
      <IconPlus size={14} data-icon="inline-start" />
      New
    </Button>
  </div>

  <!-- Current Mesocycle Card -->
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>{currentMeso.title}</CardTitle>
        <Badge variant="secondary">{cycleTypeLabels[currentMeso.cycleType]}</Badge>
      </div>
      <CardDescription>
        Week {currentMeso.currentWeek} of {currentMeso.totalWeeks}
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Week progress bar -->
      <Progress
        value={(currentMeso.currentWeek / currentMeso.totalWeeks) * 100}
        max={100}
        class="h-1.5"
      />

      <!-- Compact calendar preview -->
      <div>
        <div class="mb-1 grid grid-cols-7 gap-1 text-center">
          {#each dayNames as day (day)}
            <span class="text-muted-foreground text-[0.6rem] font-medium">{day}</span>
          {/each}
        </div>
        <div class="space-y-1">
          {#each calendarWeeks as week, wIdx (wIdx)}
            <div class="grid grid-cols-7 gap-1">
              {#each week as day (day.day)}
                <button
                  type="button"
                  class={`flex min-h-10 w-full flex-col items-center justify-start rounded-lg p-0.5 text-center transition-colors ${
                    day.isRest
                      ? 'bg-muted/30'
                      : day.sessions.length > 0
                        ? 'bg-primary/5 ring-primary/20 cursor-pointer ring-1 hover:bg-primary/10 active:bg-primary/15'
                        : 'bg-muted/50'
                  }`}
                  onclick={() => {
                    if (day.sessions.length > 0) {
                      selectedDay = day;
                      dayDialogOpen = true;
                    }
                  }}
                >
                  <span class="text-muted-foreground text-[0.5rem]">{day.day}</span>
                  {#if day.isRest}
                    <span class="text-muted-foreground mt-0.5 text-[0.45rem]">Rest</span>
                  {:else if day.sessions.length > 0}
                    <span
                      class="text-primary mt-0.5 truncate text-[0.45rem] font-medium leading-tight"
                    >
                      {day.sessions[0].title}
                    </span>
                    {#if day.sessions.length > 1}
                      <div class="mt-0.5 flex gap-0.5">
                        {#each day.sessions as _, dotIdx (dotIdx)}
                          <div class="bg-primary size-1 rounded-full"></div>
                        {/each}
                      </div>
                    {/if}
                  {/if}
                </button>
              {/each}
              {#each Array(7 - week.length) as _, padIdx (padIdx)}
                <div></div>
              {/each}
            </div>
          {/each}
        </div>
      </div>

      <!-- Week progression badges -->
      <div class="flex flex-wrap gap-1.5">
        {#each weekProgressions as prog, i (i)}
          {@const weekNum = i + 1}
          {@const isDeload = weekNum > currentMeso.totalWeeks}
          {@const isCurrent = weekNum === currentMeso.currentWeek}
          <div
            class={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
              isCurrent ? 'border-primary bg-primary/5 font-medium' : 'border-border'
            }`}
          >
            <span class={isCurrent ? 'text-primary' : 'text-muted-foreground'}>
              {isDeload ? 'DL' : `W${String(weekNum)}`}
            </span>
            <Badge variant="secondary" class="h-4 px-1 text-[0.6rem]">
              RIR {prog.rir}
            </Badge>
            <Badge variant="outline" class="h-4 px-1 text-[0.6rem]">
              {prog.setsModifier > 0
                ? `+${String(prog.setsModifier)}`
                : prog.setsModifier === 0
                  ? 'Base'
                  : String(prog.setsModifier)}
            </Badge>
          </div>
        {/each}
      </div>
    </CardContent>
  </Card>

  <!-- Past Mesocycles -->
  {#if pastMesocycles.length > 0}
    <div>
      <h2 class="mb-2 text-sm font-medium">Past Mesocycles</h2>
      <div class="space-y-2">
        {#each pastMesocycles as meso (meso.id)}
          <a href="/plan/{meso.id}" class="block">
            <Card size="sm">
              <CardContent class="flex items-center gap-3">
                <div
                  class="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg"
                >
                  <IconCalendarEvent size={18} class="text-primary" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="truncate text-sm font-medium">{meso.title}</p>
                    <Badge variant="outline" class="shrink-0 text-[0.6rem]">
                      {cycleTypeLabels[meso.cycleType] ?? meso.cycleType}
                    </Badge>
                  </div>
                  <div class="text-muted-foreground mt-0.5 flex items-center gap-3 text-xs">
                    <span>{meso.dateRange}</span>
                    <span>{meso.completedSessions}/{meso.totalSessions} sessions</span>
                  </div>
                </div>
                <IconChevronRight size={16} class="text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </a>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Day Detail Dialog -->
<Dialog bind:open={dayDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        Day {selectedDay?.day} — Week {selectedDay?.weekNum}
      </DialogTitle>
      <DialogDescription>Projected targets</DialogDescription>
    </DialogHeader>
    <div class="space-y-4">
      {#each selectedDayProjections as sessionProj, sIdx (sIdx)}
        {#if sIdx > 0}
          <Separator />
        {/if}
        <div class="flex items-center gap-2">
          <h4 class="text-sm font-medium">{sessionProj.title}</h4>
          <Badge variant="secondary">RIR {sessionProj.rir}</Badge>
        </div>
        <div class="space-y-3">
          {#each sessionProj.exercises as ex (ex.name)}
            <div>
              <p class="mb-1 text-xs font-medium">{ex.name}</p>
              <div
                class="text-muted-foreground grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-0.5 pl-2 text-xs"
              >
                {#each ex.setTargets as st (st.setNum)}
                  <span>S{st.setNum}</span>
                  <span>{st.reps} reps</span>
                  <span class="text-right">{st.weight} lb</span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </DialogContent>
</Dialog>
