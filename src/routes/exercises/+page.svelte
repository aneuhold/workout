<!--
  @component

  Exercise library page. Searchable list of exercises with calibration status,
  muscle groups, and expandable detail.
-->
<script lang="ts">
  import {
    IconAlertTriangle,
    IconBarbell,
    IconCheck,
    IconChevronDown,
    IconChevronUp,
    IconPlus,
    IconSearch
  } from '@tabler/icons-svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import Input from '$ui/Input/Input.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import Tabs from '$ui/Tabs/Tabs.svelte';
  import TabsList from '$ui/Tabs/TabsList.svelte';
  import TabsTrigger from '$ui/Tabs/TabsTrigger.svelte';

  // Fake exercise data
  const exercises = [
    {
      id: 'ex-1',
      name: 'Barbell Bench Press',
      equipment: 'Olympic Barbell (45lb bar + plates)',
      repRange: 'Heavy',
      progressionType: 'Rep',
      primaryMuscles: ['Chest'],
      secondaryMuscles: ['Triceps', 'Front Delts'],
      notes: 'Standard flat bench. Focus on arch and leg drive. 3s eccentric.',
      restSeconds: 120,
      calibration: { weight: 225, reps: 3, date: '2026-01-15', estimated1RM: 247 },
      customProperties: []
    },
    {
      id: 'ex-2',
      name: 'Incline Dumbbell Press',
      equipment: 'Dumbbells',
      repRange: 'Medium',
      progressionType: 'Rep',
      primaryMuscles: ['Upper Chest'],
      secondaryMuscles: ['Triceps', 'Front Delts'],
      notes: '30 degree incline. Controlled eccentric.',
      restSeconds: 90,
      calibration: { weight: 75, reps: 5, date: '2026-01-15', estimated1RM: 87 },
      customProperties: []
    },
    {
      id: 'ex-3',
      name: 'Cable Fly',
      equipment: 'Cable Machine',
      repRange: 'Medium',
      progressionType: 'Rep',
      primaryMuscles: ['Chest'],
      secondaryMuscles: [],
      notes: 'High-to-low angle. Squeeze at peak.',
      restSeconds: 60,
      calibration: null,
      customProperties: []
    },
    {
      id: 'ex-4',
      name: 'Barbell Squat (Deep)',
      equipment: 'Olympic Barbell (45lb bar + plates)',
      repRange: 'Heavy',
      progressionType: 'Load',
      primaryMuscles: ['Quads', 'Glutes'],
      secondaryMuscles: ['Hamstrings', 'Adductors'],
      notes: 'High bar, ATG depth. Flat shoes.',
      restSeconds: 180,
      calibration: { weight: 315, reps: 2, date: '2026-01-20', estimated1RM: 336 },
      customProperties: []
    },
    {
      id: 'ex-5',
      name: 'Romanian Deadlift',
      equipment: 'Olympic Barbell (45lb bar + plates)',
      repRange: 'Medium',
      progressionType: 'Rep',
      primaryMuscles: ['Hamstrings', 'Glutes'],
      secondaryMuscles: ['Lower Back'],
      notes: 'Hinge until stretch in hamstrings. Keep bar close.',
      restSeconds: 120,
      calibration: { weight: 275, reps: 4, date: '2026-01-20', estimated1RM: 311 },
      customProperties: []
    },
    {
      id: 'ex-6',
      name: 'Lateral Raise',
      equipment: 'Dumbbells',
      repRange: 'Light',
      progressionType: 'Rep',
      primaryMuscles: ['Side Delts'],
      secondaryMuscles: [],
      notes: 'Slight lean forward. Lead with elbows.',
      restSeconds: 60,
      calibration: null,
      customProperties: []
    },
    {
      id: 'ex-7',
      name: 'Tricep Pushdown',
      equipment: 'Cable Machine',
      repRange: 'Medium',
      progressionType: 'Rep',
      primaryMuscles: ['Triceps'],
      secondaryMuscles: [],
      notes: 'Rope attachment. Full extension at bottom.',
      restSeconds: 60,
      calibration: { weight: 70, reps: 6, date: '2026-02-01', estimated1RM: 84 },
      customProperties: []
    },
    {
      id: 'ex-8',
      name: 'Barbell Row',
      equipment: 'Olympic Barbell (45lb bar + plates)',
      repRange: 'Heavy',
      progressionType: 'Load',
      primaryMuscles: ['Lats', 'Upper Back'],
      secondaryMuscles: ['Biceps', 'Rear Delts'],
      notes: 'Pendlay style from floor. Pronated grip.',
      restSeconds: 120,
      calibration: { weight: 205, reps: 4, date: '2026-01-22', estimated1RM: 232 },
      customProperties: []
    },
    {
      id: 'ex-9',
      name: 'Pull Up (Weighted)',
      equipment: 'Bodyweight + Belt',
      repRange: 'Heavy',
      progressionType: 'Load',
      primaryMuscles: ['Lats'],
      secondaryMuscles: ['Biceps', 'Rear Delts'],
      notes: 'Pronated, shoulder width. Full hang at bottom.',
      restSeconds: 120,
      calibration: null,
      customProperties: []
    },
    {
      id: 'ex-10',
      name: 'Barbell Curl',
      equipment: 'EZ Bar',
      repRange: 'Medium',
      progressionType: 'Rep',
      primaryMuscles: ['Biceps'],
      secondaryMuscles: [],
      notes: 'Strict form, no swinging.',
      restSeconds: 60,
      calibration: { weight: 80, reps: 6, date: '2026-02-01', estimated1RM: 96 },
      customProperties: []
    }
  ];

  let searchQuery = $state('');
  let filterTab = $state('all');
  let expandedExercise = $state<string | null>(null);

  const filteredExercises = $derived(() => {
    let result = exercises;

    if (filterTab === 'calibrated') {
      result = result.filter((e) => e.calibration !== null);
    } else if (filterTab === 'uncalibrated') {
      result = result.filter((e) => e.calibration === null);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.primaryMuscles.some((m) => m.toLowerCase().includes(q)) ||
          e.secondaryMuscles.some((m) => m.toLowerCase().includes(q)) ||
          e.equipment.toLowerCase().includes(q)
      );
    }

    return result;
  });

  const uncalibratedCount = exercises.filter((e) => e.calibration === null).length;

  const repRangeColor: Record<string, string> = {
    Heavy: 'bg-red-500/10 text-red-500',
    Medium: 'bg-yellow-500/10 text-yellow-500',
    Light: 'bg-green-500/10 text-green-500'
  };
