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
  import { goto } from '$app/navigation';
  import { calibrationFormDialog } from '$components/singletons/dialogs/SingletonCalibrationFormDialog/SingletonCalibrationFormDialog.svelte';
  import SingletonCalibrationFormDialog from '$components/singletons/dialogs/SingletonCalibrationFormDialog/SingletonCalibrationFormDialog.svelte';
  import { deleteDialog } from '$components/singletons/dialogs/SingletonDeleteDialog/SingletonDeleteDialog.svelte';
  import SingletonDeleteDialog from '$components/singletons/dialogs/SingletonDeleteDialog/SingletonDeleteDialog.svelte';
  import { equipmentFormDialog } from '$components/singletons/dialogs/SingletonEquipmentFormDialog/SingletonEquipmentFormDialog.svelte';
  import SingletonEquipmentFormDialog from '$components/singletons/dialogs/SingletonEquipmentFormDialog/SingletonEquipmentFormDialog.svelte';
  import { muscleGroupFormDialog } from '$components/singletons/dialogs/SingletonMuscleGroupFormDialog/SingletonMuscleGroupFormDialog.svelte';
  import SingletonMuscleGroupFormDialog from '$components/singletons/dialogs/SingletonMuscleGroupFormDialog/SingletonMuscleGroupFormDialog.svelte';
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import Button from '$ui/Button/Button.svelte';
  import DropdownMenu from '$ui/DropdownMenu/DropdownMenu.svelte';
  import DropdownMenuContent from '$ui/DropdownMenu/DropdownMenuContent.svelte';
  import DropdownMenuItem from '$ui/DropdownMenu/DropdownMenuItem.svelte';
  import DropdownMenuTrigger from '$ui/DropdownMenu/DropdownMenuTrigger.svelte';
  import InputGroupAddon from '$ui/InputGroup/InputGroupAddon.svelte';
  import InputGroupInput from '$ui/InputGroup/InputGroupInput.svelte';
  import InputGroupRoot from '$ui/InputGroup/InputGroupRoot.svelte';
  import Tabs from '$ui/Tabs/Tabs.svelte';
  import TabsContent from '$ui/Tabs/TabsContent.svelte';
  import TabsList from '$ui/Tabs/TabsList.svelte';
  import TabsTrigger from '$ui/Tabs/TabsTrigger.svelte';
  import { WorkoutDocumentType } from '$util/WorkoutDocumentType';
  import LibraryPageEmptyState from './LibraryPageEmptyState.svelte';
  import LibraryPageEquipmentCard from './LibraryPageEquipmentCard.svelte';
  import LibraryPageExerciseCard from './LibraryPageExerciseCard.svelte';
  import LibraryPageMuscleGroupCard from './LibraryPageMuscleGroupCard.svelte';
  import LibraryPageMuscleOrExerciseMissingDialog from './LibraryPageMuscleOrExerciseMissingDialog.svelte';

  let {
    initialTab = null
  }: {
    initialTab?: string | null;
  } = $props();

  enum LibraryTab {
    All = 'all',
    Exercise = WorkoutDocumentType.Exercise,
    MuscleGroup = WorkoutDocumentType.MuscleGroup,
    Equipment = WorkoutDocumentType.Equipment
  }

  function parseLibraryTab(value: string | null): LibraryTab {
    if (value && Object.values(LibraryTab).includes(value as LibraryTab)) {
      return value as LibraryTab;
    }
    return LibraryTab.All;
  }

  let searchQuery = $state('');
  let activeTab = $derived(parseLibraryTab(initialTab));

  // Sync active tab with URL query parameter
  $effect(() => {
    const tab = activeTab;
    const params = tab === LibraryTab.All ? '' : `?tab=${tab}`;
    history.replaceState(history.state, '', `/library${params}`);
  });

  let expandedIds = new SvelteSet<UUID>();
  let addMenuOpen = $state(false);

  // --- Derived data from stores ---

  let exercises = $derived(exerciseMapService.getDocs());
  let muscleGroups = $derived(muscleGroupMapService.getDocs());
  let equipmentTypes = $derived(equipmentTypeMapService.getDocs());

  // --- Lookup helpers ---

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
      muscleGroupMapService.getMuscleGroupName(id).toLowerCase()
    );
    const secondaryNames = exercise.secondaryMuscleGroups.map((id) =>
      muscleGroupMapService.getMuscleGroupName(id).toLowerCase()
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
    | {
        type: WorkoutDocumentType.Exercise;
        id: UUID;
        name: string;
        data: WorkoutExercise;
      }
    | {
        type: WorkoutDocumentType.MuscleGroup;
        id: UUID;
        name: string;
        data: WorkoutMuscleGroup;
      }
    | {
        type: WorkoutDocumentType.Equipment;
        id: UUID;
        name: string;
        data: WorkoutEquipmentType;
      };

  let allItems = $derived.by(() => {
    const items: AllItem[] = [
      ...filteredExercises.map((exercise) => ({
        type: WorkoutDocumentType.Exercise as const,
        id: exercise._id,
        name: exercise.exerciseName,
        data: exercise
      })),
      ...filteredMuscleGroups.map((muscleGroup) => ({
        type: WorkoutDocumentType.MuscleGroup as const,
        id: muscleGroup._id,
        name: muscleGroup.name,
        data: muscleGroup
      })),
      ...filteredEquipment.map((equipmentType) => ({
        type: WorkoutDocumentType.Equipment as const,
        id: equipmentType._id,
        name: equipmentType.title,
        data: equipmentType
      }))
    ];
    return items.sort((a, b) => a.name.localeCompare(b.name));
  });

  // --- Expand / collapse ---

  function toggleCard(id: UUID) {
    if (expandedIds.has(id)) {
      expandedIds.delete(id);
    } else {
      expandedIds.add(id);
    }
  }

  // --- Add button label ---

  let addButtonLabel = $derived(
    activeTab === LibraryTab.Exercise
      ? 'Exercise'
      : activeTab === LibraryTab.MuscleGroup
        ? 'Muscle Group'
        : activeTab === LibraryTab.Equipment
          ? 'Equipment'
          : ''
  );

  function handleTabAdd() {
    switch (activeTab) {
      case LibraryTab.Exercise:
        handleAddExercise();
        break;
      case LibraryTab.MuscleGroup:
        muscleGroupFormDialog.openNew();
        break;
      case LibraryTab.Equipment:
        equipmentFormDialog.openNew();
        break;
    }
  }

  // --- Exercise prerequisite check ---

  let prerequisiteDialogOpen = $state(false);
  let missingEquipment = $derived(equipmentTypes.length === 0);
  let missingMuscleGroups = $derived(muscleGroups.length === 0);

  function handleAddExercise() {
    if (missingEquipment || missingMuscleGroups) {
      prerequisiteDialogOpen = true;
    } else {
      goto('/exercise/new');
    }
  }
</script>

<div class="flex flex-col gap-4 p-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-semibold">Library</h1>
    {#if activeTab === LibraryTab.All}
      <DropdownMenu bind:open={addMenuOpen}>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button {...props} size="sm">
              <IconPlus size={14} />
              Add
            </Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onclick={handleAddExercise}>Exercise</DropdownMenuItem>
          <DropdownMenuItem onclick={() => muscleGroupFormDialog.openNew()}
            >Muscle Group</DropdownMenuItem
          >
          <DropdownMenuItem onclick={() => equipmentFormDialog.openNew()}
            >Equipment</DropdownMenuItem
          >
        </DropdownMenuContent>
      </DropdownMenu>
    {:else}
      <Button size="sm" onclick={handleTabAdd}>
        <IconPlus size={14} />
        Add {addButtonLabel}
      </Button>
    {/if}
  </div>

  <!-- Search -->
  <InputGroupRoot>
    <InputGroupAddon>
      <IconSearch size={16} />
    </InputGroupAddon>
    <InputGroupInput placeholder="Search library..." bind:value={searchQuery} />
  </InputGroupRoot>

  <!-- Tabs -->
  <Tabs bind:value={activeTab}>
    <TabsList class="w-full">
      <TabsTrigger value={LibraryTab.All}>All</TabsTrigger>
      <TabsTrigger value={LibraryTab.Exercise}>Exercises ({filteredExercises.length})</TabsTrigger>
      <TabsTrigger value={LibraryTab.MuscleGroup}
        >M.Groups ({filteredMuscleGroups.length})</TabsTrigger
      >
      <TabsTrigger value={LibraryTab.Equipment}>Equip. ({filteredEquipment.length})</TabsTrigger>
    </TabsList>

    <!-- All -->
    <TabsContent value={LibraryTab.All}>
      {#if allItems.length > 0}
        <div class="flex flex-col gap-2">
          {#each allItems as item (item.id)}
            {#if item.type === WorkoutDocumentType.Exercise}
              <LibraryPageExerciseCard
                exercise={item.data}
                showTypeLabel={true}
                expanded={expandedIds.has(item.id)}
                onToggle={() => toggleCard(item.id)}
                onEdit={() => goto(`/exercise?exerciseId=${item.data._id}`)}
                onDelete={() =>
                  deleteDialog.open(
                    item.data.exerciseName,
                    WorkoutDocumentType.Exercise,
                    item.data._id
                  )}
                onAddCalibration={() => calibrationFormDialog.open(item.data)}
              />
            {:else if item.type === WorkoutDocumentType.MuscleGroup}
              <LibraryPageMuscleGroupCard
                muscleGroup={item.data}
                showTypeLabel={true}
                expanded={expandedIds.has(item.id)}
                onToggle={() => toggleCard(item.id)}
                onEdit={() => muscleGroupFormDialog.openEdit(item.data)}
                onDelete={() =>
                  deleteDialog.open(item.data.name, WorkoutDocumentType.MuscleGroup, item.data._id)}
                onExerciseClick={(id) => goto(`/exercise?exerciseId=${id}`)}
              />
            {:else}
              <LibraryPageEquipmentCard
                equipmentType={item.data}
                showTypeLabel={true}
                expanded={expandedIds.has(item.id)}
                onToggle={() => toggleCard(item.id)}
                onEdit={() => equipmentFormDialog.openEdit(item.data)}
                onDelete={() =>
                  deleteDialog.open(item.data.title, WorkoutDocumentType.Equipment, item.data._id)}
                onExerciseClick={(id) => goto(`/exercise?exerciseId=${id}`)}
              />
            {/if}
          {/each}
        </div>
      {:else}
        <LibraryPageEmptyState />
      {/if}
    </TabsContent>

    <!-- Exercises -->
    <TabsContent value={LibraryTab.Exercise}>
      {#if filteredExercises.length > 0}
        <div class="flex flex-col gap-2">
          {#each filteredExercises as exercise (exercise._id)}
            <LibraryPageExerciseCard
              {exercise}
              showTypeLabel={false}
              expanded={expandedIds.has(exercise._id)}
              onToggle={() => toggleCard(exercise._id)}
              onEdit={() => goto(`/exercise?exerciseId=${exercise._id}`)}
              onDelete={() =>
                deleteDialog.open(
                  exercise.exerciseName,
                  WorkoutDocumentType.Exercise,
                  exercise._id
                )}
              onAddCalibration={() => calibrationFormDialog.open(exercise)}
            />
          {/each}
        </div>
      {:else}
        <LibraryPageEmptyState />
      {/if}
    </TabsContent>

    <!-- Muscle Groups -->
    <TabsContent value={LibraryTab.MuscleGroup}>
      {#if filteredMuscleGroups.length > 0}
        <div class="flex flex-col gap-2">
          {#each filteredMuscleGroups as muscleGroup (muscleGroup._id)}
            <LibraryPageMuscleGroupCard
              {muscleGroup}
              showTypeLabel={false}
              expanded={expandedIds.has(muscleGroup._id)}
              onToggle={() => toggleCard(muscleGroup._id)}
              onEdit={() => muscleGroupFormDialog.openEdit(muscleGroup)}
              onDelete={() =>
                deleteDialog.open(
                  muscleGroup.name,
                  WorkoutDocumentType.MuscleGroup,
                  muscleGroup._id
                )}
              onExerciseClick={(id) => goto(`/exercise?exerciseId=${id}`)}
            />
          {/each}
        </div>
      {:else}
        <LibraryPageEmptyState />
      {/if}
    </TabsContent>

    <!-- Equipment -->
    <TabsContent value={LibraryTab.Equipment}>
      {#if filteredEquipment.length > 0}
        <div class="flex flex-col gap-2">
          {#each filteredEquipment as equipmentType (equipmentType._id)}
            <LibraryPageEquipmentCard
              {equipmentType}
              showTypeLabel={false}
              expanded={expandedIds.has(equipmentType._id)}
              onToggle={() => toggleCard(equipmentType._id)}
              onEdit={() => equipmentFormDialog.openEdit(equipmentType)}
              onDelete={() =>
                deleteDialog.open(
                  equipmentType.title,
                  WorkoutDocumentType.Equipment,
                  equipmentType._id
                )}
              onExerciseClick={(id) => goto(`/exercise?exerciseId=${id}`)}
            />
          {/each}
        </div>
      {:else}
        <LibraryPageEmptyState />
      {/if}
    </TabsContent>
  </Tabs>
</div>

<SingletonDeleteDialog />
<SingletonMuscleGroupFormDialog />
<SingletonEquipmentFormDialog />
<SingletonCalibrationFormDialog />

<LibraryPageMuscleOrExerciseMissingDialog
  bind:open={prerequisiteDialogOpen}
  {missingEquipment}
  {missingMuscleGroups}
/>
