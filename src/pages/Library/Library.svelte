<!--
  @component

  Tabbed library for managing exercises, muscle groups, and equipment.
  Each tab displays a searchable list of cards with expandable detail panels.
-->
<script lang="ts" module>
  export type RepRangeCategory = 'Strength' | 'Hypertrophy' | 'Endurance';

  export type Exercise = {
    id: string;
    name: string;
    equipment: string;
    progressionType: 'Rep' | 'Load';
    restTime: number;
    repRange: string;
    repRangeCategory: RepRangeCategory;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    notes?: string;
    calibration?: {
      date: string;
      weight: number;
      reps: number;
      estimated1RM: number;
    };
  };

  export type MuscleGroup = {
    id: string;
    name: string;
    notes?: string;
  };

  export type EquipmentItem = {
    id: string;
    name: string;
    notes?: string;
  };
</script>

<script lang="ts">
  import {
    IconAlertTriangle,
    IconBarbell,
    IconCheck,
    IconChevronDown,
    IconChevronUp,
    IconPencil,
    IconPlus,
    IconSearch,
    IconTrash
  } from '@tabler/icons-svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import DropdownMenu from '$ui/DropdownMenu/DropdownMenu.svelte';
  import DropdownMenuContent from '$ui/DropdownMenu/DropdownMenuContent.svelte';
  import DropdownMenuItem from '$ui/DropdownMenu/DropdownMenuItem.svelte';
  import DropdownMenuTrigger from '$ui/DropdownMenu/DropdownMenuTrigger.svelte';
  import Input from '$ui/Input/Input.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import Tabs from '$ui/Tabs/Tabs.svelte';
  import TabsContent from '$ui/Tabs/TabsContent.svelte';
  import TabsList from '$ui/Tabs/TabsList.svelte';
  import TabsTrigger from '$ui/Tabs/TabsTrigger.svelte';

  let {
    exercises = [],
    muscleGroups = [],
    equipment = []
  }: {
    exercises?: Exercise[];
    muscleGroups?: MuscleGroup[];
    equipment?: EquipmentItem[];
  } = $props();

  let searchQuery = $state('');
  let activeTab = $state('all');
  let expandedIds: string[] = $state([]);
  let addMenuOpen = $state(false);

  // --- Search ---

  function exerciseMatchesSearch(e: Exercise): boolean {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.equipment.toLowerCase().includes(q) ||
      e.primaryMuscles.some((m) => m.toLowerCase().includes(q)) ||
      e.secondaryMuscles.some((m) => m.toLowerCase().includes(q))
    );
  }

  let filteredExercises = $derived(exercises.filter(exerciseMatchesSearch));
  let filteredMuscleGroups = $derived(
    muscleGroups.filter((mg) => {
      if (!searchQuery.trim()) return true;
      return mg.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    })
  );
  let filteredEquipment = $derived(
    equipment.filter((eq) => {
      if (!searchQuery.trim()) return true;
      return eq.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    })
  );

  // --- All tab: intermixed, sorted alphabetically ---

  type AllItem =
    | { type: 'exercise'; id: string; name: string; data: Exercise }
    | { type: 'muscleGroup'; id: string; name: string; data: MuscleGroup }
    | { type: 'equipment'; id: string; name: string; data: EquipmentItem };

  let allItems = $derived.by(() => {
    const items: AllItem[] = [
      ...filteredExercises.map((e) => ({
        type: 'exercise' as const,
        id: `exercise-${e.id}`,
        name: e.name,
        data: e
      })),
      ...filteredMuscleGroups.map((mg) => ({
        type: 'muscleGroup' as const,
        id: `muscle-${mg.id}`,
        name: mg.name,
        data: mg
      })),
      ...filteredEquipment.map((eq) => ({
        type: 'equipment' as const,
        id: `equipment-${eq.id}`,
        name: eq.name,
        data: eq
      }))
    ];
    return items.sort((a, b) => a.name.localeCompare(b.name));
  });

  // --- Expand / collapse ---

  function toggleCard(key: string) {
    if (expandedIds.includes(key)) {
      expandedIds = expandedIds.filter((id) => id !== key);
    } else {
      expandedIds = [...expandedIds, key];
    }
  }

  // --- Linking helpers ---

  function exercisesForMuscleGroup(mgName: string) {
    return {
      primary: exercises.filter((e) => e.primaryMuscles.includes(mgName)),
      secondary: exercises.filter((e) => e.secondaryMuscles.includes(mgName))
    };
  }

  function exerciseCountForMuscleGroup(mgName: string): number {
    return exercises.filter(
      (e) => e.primaryMuscles.includes(mgName) || e.secondaryMuscles.includes(mgName)
    ).length;
  }

  function exercisesForEquipment(eqName: string) {
    return exercises.filter((e) => e.equipment === eqName);
  }

  // --- Rep range badge color ---

  function repRangeClass(category: RepRangeCategory): string {
    switch (category) {
      case 'Strength':
        return 'border-blue-400/60 text-blue-700 dark:border-blue-500/50 dark:text-blue-400';
      case 'Hypertrophy':
        return 'border-green-400/60 text-green-700 dark:border-green-500/50 dark:text-green-400';
      case 'Endurance':
        return 'border-amber-400/60 text-amber-700 dark:border-amber-500/50 dark:text-amber-400';
    }
  }

  // --- Add button label ---

  let addButtonLabel = $derived(
    activeTab === 'exercises'
      ? 'Exercise'
      : activeTab === 'muscle-groups'
        ? 'Muscle Group'
        : activeTab === 'equipment'
          ? 'Equipment'
          : ''
  );
