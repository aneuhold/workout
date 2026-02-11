<!--
  @component

  Mesocycle planning page. Interactive calendar-based planner where the user
  can configure cycle type, duration, sessions per week, rest days, and assign
  exercises. Shows a visual preview of how the plan will look.
-->
<script lang="ts">
  import {
    IconCheck,
    IconChevronDown,
    IconChevronUp,
    IconGripVertical,
    IconInfoCircle,
    IconPlus,
    IconX
  } from '@tabler/icons-svelte';
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
  import Input from '$ui/Input/Input.svelte';
  import Label from '$ui/Label/Label.svelte';
  import Popover from '$ui/Popover/Popover.svelte';
  import PopoverContent from '$ui/Popover/PopoverContent.svelte';
  import PopoverTrigger from '$ui/Popover/PopoverTrigger.svelte';
  import Select from '$ui/Select/Select.svelte';
  import SelectContent from '$ui/Select/SelectContent.svelte';
  import SelectItem from '$ui/Select/SelectItem.svelte';
  import SelectTrigger from '$ui/Select/SelectTrigger.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import Tabs from '$ui/Tabs/Tabs.svelte';
  import TabsContent from '$ui/Tabs/TabsContent.svelte';
  import TabsList from '$ui/Tabs/TabsList.svelte';
  import TabsTrigger from '$ui/Tabs/TabsTrigger.svelte';

  // Configuration state
  let cycleType = $state('MuscleGain');
  let mesoTitle = $state('Upper/Lower Hypertrophy');
  let microcycleLengthDays = $state(8);
  let sessionsPerMicrocycle = $state(4);
  let microcycleCount = $state(5);
  let restDays = $state([0, 3]); // Sunday = 0, Wednesday = 3

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  // Preview start date (defaults to today)
  const startDate = new Date();

  // Available exercises (fake data)
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

  // Exercise calibration data (would come from user's training history)
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
    return { rir, setsModifier, label: `Cycle ${String(weekNum)}` };
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

  // Session definitions (the plan)
  type PlannedSession = {
    title: string;
    exercises: string[];
  };

  type CalendarDay = {
    day: number;
    dayOfWeek: number;
    sessions: PlannedSession[];
    isRest: boolean;
    weekNum: number;
    isDeload: boolean;
    isCycleStart: boolean;
    isMonthStart: boolean;
    date: Date;
  };

  let sessions = $state<PlannedSession[]>([
    { title: 'Push A', exercises: ['ex-1', 'ex-2', 'ex-3', 'ex-6', 'ex-7'] },
    { title: 'Pull A', exercises: ['ex-8', 'ex-9', 'ex-10'] },
    { title: 'Legs A', exercises: ['ex-4', 'ex-5', 'ex-11', 'ex-12'] },
    { title: 'Push B', exercises: ['ex-1', 'ex-3', 'ex-6', 'ex-7'] }
  ]);

  let expandedSession = $state<number | null>(0);

  // Calendar generation (includes deload week)
  const generateCalendar = (): CalendarDay[][] => {
    const weeks: CalendarDay[][] = [];
    const totalDays = microcycleLengthDays * (microcycleCount + 1);
    let sessionIndex = 0;

    let currentWeek: CalendarDay[] = [];
    for (let day = 0; day < totalDays; day++) {
      const dayOfWeek = day % 7;
      const weekNum = Math.floor(day / microcycleLengthDays) + 1;
      const isDeload = weekNum > microcycleCount;
      const isRest = restDays.includes(dayOfWeek);
      // eslint-disable-next-line svelte/prefer-svelte-reactivity -- static data, not reactive state
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + day);

      let daySessions: PlannedSession[] = [];
      if (!isRest && sessionIndex < sessions.length * (microcycleCount + 1)) {
        daySessions = [sessions[sessionIndex % sessions.length]];
        sessionIndex++;
      }

      // Fake double-session on day 9 to demonstrate multi-session feature
      if (day === 8 && daySessions.length > 0) {
        daySessions = [...daySessions, sessions[3]];
      }

      currentWeek.push({
        day: day + 1,
        dayOfWeek,
        sessions: daySessions,
        isRest,
        weekNum,
        isDeload,
        isCycleStart: day % microcycleLengthDays === 0,
        isMonthStart: day === 0 || date.getDate() === 1,
        date
      });

      if (dayOfWeek === 6 || day === totalDays - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    return weeks;
  };

  const calendarWeeks = $derived(generateCalendar());

  // Day detail dialog state
  let selectedDay = $state<CalendarDay | null>(null);
  let dayDialogOpen = $state(false);
  let activeWeekTab = $state('w1');

  const selectedDayProjections = $derived.by(() => {
    if (!selectedDay || selectedDay.sessions.length === 0) return [];
    const { rir, setsModifier } = getWeekProgression(selectedDay.weekNum, microcycleCount);
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

  const removeExerciseFromSession = (sessionIdx: number, exerciseId: string) => {
    sessions[sessionIdx].exercises = sessions[sessionIdx].exercises.filter((e) => e !== exerciseId);
  };

  const addSession = () => {
    sessions = [...sessions, { title: `Session ${String(sessions.length + 1)}`, exercises: [] }];
    expandedSession = sessions.length - 1;
  };

  const removeSession = (idx: number) => {
    sessions = sessions.filter((_, i) => i !== idx);
    if (expandedSession === idx) expandedSession = null;
  };

  const toggleRestDay = (day: number) => {
    if (restDays.includes(day)) {
      restDays = restDays.filter((d) => d !== day);
    } else {
      restDays = [...restDays, day];
    }
  };

  // Cycle type labels
  const cycleTypeOptions = [
    { value: 'MuscleGain', label: 'Muscle Gain' },
    { value: 'Resensitization', label: 'Resensitization' },
    { value: 'Cut', label: 'Cut' }
  ];

  const cycleTypeLabel = $derived(
    cycleTypeOptions.find((o) => o.value === cycleType)?.label ?? cycleType
  );

  const repRangeColor: Record<string, string> = {
    Heavy: 'bg-red-500/10 text-red-500',
    Medium: 'bg-yellow-500/10 text-yellow-500',
    Light: 'bg-green-500/10 text-green-500'
  };

  // Add exercise to session
  let addingToSession = $state<number | null>(null);
  let addExerciseValue = $state('');
</script>

<div class="mx-auto max-w-lg space-y-4 p-4">
  <h1 class="text-lg font-semibold">Mesocycle Planner</h1>

  <!-- Cycle Configuration -->
  <Card>
    <CardHeader>
      <CardTitle>Configuration</CardTitle>
      <CardDescription>Set up your mesocycle parameters</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Title -->
      <div class="space-y-1">
        <Label>Mesocycle Title</Label>
        <Input bind:value={mesoTitle} placeholder="e.g., Upper/Lower Hypertrophy" />
      </div>

      <!-- Cycle Type -->
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <Label>Cycle Type</Label>
          <Popover>
            <PopoverTrigger>
              <IconInfoCircle size={14} class="text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent class="text-xs">
              <p>
                <strong>Muscle Gain:</strong> Full auto-recommendations for progressive overload.
              </p>
              <p class="mt-1">
                <strong>Resensitization:</strong> Low-volume maintenance phase between gain cycles.
              </p>
              <p class="mt-1">
                <strong>Cut:</strong> Reduced volume progression for fat loss phases.
              </p>
            </PopoverContent>
          </Popover>
        </div>
        <Select bind:value={cycleType} type="single">
          <SelectTrigger>{cycleTypeLabel}</SelectTrigger>
          <SelectContent>
            {#each cycleTypeOptions as option (option.value)}
              <SelectItem value={option.value}>{option.label}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>

      <!-- Numeric configs -->
      <div class="grid grid-cols-3 gap-3">
        <div class="space-y-1">
          <Label class="text-xs">Weeks</Label>
          <Input type="number" bind:value={microcycleCount} min={2} max={8} />
        </div>
        <div class="space-y-1">
          <Label class="text-xs">Sessions/Week</Label>
          <Input type="number" bind:value={sessionsPerMicrocycle} min={2} max={6} />
        </div>
        <div class="space-y-1">
          <Label class="text-xs">Days/Cycle</Label>
          <Input type="number" bind:value={microcycleLengthDays} min={5} max={10} />
        </div>
      </div>

      <!-- Rest days -->
      <div class="space-y-2">
        <Label>Rest Days</Label>
        <div class="flex gap-1.5">
          {#each dayNames as day, idx (day)}
            <button
              class={`flex size-9 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                restDays.includes(idx)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              onclick={() => toggleRestDay(idx)}
            >
              {day}
            </button>
          {/each}
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Session Definitions -->
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>{sessions.length} sessions per microcycle</CardDescription>
        </div>
        <Button size="sm" onclick={addSession}>
          <IconPlus size={14} data-icon="inline-start" />
          Add
        </Button>
      </div>
    </CardHeader>
    <CardContent class="space-y-2">
      {#each sessions as session, sIdx (sIdx)}
        {@const isExpanded = expandedSession === sIdx}
        <div class="border-border rounded-lg border">
          <!-- Session header -->
          <button
            class="flex w-full items-center gap-2 p-3 text-left"
            onclick={() => {
              expandedSession = isExpanded ? null : sIdx;
            }}
          >
            <IconGripVertical size={14} class="text-muted-foreground shrink-0" />
            <span class="flex-1 text-sm font-medium">{session.title}</span>
            <Badge variant="outline">{session.exercises.length} exercises</Badge>
            {#if isExpanded}
              <IconChevronUp size={14} class="text-muted-foreground" />
            {:else}
              <IconChevronDown size={14} class="text-muted-foreground" />
            {/if}
          </button>

          {#if isExpanded}
            <div class="space-y-3 border-t px-3 pb-3 pt-2">
              <!-- Session title edit -->
              <Input bind:value={session.title} placeholder="Session title" class="h-8 text-sm" />

              <!-- Exercise list -->
              {#each session.exercises as exerciseId, eIdx (`${exerciseId}-${String(eIdx)}`)}
                {@const exercise = availableExercises.find((e) => e.id === exerciseId)}
                {#if exercise}
                  <div class="flex items-center gap-2">
                    <span class="text-muted-foreground text-xs">{eIdx + 1}.</span>
                    <div class="flex min-w-0 flex-1 items-center gap-1.5">
                      <span class="truncate text-sm">{exercise.name}</span>
                      <Badge
                        variant="outline"
                        class={`shrink-0 ${repRangeColor[exercise.repRange]}`}
                      >
                        {exercise.repRange}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onclick={() => removeExerciseFromSession(sIdx, exerciseId)}
                    >
                      <IconX size={12} />
                    </Button>
                  </div>
                {/if}
              {/each}

              <!-- Add exercise -->
              {#if addingToSession === sIdx}
                <div class="space-y-2">
                  <Select
                    bind:value={addExerciseValue}
                    type="single"
                    onValueChange={(v) => {
                      if (v && !session.exercises.includes(v)) {
                        session.exercises = [...session.exercises, v];
                      }
                      addExerciseValue = '';
                      addingToSession = null;
                    }}
                  >
                    <SelectTrigger size="sm">Choose exercise...</SelectTrigger>
                    <SelectContent>
                      {#each availableExercises.filter((e) => !session.exercises.includes(e.id)) as exercise (exercise.id)}
                        <SelectItem value={exercise.id}>
                          {exercise.name}
                        </SelectItem>
                      {/each}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="xs"
                    onclick={() => {
                      addingToSession = null;
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              {:else}
                <Button
                  variant="outline"
                  size="sm"
                  class="w-full"
                  onclick={() => {
                    addingToSession = sIdx;
                  }}
                >
                  <IconPlus size={14} data-icon="inline-start" />
                  Add Exercise
                </Button>
              {/if}

              <!-- Delete session -->
              {#if sessions.length > 1}
                <div class="flex justify-end pt-1">
                  <Button variant="destructive" size="xs" onclick={() => removeSession(sIdx)}>
                    <IconX size={12} data-icon="inline-start" />
                    Remove Session
                  </Button>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </CardContent>
  </Card>

  <!-- Calendar Preview -->
  <Card>
    <CardHeader>
      <CardTitle>Schedule Preview</CardTitle>
      <CardDescription>
        {microcycleCount} weeks, {sessions.length} sessions each + deload
      </CardDescription>
    </CardHeader>
    <CardContent>
      <!-- Day headers -->
      <div class="mb-2 grid grid-cols-7 gap-1 text-center">
        {#each dayNames as day (day)}
          <span class="text-muted-foreground text-xs font-medium">{day}</span>
        {/each}
      </div>

      <!-- Calendar grid -->
      <div class="space-y-1">
        {#each calendarWeeks as week, wIdx (wIdx)}
          {@const hasLabels = week.some((d) => d.isCycleStart || d.isMonthStart)}
          {#if hasLabels}
            <div class="mt-1.5 grid grid-cols-7 gap-1 first:mt-0">
              {#each week as day (day.day)}
                <div>
                  {#if day.isCycleStart || day.isMonthStart}
                    <div class="flex items-baseline gap-1 whitespace-nowrap">
                      {#if day.isCycleStart}
                        <span class="text-muted-foreground text-[0.65rem] font-medium">
                          {day.isDeload ? 'Deload' : `Cycle ${String(day.weekNum)}`}
                        </span>
                      {/if}
                      {#if day.isMonthStart}
                        <span class="text-muted-foreground/60 text-[0.6rem]">
                          {monthNames[day.date.getMonth()]}
                          {String(day.date.getFullYear())}
                        </span>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
              {#each Array(7 - week.length) as _, padIdx (padIdx)}
                <div></div>
              {/each}
            </div>
          {/if}
          <div class="grid grid-cols-7 gap-1">
            {#each week as day (day.day)}
              <button
                type="button"
                class={`flex min-h-12 w-full flex-col items-center justify-start rounded-lg p-0.5 text-center transition-colors ${
                  day.isRest
                    ? 'bg-muted/30'
                    : day.sessions.length > 0
                      ? day.isDeload
                        ? 'bg-primary/3 ring-primary/15 cursor-pointer ring-1 ring-dashed hover:bg-primary/8 active:bg-primary/12'
                        : 'bg-primary/5 ring-primary/20 cursor-pointer ring-1 hover:bg-primary/10 active:bg-primary/15'
                      : 'bg-muted/50'
                } ${day.isCycleStart ? (day.isDeload ? 'border-l-2 border-muted-foreground/30' : 'border-l-2 border-primary/40') : ''}`}
                onclick={() => {
                  if (day.sessions.length > 0) {
                    selectedDay = day;
                    dayDialogOpen = true;
                  }
                }}
              >
                <span class="text-muted-foreground text-[0.55rem]">
                  {day.date.getDate()}
                </span>
                {#if day.isRest}
                  <span class="text-muted-foreground mt-0.5 text-[0.5rem]">Rest</span>
                {:else if day.sessions.length > 0}
                  <span
                    class={`mt-0.5 truncate text-[0.5rem] font-medium leading-tight ${
                      day.isDeload ? 'text-foreground/60' : 'text-primary'
                    }`}
                  >
                    {day.sessions[0].title}
                  </span>
                  {#if day.sessions.length > 1}
                    <div class="mt-0.5 flex gap-0.5">
                      {#each day.sessions as _, dotIdx (dotIdx)}
                        <div
                          class={`size-1 rounded-full ${day.isDeload ? 'bg-foreground/40' : 'bg-primary'}`}
                        ></div>
                      {/each}
                    </div>
                  {/if}
                {/if}
              </button>
            {/each}
            <!-- Pad remaining days if week is incomplete -->
            {#each Array(7 - week.length) as _, padIdx (padIdx)}
              <div></div>
            {/each}
          </div>
        {/each}
      </div>
    </CardContent>
  </Card>

  <!-- Week Progression -->
  <Card>
    <CardHeader>
      <CardTitle>Week Progression</CardTitle>
      <CardDescription>How targets change across your mesocycle</CardDescription>
    </CardHeader>
    <CardContent>
      <Tabs bind:value={activeWeekTab}>
        <TabsList>
          {#each Array(microcycleCount) as _, i (i)}
            <TabsTrigger value={`w${String(i + 1)}`}>C{i + 1}</TabsTrigger>
          {/each}
          <TabsTrigger value="dl">DL</TabsTrigger>
        </TabsList>
        {#each Array(microcycleCount + 1) as _, i (i)}
          {@const weekNum = i + 1}
          {@const isDeload = weekNum > microcycleCount}
          {@const tabValue = isDeload ? 'dl' : `w${String(weekNum)}`}
          {@const prog = getWeekProgression(weekNum, microcycleCount)}
          <TabsContent value={tabValue}>
            <div class="mb-2 flex gap-2">
              <Badge variant="secondary">RIR {prog.rir}</Badge>
              <Badge variant="outline">
                {prog.setsModifier > 0
                  ? `+${String(prog.setsModifier)}`
                  : prog.setsModifier === 0
                    ? 'Base'
                    : String(prog.setsModifier)} sets
              </Badge>
            </div>
            {#if sessions.length > 0}
              {@const firstSession = sessions[0]}
              <div class="space-y-1 text-xs">
                {#each firstSession.exercises.slice(0, 4) as exId (exId)}
                  {@const exercise = availableExercises.find((e) => e.id === exId)}
                  {@const cal = exerciseCalibrations[exId]}
                  {#if exercise && cal}
                    {@const reps = baseReps[exercise.repRange] ?? 10}
                    {@const sets = Math.max(1, cal.baseSets + prog.setsModifier)}
                    {@const setTargets = generateSetTargets(cal.oneRepMax, reps, sets, prog.rir)}
                    {@const minReps = Math.min(...setTargets.map((s) => s.reps))}
                    {@const maxReps = Math.max(...setTargets.map((s) => s.reps))}
                    {@const minWeight = Math.min(...setTargets.map((s) => s.weight))}
                    {@const maxWeight = Math.max(...setTargets.map((s) => s.weight))}
                    <div class="flex justify-between">
                      <span class="mr-2 truncate">{exercise.name}</span>
                      <span class="text-muted-foreground shrink-0">
                        {minReps === maxReps
                          ? minReps
                          : `${String(minReps)}\u2013${String(maxReps)}`} reps &middot;
                        {minWeight === maxWeight
                          ? minWeight
                          : `${String(minWeight)}\u2013${String(maxWeight)}`} lb
                      </span>
                    </div>
                  {/if}
                {/each}
                {#if firstSession.exercises.length > 4}
                  <span class="text-muted-foreground"
                    >+{firstSession.exercises.length - 4} more</span
                  >
                {/if}
              </div>
            {/if}
          </TabsContent>
        {/each}
      </Tabs>
    </CardContent>
  </Card>

  <!-- Summary & Actions -->
  <Card>
    <CardHeader>
      <CardTitle>Plan Summary</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p class="text-muted-foreground text-xs">Total Duration</p>
          <p class="font-medium">{microcycleCount + 1} weeks</p>
        </div>
        <div>
          <p class="text-muted-foreground text-xs">Total Sessions</p>
          <p class="font-medium">{sessions.length * microcycleCount}</p>
        </div>
        <div>
          <p class="text-muted-foreground text-xs">Unique Exercises</p>
          <p class="font-medium">
            {new Set(sessions.flatMap((s) => s.exercises)).size}
          </p>
        </div>
        <div>
          <p class="text-muted-foreground text-xs">Cycle Type</p>
          <p class="font-medium">{cycleTypeLabel}</p>
        </div>
      </div>
      <Separator />
      <Button class="w-full" size="lg">
        <IconCheck size={18} data-icon="inline-start" />
        Create Mesocycle
      </Button>
    </CardContent>
  </Card>
</div>

<!-- Day Detail Dialog -->
<Dialog bind:open={dayDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        {monthNames[selectedDay?.date.getMonth() ?? 0]}
        {selectedDay?.date.getDate()} — {selectedDay?.isDeload
          ? 'Deload'
          : `Cycle ${String(selectedDay?.weekNum)}`}
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
