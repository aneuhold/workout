<!--
  @component

  Tabbed library for managing exercises, muscle groups, and equipment.
  Each tab displays a searchable list of cards with expandable detail panels.
  Reads data from DocumentMapStoreService singletons.
-->
<script lang="ts">
  import {
    type WorkoutEquipmentType,
    type WorkoutExercise,
    type WorkoutMuscleGroup
  } from '@aneuhold/core-ts-db-lib';
  import { IconPlus, IconSearch } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import { SvelteSet } from 'svelte/reactivity';
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import Button from '$ui/Button/Button.svelte';
  import DropdownMenu from '$ui/DropdownMenu/DropdownMenu.svelte';
  import DropdownMenuContent from '$ui/DropdownMenu/DropdownMenuContent.svelte';
  import DropdownMenuItem from '$ui/DropdownMenu/DropdownMenuItem.svelte';
  import DropdownMenuTrigger from '$ui/DropdownMenu/DropdownMenuTrigger.svelte';
  import Input from '$ui/Input/Input.svelte';
  import Tabs from '$ui/Tabs/Tabs.svelte';
  import TabsContent from '$ui/Tabs/TabsContent.svelte';
  import TabsList from '$ui/Tabs/TabsList.svelte';
  import TabsTrigger from '$ui/Tabs/TabsTrigger.svelte';
  import LibraryPageEmptyState from './LibraryPageEmptyState.svelte';
  import LibraryPageEquipmentCard from './LibraryPageEquipmentCard.svelte';
  import LibraryPageExerciseCard from './LibraryPageExerciseCard.svelte';
  import LibraryPageMuscleGroupCard from './LibraryPageMuscleGroupCard.svelte';

  let searchQuery = $state('');
  let activeTab = $state('all');
  let expandedIds = new SvelteSet<string>();
  let addMenuOpen = $state(false);

  // --- Derived data from stores ---

  let exercises = $derived(exerciseMapService.getDocs());
  let muscleGroups = $derived(muscleGroupMapService.getDocs());
  let equipmentTypes = $derived(equipmentTypeMapService.getDocs());

  // --- Lookup helpers ---

  function getMuscleGroupName(id: UUID): string {
    const muscleGroup = muscleGroupMapService.getDoc(id);
    return muscleGroup?.name ?? 'Unknown';
  }

  function getEquipmentName(id: UUID): string {
    const equipmentType = equipmentTypeMapService.getDoc(id);
    return equipmentType?.title ?? 'Unknown';
  }

  // --- Search ---

  let normalizedQuery = $derived(searchQuery.trim().toLowerCase());

  function exerciseMatchesSearch(exercise: WorkoutExercise): boolean {
    if (!normalizedQuery) return true;
    const equipmentName = getEquipmentName(exercise.workoutEquipmentTypeId).toLowerCase();
    const primaryNames = exercise.primaryMuscleGroups.map((id) =>
      getMuscleGroupName(id).toLowerCase()
    );
    const secondaryNames = exercise.secondaryMuscleGroups.map((id) =>
      getMuscleGroupName(id).toLowerCase()
    );
    return (
      exercise.exerciseName.toLowerCase().includes(normalizedQuery) ||
      equipmentName.includes(normalizedQuery) ||
      primaryNames.some((name) => name.includes(normalizedQuery)) ||
      secondaryNames.some((name) => name.includes(normalizedQuery))
    );
  }

  let filteredExercises = $derived(exercises.filter(exerciseMatchesSearch));
  let filteredMuscleGroups = $derived(
    muscleGroups.filter((muscleGroup) => {
      if (!normalizedQuery) return true;
      return muscleGroup.name.toLowerCase().includes(normalizedQuery);
    })
  );
  let filteredEquipment = $derived(
    equipmentTypes.filter((equipmentType) => {
      if (!normalizedQuery) return true;
      return equipmentType.title.toLowerCase().includes(normalizedQuery);
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
    if (expandedIds.has(key)) {
      expandedIds.delete(key);
    } else {
      expandedIds.add(key);
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
      <TabsTrigger value="muscle-groups">M.Groups ({filteredMuscleGroups.length})</TabsTrigger>
      <TabsTrigger value="equipment">Equip. ({filteredEquipment.length})</TabsTrigger>
    </TabsList>

    <!-- All -->
    <TabsContent value="all">
      {#if allItems.length > 0}
        <div class="flex flex-col gap-2">
          {#each allItems as item (item.id)}
            {#if item.type === 'exercise'}
              <LibraryPageExerciseCard
                exercise={item.data}
                showTypeLabel={true}
                expanded={expandedIds.has(item.id)}
                onToggle={() => toggleCard(item.id)}
              />
            {:else if item.type === 'muscleGroup'}
              <LibraryPageMuscleGroupCard
                muscleGroup={item.data}
                showTypeLabel={true}
                expanded={expandedIds.has(item.id)}
                onToggle={() => toggleCard(item.id)}
              />
            {:else}
              <LibraryPageEquipmentCard
                equipmentType={item.data}
                showTypeLabel={true}
                expanded={expandedIds.has(item.id)}
                onToggle={() => toggleCard(item.id)}
              />
            {/if}
          {/each}
        </div>
      {:else}
        <LibraryPageEmptyState />
      {/if}
    </TabsContent>

    <!-- Exercises -->
    <TabsContent value="exercises">
      {#if filteredExercises.length > 0}
        <div class="flex flex-col gap-2">
          {#each filteredExercises as exercise (exercise._id)}
            <LibraryPageExerciseCard
              {exercise}
              showTypeLabel={false}
              expanded={expandedIds.has(`exercise-${exercise._id}`)}
              onToggle={() => toggleCard(`exercise-${exercise._id}`)}
            />
          {/each}
        </div>
      {:else}
        <LibraryPageEmptyState />
      {/if}
    </TabsContent>

    <!-- Muscle Groups -->
    <TabsContent value="muscle-groups">
      {#if filteredMuscleGroups.length > 0}
        <div class="flex flex-col gap-2">
          {#each filteredMuscleGroups as muscleGroup (muscleGroup._id)}
            <LibraryPageMuscleGroupCard
              {muscleGroup}
              showTypeLabel={false}
              expanded={expandedIds.has(`muscle-${muscleGroup._id}`)}
              onToggle={() => toggleCard(`muscle-${muscleGroup._id}`)}
            />
          {/each}
        </div>
      {:else}
        <LibraryPageEmptyState />
      {/if}
    </TabsContent>

    <!-- Equipment -->
    <TabsContent value="equipment">
      {#if filteredEquipment.length > 0}
        <div class="flex flex-col gap-2">
          {#each filteredEquipment as equipmentType (equipmentType._id)}
            <LibraryPageEquipmentCard
              {equipmentType}
              showTypeLabel={false}
              expanded={expandedIds.has(`equipment-${equipmentType._id}`)}
              onToggle={() => toggleCard(`equipment-${equipmentType._id}`)}
            />
          {/each}
        </div>
      {:else}
        <LibraryPageEmptyState />
      {/if}
    </TabsContent>
  </Tabs>
</div>
