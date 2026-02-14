<!--
  @component

  Tabbed library for managing exercises, muscle groups, and equipment.
  Each tab displays a searchable list of cards with expandable detail panels.
  Reads data from DocumentMapStoreService singletons.
-->
<script lang="ts">
  import {
    ExerciseRepRange,
    type WorkoutEquipmentType,
    type WorkoutExercise,
    type WorkoutExerciseCalibration,
    type WorkoutMuscleGroup
  } from '@aneuhold/core-ts-db-lib';
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
  import type { UUID } from 'crypto';
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
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

  let searchQuery = $state('');
  let activeTab = $state('all');
  let expandedIds: string[] = $state([]);
  let addMenuOpen = $state(false);

  // --- Derived data from stores ---

  let exercises = $derived(exerciseMapService.getDocs());
  let muscleGroups = $derived(muscleGroupMapService.getDocs());
  let equipmentTypes = $derived(equipmentTypeMapService.getDocs());
  let calibrations = $derived(exerciseCalibrationMapService.getDocs());

  // --- Lookup helpers ---

  function getMuscleGroupName(id: UUID): string {
    const muscleGroup = muscleGroupMapService.getDoc(id);
    return muscleGroup?.name ?? 'Unknown';
  }

  function getEquipmentName(id: UUID): string {
    const equipmentType = equipmentTypeMapService.getDoc(id);
    return equipmentType?.title ?? 'Unknown';
  }

  function getCalibrationForExercise(exerciseId: UUID): WorkoutExerciseCalibration | undefined {
    return calibrations.find((calibration) => calibration.workoutExerciseId === exerciseId);
  }

  function calculate1RM(weight: number, reps: number): number {
    return Math.round((weight * reps) / 30.48 + weight);
  }

  function repRangeDisplay(repRange: ExerciseRepRange): string {
    switch (repRange) {
      case ExerciseRepRange.Heavy:
        return '5-15';
      case ExerciseRepRange.Medium:
        return '10-20';
      case ExerciseRepRange.Light:
        return '15-30';
    }
  }

  function repRangeCategory(repRange: ExerciseRepRange): 'Strength' | 'Hypertrophy' | 'Endurance' {
    switch (repRange) {
      case ExerciseRepRange.Heavy:
        return 'Strength';
      case ExerciseRepRange.Medium:
        return 'Hypertrophy';
      case ExerciseRepRange.Light:
        return 'Endurance';
    }
  }

  function weightOptionsSummary(equipmentType: WorkoutEquipmentType): string | undefined {
    if (!equipmentType.weightOptions || equipmentType.weightOptions.length === 0) return undefined;
    const options = equipmentType.weightOptions;
    return `${options[0]}–${options[options.length - 1]} lb (${options.length} options)`;
  }

  // --- Search ---

  function exerciseMatchesSearch(exercise: WorkoutExercise): boolean {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    const equipmentName = getEquipmentName(exercise.workoutEquipmentTypeId).toLowerCase();
    const primaryNames = exercise.primaryMuscleGroups.map((id) =>
      getMuscleGroupName(id).toLowerCase()
    );
    const secondaryNames = exercise.secondaryMuscleGroups.map((id) =>
      getMuscleGroupName(id).toLowerCase()
    );
    return (
      exercise.exerciseName.toLowerCase().includes(query) ||
      equipmentName.includes(query) ||
      primaryNames.some((name) => name.includes(query)) ||
      secondaryNames.some((name) => name.includes(query))
    );
  }

  let filteredExercises = $derived(exercises.filter(exerciseMatchesSearch));
  let filteredMuscleGroups = $derived(
    muscleGroups.filter((muscleGroup) => {
      if (!searchQuery.trim()) return true;
      return muscleGroup.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    })
  );
  let filteredEquipment = $derived(
    equipmentTypes.filter((equipmentType) => {
      if (!searchQuery.trim()) return true;
      return equipmentType.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
    })
  );

  // --- All tab: intermixed, sorted alphabetically ---

  type AllItem =
    | { type: 'exercise'; id: string; name: string; data: WorkoutExercise }
    | { type: 'muscleGroup'; id: string; name: string; data: WorkoutMuscleGroup }
    | { type: 'equipment'; id: string; name: string; data: WorkoutEquipmentType };

  let allItems = $derived.by(() => {
    const items: AllItem[] = [
      ...filteredExercises.map((exercise) => ({
        type: 'exercise' as const,
        id: `exercise-${exercise._id}`,
        name: exercise.exerciseName,
        data: exercise
      })),
      ...filteredMuscleGroups.map((muscleGroup) => ({
        type: 'muscleGroup' as const,
        id: `muscle-${muscleGroup._id}`,
        name: muscleGroup.name,
        data: muscleGroup
      })),
      ...filteredEquipment.map((equipmentType) => ({
        type: 'equipment' as const,
        id: `equipment-${equipmentType._id}`,
        name: equipmentType.title,
        data: equipmentType
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

  function exercisesForMuscleGroup(muscleGroupId: UUID) {
    return {
      primary: exercises.filter((exercise) => exercise.primaryMuscleGroups.includes(muscleGroupId)),
      secondary: exercises.filter((exercise) =>
        exercise.secondaryMuscleGroups.includes(muscleGroupId)
      )
    };
  }

  function exerciseCountForMuscleGroup(muscleGroupId: UUID): number {
    return exercises.filter(
      (exercise) =>
        exercise.primaryMuscleGroups.includes(muscleGroupId) ||
        exercise.secondaryMuscleGroups.includes(muscleGroupId)
    ).length;
  }

  function exercisesForEquipment(equipmentTypeId: UUID) {
    return exercises.filter((exercise) => exercise.workoutEquipmentTypeId === equipmentTypeId);
  }

  // --- Rep range badge color ---

  function repRangeClass(category: 'Strength' | 'Hypertrophy' | 'Endurance'): string {
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

{#snippet exerciseCard(exercise: WorkoutExercise, showTypeLabel: boolean)}
  {@const key = `exercise-${exercise._id}`}
  {@const expanded = expandedIds.includes(key)}
  {@const calibration = getCalibrationForExercise(exercise._id)}
  {@const category = repRangeCategory(exercise.repRange)}
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
          <span class="font-medium">{exercise.exerciseName}</span>
          {#if !calibration}
            <IconAlertTriangle size={14} class="shrink-0 text-amber-500" />
          {/if}
        </div>
        <div class="flex flex-wrap gap-1">
          <Badge variant="outline" class={repRangeClass(category)}>
            {repRangeDisplay(exercise.repRange)} reps
          </Badge>
          {#each exercise.primaryMuscleGroups as muscleGroupId (muscleGroupId)}
            <Badge variant="secondary">{getMuscleGroupName(muscleGroupId)}</Badge>
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
            <p>{getEquipmentName(exercise.workoutEquipmentTypeId)}</p>
          </div>
          <div>
            <span class="text-xs text-muted-foreground">Progression</span>
            <p>{exercise.preferredProgressionType}</p>
          </div>
          <div>
            <span class="text-xs text-muted-foreground">Rest Time</span>
            <p>{exercise.restSeconds ?? '—'}s</p>
          </div>
          <div>
            <span class="text-xs text-muted-foreground">Rep Range</span>
            <p>{category}</p>
          </div>
        </div>

        <!-- Muscle groups -->
        <div>
          <span class="text-xs text-muted-foreground">Muscle Groups</span>
          <div class="mt-1 flex flex-wrap gap-1">
            {#each exercise.primaryMuscleGroups as muscleGroupId (muscleGroupId)}
              <Badge>{getMuscleGroupName(muscleGroupId)}</Badge>
            {/each}
            {#each exercise.secondaryMuscleGroups as muscleGroupId (muscleGroupId)}
              <Badge variant="outline">{getMuscleGroupName(muscleGroupId)}</Badge>
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
        {#if calibration}
          <div class="rounded-lg bg-muted/50 p-3">
            <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconCheck size={14} class="text-green-600" />
              Calibrated on {calibration.dateRecorded.toLocaleDateString()}
            </div>
            <div class="mt-2 grid grid-cols-3 text-center">
              <div>
                <span class="text-xs text-muted-foreground">Weight</span>
                <p class="font-medium">{calibration.weight} lb</p>
              </div>
              <div>
                <span class="text-xs text-muted-foreground">Reps</span>
                <p class="font-medium">{calibration.reps}</p>
              </div>
              <div>
                <span class="text-xs text-muted-foreground">Est. 1RM</span>
                <p class="font-medium">{calculate1RM(calibration.weight, calibration.reps)} lb</p>
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

{#snippet muscleGroupCard(muscleGroup: WorkoutMuscleGroup, showTypeLabel: boolean)}
  {@const key = `muscle-${muscleGroup._id}`}
  {@const expanded = expandedIds.includes(key)}
  {@const linkedExercises = exercisesForMuscleGroup(muscleGroup._id)}
  {@const exerciseCount = exerciseCountForMuscleGroup(muscleGroup._id)}
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
        <span class="font-medium">{muscleGroup.name}</span>
        <span class="text-xs text-muted-foreground">
          Used in {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
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
        {#if linkedExercises.primary.length > 0}
          <div>
            <span class="text-xs text-muted-foreground">Primary in</span>
            <ul class="mt-1 flex flex-col gap-0.5">
              {#each linkedExercises.primary as exercise (exercise._id)}
                <li>
                  <button class="text-left text-primary hover:underline">
                    {exercise.exerciseName}
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        {#if linkedExercises.secondary.length > 0}
          <div>
            <span class="text-xs text-muted-foreground">Secondary in</span>
            <ul class="mt-1 flex flex-col gap-0.5">
              {#each linkedExercises.secondary as exercise (exercise._id)}
                <li>
                  <button class="text-left text-primary hover:underline">
                    {exercise.exerciseName}
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        {#if linkedExercises.primary.length === 0 && linkedExercises.secondary.length === 0}
          <p class="text-xs text-muted-foreground">No exercises use this muscle group yet.</p>
        {/if}

        {#if muscleGroup.description}
          <div>
            <span class="text-xs text-muted-foreground">Description</span>
            <p class="mt-0.5">{muscleGroup.description}</p>
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
            disabled={exerciseCount > 0}
            title={exerciseCount > 0 ? 'Remove from all exercises first' : undefined}
          >
            <IconTrash size={14} />
            Delete
          </Button>
        </div>
      </div>
    {/if}
  </div>
{/snippet}

{#snippet equipmentCard(equipmentType: WorkoutEquipmentType, showTypeLabel: boolean)}
  {@const key = `equipment-${equipmentType._id}`}
  {@const expanded = expandedIds.includes(key)}
  {@const linkedExercises = exercisesForEquipment(equipmentType._id)}
  {@const weightSummary = weightOptionsSummary(equipmentType)}
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
        <span class="font-medium">{equipmentType.title}</span>
        <span class="text-xs text-muted-foreground">
          Used in {linkedExercises.length} exercise{linkedExercises.length !== 1 ? 's' : ''}
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
        {#if linkedExercises.length > 0}
          <div>
            <span class="text-xs text-muted-foreground">Used by</span>
            <ul class="mt-1 flex flex-col gap-0.5">
              {#each linkedExercises as exercise (exercise._id)}
                <li>
                  <button class="text-left text-primary hover:underline">
                    {exercise.exerciseName}
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {:else}
          <p class="text-xs text-muted-foreground">No exercises use this equipment yet.</p>
        {/if}

        {#if weightSummary}
          <div>
            <span class="text-xs text-muted-foreground">Weight Options</span>
            <p class="mt-0.5">{weightSummary}</p>
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
            disabled={linkedExercises.length > 0}
            title={linkedExercises.length > 0 ? 'Remove from all exercises first' : undefined}
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
          {#each filteredExercises as exercise (exercise._id)}
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
          {#each filteredMuscleGroups as muscleGroup (muscleGroup._id)}
            {@render muscleGroupCard(muscleGroup, false)}
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
          {#each filteredEquipment as equipmentType (equipmentType._id)}
            {@render equipmentCard(equipmentType, false)}
          {/each}
        </div>
      {:else}
        {@render emptyState()}
      {/if}
    </TabsContent>
  </Tabs>
</div>