</script>

<!-- ============================== Snippets ============================== -->

{#snippet exerciseCard(exercise: Exercise, showTypeLabel: boolean)}
  {@const key = `exercise-${exercise.id}`}
  {@const expanded = expandedIds.includes(key)}
  <div
    class="bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl text-sm ring-1 ring-foreground/10"
  >
    <button
      class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
      onclick={() => toggleCard(key)}
    >
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        {#if showTypeLabel}
          <span class="text-xs text-muted-foreground">Exercise</span>
        {/if}
        <div class="flex items-center gap-1.5">
          <span class="font-medium">{exercise.name}</span>
          {#if !exercise.calibration}
            <IconAlertTriangle size={14} class="shrink-0 text-amber-500" />
          {/if}
        </div>
        <div class="flex flex-wrap gap-1">
          <Badge variant="outline" class={repRangeClass(exercise.repRangeCategory)}>
            {exercise.repRange} reps
          </Badge>
          {#each exercise.primaryMuscles as muscle (muscle)}
            <Badge variant="secondary">{muscle}</Badge>
          {/each}
        </div>
      </div>
      {#if expanded}
        <IconChevronUp size={16} class="shrink-0 text-muted-foreground" />
      {:else}
        <IconChevronDown size={16} class="shrink-0 text-muted-foreground" />
      {/if}
    </button>

    {#if expanded}
      <Separator />
      <div class="flex flex-col gap-3 px-3 py-3">
        <!-- Properties grid -->
        <div class="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div>
            <span class="text-xs text-muted-foreground">Equipment</span>
            <p>{exercise.equipment}</p>
          </div>
          <div>
            <span class="text-xs text-muted-foreground">Progression</span>
            <p>{exercise.progressionType}</p>
          </div>
          <div>
            <span class="text-xs text-muted-foreground">Rest Time</span>
            <p>{exercise.restTime}s</p>
          </div>
          <div>
            <span class="text-xs text-muted-foreground">Rep Range</span>
            <p>{exercise.repRangeCategory}</p>
          </div>
        </div>

        <!-- Muscle groups -->
        <div>
          <span class="text-xs text-muted-foreground">Muscle Groups</span>
          <div class="mt-1 flex flex-wrap gap-1">
            {#each exercise.primaryMuscles as muscle (muscle)}
              <Badge>{muscle}</Badge>
            {/each}
            {#each exercise.secondaryMuscles as muscle (muscle)}
              <Badge variant="outline">{muscle}</Badge>
            {/each}
          </div>
        </div>

        <!-- Notes -->
        {#if exercise.notes}
          <div>
            <span class="text-xs text-muted-foreground">Notes</span>
            <p class="mt-0.5">{exercise.notes}</p>
          </div>
        {/if}

        <!-- Calibration -->
        <Separator />
        {#if exercise.calibration}
          <div class="rounded-lg bg-muted/50 p-3">
            <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconCheck size={14} class="text-green-600" />
              Calibrated on {exercise.calibration.date}
            </div>
            <div class="mt-2 grid grid-cols-3 text-center">
              <div>
                <span class="text-xs text-muted-foreground">Weight</span>
                <p class="font-medium">{exercise.calibration.weight} lb</p>
              </div>
              <div>
                <span class="text-xs text-muted-foreground">Reps</span>
                <p class="font-medium">{exercise.calibration.reps}</p>
              </div>
              <div>
                <span class="text-xs text-muted-foreground">Est. 1RM</span>
                <p class="font-medium">{exercise.calibration.estimated1RM} lb</p>
              </div>
            </div>
          </div>
        {:else}
          <div
            class="rounded-lg border border-amber-300/50 bg-amber-50 p-3 dark:border-amber-600/30 dark:bg-amber-950/30"
          >
            <div class="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
              <IconAlertTriangle size={14} />
              Not Calibrated
            </div>
            <p class="mt-1 text-xs text-amber-600 dark:text-amber-500">
              Calibration data is needed for accurate load recommendations.
            </p>
          </div>
          <Button variant="outline" size="sm" class="w-full">
            <IconBarbell size={14} />
            Add Calibration
          </Button>
        {/if}

        <!-- Actions -->
        <div class="flex gap-2">
          <Button variant="outline" size="sm">
            <IconPencil size={14} />
            Edit
          </Button>
          <Button variant="destructive" size="sm">
            <IconTrash size={14} />
            Delete
          </Button>
        </div>
      </div>
    {/if}
  </div>
{/snippet}

{#snippet muscleGroupCard(mg: MuscleGroup, showTypeLabel: boolean)}
  {@const key = `muscle-${mg.id}`}
  {@const expanded = expandedIds.includes(key)}
  {@const linked = exercisesForMuscleGroup(mg.name)}
  {@const count = exerciseCountForMuscleGroup(mg.name)}
  <div
    class="bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl text-sm ring-1 ring-foreground/10"
  >
    <button
      class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
      onclick={() => toggleCard(key)}
    >
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        {#if showTypeLabel}
          <span class="text-xs text-muted-foreground">Muscle Group</span>
        {/if}
        <span class="font-medium">{mg.name}</span>
        <span class="text-xs text-muted-foreground">
          Used in {count} exercise{count !== 1 ? 's' : ''}
        </span>
      </div>
      {#if expanded}
        <IconChevronUp size={16} class="shrink-0 text-muted-foreground" />
      {:else}
        <IconChevronDown size={16} class="shrink-0 text-muted-foreground" />
      {/if}
    </button>

    {#if expanded}
      <Separator />
      <div class="flex flex-col gap-3 px-3 py-3">
        {#if linked.primary.length > 0}
          <div>
            <span class="text-xs text-muted-foreground">Primary in</span>
            <ul class="mt-1 flex flex-col gap-0.5">
              {#each linked.primary as exercise (exercise.id)}
                <li>
                  <button class="text-left text-primary hover:underline">
                    {exercise.name}
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        {#if linked.secondary.length > 0}
          <div>
            <span class="text-xs text-muted-foreground">Secondary in</span>
            <ul class="mt-1 flex flex-col gap-0.5">
              {#each linked.secondary as exercise (exercise.id)}
                <li>
                  <button class="text-left text-primary hover:underline">
                    {exercise.name}
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        {#if linked.primary.length === 0 && linked.secondary.length === 0}
          <p class="text-xs text-muted-foreground">No exercises use this muscle group yet.</p>
        {/if}

        {#if mg.notes}
          <div>
            <span class="text-xs text-muted-foreground">Notes</span>
            <p class="mt-0.5">{mg.notes}</p>
          </div>
        {/if}

        <div class="flex gap-2">
          <Button variant="outline" size="sm">
            <IconPencil size={14} />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={count > 0}
            title={count > 0 ? 'Remove from all exercises first' : undefined}
          >
            <IconTrash size={14} />
            Delete
          </Button>
        </div>
      </div>
    {/if}
  </div>
{/snippet}

{#snippet equipmentCard(eq: EquipmentItem, showTypeLabel: boolean)}
  {@const key = `equipment-${eq.id}`}
  {@const expanded = expandedIds.includes(key)}
  {@const linked = exercisesForEquipment(eq.name)}
  <div
    class="bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl text-sm ring-1 ring-foreground/10"
  >
    <button
      class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
      onclick={() => toggleCard(key)}
    >
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        {#if showTypeLabel}
          <span class="text-xs text-muted-foreground">Equipment</span>
        {/if}
        <span class="font-medium">{eq.name}</span>
        <span class="text-xs text-muted-foreground">
          Used in {linked.length} exercise{linked.length !== 1 ? 's' : ''}
        </span>
      </div>
      {#if expanded}
        <IconChevronUp size={16} class="shrink-0 text-muted-foreground" />
      {:else}
        <IconChevronDown size={16} class="shrink-0 text-muted-foreground" />
      {/if}
    </button>

    {#if expanded}
      <Separator />
      <div class="flex flex-col gap-3 px-3 py-3">
        {#if linked.length > 0}
          <div>
            <span class="text-xs text-muted-foreground">Used by</span>
            <ul class="mt-1 flex flex-col gap-0.5">
              {#each linked as exercise (exercise.id)}
                <li>
                  <button class="text-left text-primary hover:underline">
                    {exercise.name}
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {:else}
          <p class="text-xs text-muted-foreground">No exercises use this equipment yet.</p>
        {/if}

        {#if eq.notes}
          <div>
            <span class="text-xs text-muted-foreground">Notes</span>
            <p class="mt-0.5">{eq.notes}</p>
          </div>
        {/if}

        <div class="flex gap-2">
          <Button variant="outline" size="sm">
            <IconPencil size={14} />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={linked.length > 0}
            title={linked.length > 0 ? 'Remove from all exercises first' : undefined}
          >
            <IconTrash size={14} />
            Delete
          </Button>
        </div>
      </div>
    {/if}
  </div>
{/snippet}

{#snippet emptyState()}
  <div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
    <IconSearch size={48} class="mb-3 opacity-40" />
    <p class="font-medium">No results found</p>
    <p class="text-xs">Try a different search or tab.</p>
  </div>
{/snippet}

<!-- ============================== Layout ============================== -->

<div class="flex flex-col gap-4 p-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-semibold">Library</h1>
    {#if activeTab === 'all'}
      <DropdownMenu bind:open={addMenuOpen}>
        <DropdownMenuTrigger>
          <button
            class="inline-flex h-7 items-center gap-1 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground"
          >
            <IconPlus size={14} />
            Add
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Exercise</DropdownMenuItem>
          <DropdownMenuItem>Muscle Group</DropdownMenuItem>
          <DropdownMenuItem>Equipment</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    {:else}
      <Button size="sm">
        <IconPlus size={14} />
        Add {addButtonLabel}
      </Button>
    {/if}
  </div>

  <!-- Search -->
  <div class="relative">
    <IconSearch
      size={16}
      class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
    />
    <Input class="pl-8" placeholder="Search library..." bind:value={searchQuery} />
  </div>

  <!-- Tabs -->
  <Tabs bind:value={activeTab}>
    <TabsList class="w-full">
      <TabsTrigger value="all">All</TabsTrigger>
      <TabsTrigger value="exercises">Exercises ({filteredExercises.length})</TabsTrigger>
      <TabsTrigger value="muscle-groups">Groups ({filteredMuscleGroups.length})</TabsTrigger>
      <TabsTrigger value="equipment">Equip. ({filteredEquipment.length})</TabsTrigger>
    </TabsList>

    <!-- All -->
    <TabsContent value="all">
      {#if allItems.length > 0}
        <div class="flex flex-col gap-2">
          {#each allItems as item (item.id)}
            {#if item.type === 'exercise'}
              {@render exerciseCard(item.data, true)}
            {:else if item.type === 'muscleGroup'}
              {@render muscleGroupCard(item.data, true)}
            {:else}
              {@render equipmentCard(item.data, true)}
            {/if}
          {/each}
        </div>
      {:else}
        {@render emptyState()}
      {/if}
    </TabsContent>

    <!-- Exercises -->
    <TabsContent value="exercises">
      {#if filteredExercises.length > 0}
        <div class="flex flex-col gap-2">
          {#each filteredExercises as exercise (exercise.id)}
            {@render exerciseCard(exercise, false)}
          {/each}
        </div>
      {:else}
        {@render emptyState()}
      {/if}
    </TabsContent>

    <!-- Muscle Groups -->
    <TabsContent value="muscle-groups">
      {#if filteredMuscleGroups.length > 0}
        <div class="flex flex-col gap-2">
          {#each filteredMuscleGroups as mg (mg.id)}
            {@render muscleGroupCard(mg, false)}
          {/each}
        </div>
      {:else}
        {@render emptyState()}
      {/if}
    </TabsContent>

    <!-- Equipment -->
    <TabsContent value="equipment">
      {#if filteredEquipment.length > 0}
        <div class="flex flex-col gap-2">
          {#each filteredEquipment as eq (eq.id)}
            {@render equipmentCard(eq, false)}
          {/each}
        </div>
      {:else}
        {@render emptyState()}
      {/if}
    </TabsContent>
  </Tabs>
</div>