</script>

<div class="mx-auto max-w-lg space-y-4 p-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-lg font-semibold">Exercise Library</h1>
    <Button size="sm">
      <IconPlus size={14} data-icon="inline-start" />
      Add Exercise
    </Button>
  </div>

  <!-- Search -->
  <div class="relative">
    <IconSearch size={16} class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2" />
    <Input
      placeholder="Search exercises, muscles, equipment..."
      class="pl-9"
      bind:value={searchQuery}
    />
  </div>

  <!-- Filter tabs -->
  <Tabs
    value={filterTab}
    onValueChange={(v) => {
      if (v) filterTab = v;
    }}
  >
    <TabsList class="w-full">
      <TabsTrigger value="all" class="flex-1">All ({exercises.length})</TabsTrigger>
      <TabsTrigger value="calibrated" class="flex-1">
        Calibrated ({exercises.length - uncalibratedCount})
      </TabsTrigger>
      <TabsTrigger value="uncalibrated" class="flex-1">
        Needs Cal. ({uncalibratedCount})
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Exercise list -->
  <div class="space-y-2">
    {#each filteredExercises() as exercise (exercise.id)}
      {@const isExpanded = expandedExercise === exercise.id}

      <Card size="sm">
        <button
          class="w-full text-left"
          onclick={() => {
            expandedExercise = isExpanded ? null : exercise.id;
          }}
        >
          <CardHeader>
            <div class="flex items-start gap-2">
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <CardTitle class="flex items-center gap-2">
                  <span class="truncate">{exercise.name}</span>
                  {#if !exercise.calibration}
                    <IconAlertTriangle size={14} class="text-destructive shrink-0" />
                  {/if}
                </CardTitle>
                <div class="flex flex-wrap gap-1">
                  <Badge variant="outline" class={repRangeColor[exercise.repRange]}>
                    {exercise.repRange}
                  </Badge>
                  {#each exercise.primaryMuscles as mg (mg)}
                    <Badge variant="secondary">{mg}</Badge>
                  {/each}
                </div>
              </div>
              {#if isExpanded}
                <IconChevronUp size={16} class="text-muted-foreground mt-0.5 shrink-0" />
              {:else}
                <IconChevronDown size={16} class="text-muted-foreground mt-0.5 shrink-0" />
              {/if}
            </div>
          </CardHeader>
        </button>

        {#if isExpanded}
          <CardContent class="space-y-3">
            <Separator />

            <!-- Equipment & Settings -->
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-muted-foreground text-xs">Equipment</p>
                <p>{exercise.equipment}</p>
              </div>
              <div>
                <p class="text-muted-foreground text-xs">Progression</p>
                <p>{exercise.progressionType}</p>
              </div>
              <div>
                <p class="text-muted-foreground text-xs">Rest</p>
                <p>{exercise.restSeconds}s</p>
              </div>
              <div>
                <p class="text-muted-foreground text-xs">Rep Range</p>
                <p>{exercise.repRange}</p>
              </div>
            </div>

            <!-- Muscle groups -->
            <div>
              <p class="text-muted-foreground mb-1 text-xs">Muscle Groups</p>
              <div class="flex flex-wrap gap-1">
                {#each exercise.primaryMuscles as mg (mg)}
                  <Badge variant="default">{mg}</Badge>
                {/each}
                {#each exercise.secondaryMuscles as mg (mg)}
                  <Badge variant="outline">{mg}</Badge>
                {/each}
              </div>
            </div>

            <!-- Notes -->
            {#if exercise.notes}
              <div>
                <p class="text-muted-foreground mb-1 text-xs">Notes</p>
                <p class="text-sm">{exercise.notes}</p>
              </div>
            {/if}

            <!-- Calibration -->
            <Separator />
            <div>
              <p class="text-muted-foreground mb-2 text-xs font-medium">Calibration</p>
              {#if exercise.calibration}
                <div class="bg-muted/50 rounded-lg p-3">
                  <div class="flex items-center gap-2">
                    <IconCheck size={14} class="text-green-500" />
                    <span class="text-sm font-medium">Calibrated</span>
                    <span class="text-muted-foreground text-xs">
                      {exercise.calibration.date}
                    </span>
                  </div>
                  <div class="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p class="text-muted-foreground text-xs">Weight</p>
                      <p class="text-sm font-medium">{exercise.calibration.weight} lb</p>
                    </div>
                    <div>
                      <p class="text-muted-foreground text-xs">Reps</p>
                      <p class="text-sm font-medium">{exercise.calibration.reps}</p>
                    </div>
                    <div>
                      <p class="text-muted-foreground text-xs">Est. 1RM</p>
                      <p class="text-sm font-medium">{exercise.calibration.estimated1RM} lb</p>
                    </div>
                  </div>
                </div>
              {:else}
                <div class="bg-destructive/5 flex items-center gap-3 rounded-lg p-3">
                  <IconAlertTriangle size={18} class="text-destructive shrink-0" />
                  <div>
                    <p class="text-sm font-medium">Not Calibrated</p>
                    <p class="text-muted-foreground text-xs">
                      Calibrate this exercise for accurate load recommendations.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" class="mt-2 w-full">
                  <IconBarbell size={14} data-icon="inline-start" />
                  Add Calibration
                </Button>
              {/if}
            </div>
          </CardContent>
        {/if}
      </Card>
    {/each}

    {#if filteredExercises().length === 0}
      <div class="py-8 text-center">
        <IconSearch size={32} class="text-muted-foreground mx-auto mb-2" />
        <p class="text-muted-foreground text-sm">No exercises found</p>
      </div>
    {/if}
  </div>
</div>
