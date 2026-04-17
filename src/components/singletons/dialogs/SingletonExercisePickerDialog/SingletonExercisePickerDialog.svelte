<!--
  @component

  Singleton dialog for picking exercises from the user's exercise library.
  Import `exercisePickerDialog` and call `.open()` to trigger.
  Returns an ordered array of exercise IDs on confirm.
-->
<script lang="ts" module>
  import type { UUID } from 'crypto';

  let open = $state(false);
  let searchQuery = $state('');
  let selectedExerciseIds = $state<UUID[]>([]);
  let excludeExerciseIds = $state<Set<UUID>>(new Set());
  let onConfirm = $state<((exerciseIds: UUID[]) => void) | null>(null);

  export const exercisePickerDialog = {
    /**
     * Opens the exercise picker dialog.
     *
     * @param params The dialog parameters
     * @param params.excludeExerciseIds Exercise IDs to hide from the list (e.g. already in the session)
     * @param params.onConfirm Called with the ordered array of selected exercise IDs
     */
    open: (params: { excludeExerciseIds?: UUID[]; onConfirm: (exerciseIds: UUID[]) => void }) => {
      onConfirm = params.onConfirm;
      excludeExerciseIds = new Set(params.excludeExerciseIds ?? []);
      selectedExerciseIds = [];
      searchQuery = '';
      open = true;
    }
  };
</script>

<script lang="ts">
  import { IconPlus, IconSearch, IconX } from '@tabler/icons-svelte';
  import { goto } from '$app/navigation';
  import CircleWithText from '$components/CircleWithText/CircleWithText.svelte';
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Dialog from '$ui/Dialog/Dialog.svelte';
  import DialogContent from '$ui/Dialog/DialogContent.svelte';
  import DialogFooter from '$ui/Dialog/DialogFooter.svelte';
  import DialogHeader from '$ui/Dialog/DialogHeader.svelte';
  import DialogTitle from '$ui/Dialog/DialogTitle.svelte';
  import InputGroupAddon from '$ui/InputGroup/InputGroupAddon.svelte';
  import InputGroupButton from '$ui/InputGroup/InputGroupButton.svelte';
  import InputGroupInput from '$ui/InputGroup/InputGroupInput.svelte';
  import InputGroupRoot from '$ui/InputGroup/InputGroupRoot.svelte';
  import { cn } from '$util/svelte-shadcn-util';

  let exercises = $derived(
    exerciseMapService.allDocs.filter((e) => !excludeExerciseIds.has(e._id))
  );

  let filteredExercises = $derived.by(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return exercises;
    return exercises.filter((e) => {
      const exerciseName = e.exerciseName.toLowerCase();
      if (exerciseName.includes(query)) return true;
      const equipmentType = equipmentTypeMapService.getDoc(e.workoutEquipmentTypeId);
      if (equipmentType?.title.toLowerCase().includes(query)) return true;
      const muscleNames = muscleGroupMapService.getMuscleGroupNames([
        ...e.primaryMuscleGroups,
        ...e.secondaryMuscleGroups
      ]);
      return muscleNames.some((n) => n.toLowerCase().includes(query));
    });
  });

  function getSelectionIndex(exerciseId: UUID): number {
    return selectedExerciseIds.indexOf(exerciseId);
  }

  function toggleExercise(exerciseId: UUID) {
    const index = selectedExerciseIds.indexOf(exerciseId);
    if (index >= 0) {
      selectedExerciseIds = selectedExerciseIds.filter((id) => id !== exerciseId);
    } else {
      selectedExerciseIds = [...selectedExerciseIds, exerciseId];
    }
  }

  function handleConfirm() {
    onConfirm?.(selectedExerciseIds);
    open = false;
  }

  function handleCancel() {
    open = false;
  }

  async function handleNewExercise() {
    open = false;
    await goto('/exercise/new');
  }
</script>

<Dialog bind:open>
  <DialogContent class="flex max-h-[85vh] flex-col sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>Add Exercises</DialogTitle>
    </DialogHeader>

    <InputGroupRoot>
      <InputGroupAddon>
        <IconSearch size={16} />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search exercises..." bind:value={searchQuery} />
      {#if searchQuery}
        <InputGroupAddon align="inline-end">
          <InputGroupButton onclick={() => (searchQuery = '')}>
            <IconX size={16} />
          </InputGroupButton>
        </InputGroupAddon>
      {/if}
    </InputGroupRoot>

    {#if selectedExerciseIds.length > 0}
      <p class="text-xs text-muted-foreground">
        {selectedExerciseIds.length} selected
      </p>
    {/if}

    <div class="flex-1 overflow-y-auto -mx-6 px-6">
      {#if filteredExercises.length === 0}
        <p class="py-8 text-center text-sm text-muted-foreground">
          {exercises.length === 0
            ? 'No exercises in your library.'
            : 'No exercises match your search.'}
        </p>
      {:else}
        <div class="flex flex-col gap-1">
          {#each filteredExercises as exercise (exercise._id)}
            {@const selectionIndex = getSelectionIndex(exercise._id)}
            {@const isSelected = selectionIndex >= 0}
            {@const equipmentType = equipmentTypeMapService.getDoc(exercise.workoutEquipmentTypeId)}
            <button
              class={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted/50'
              )}
              onclick={() => toggleExercise(exercise._id)}
            >
              <div class="flex w-6 shrink-0 items-center justify-center">
                {#if isSelected}
                  <CircleWithText text={selectionIndex + 1} />
                {/if}
              </div>

              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <span class="text-sm font-medium">{exercise.exerciseName}</span>
                <div class="flex flex-wrap gap-1">
                  {#if equipmentType}
                    <Badge variant="outline" class="text-xs">{equipmentType.title}</Badge>
                  {/if}
                  {#each exercise.primaryMuscleGroups as muscleGroupId (muscleGroupId)}
                    <Badge variant="secondary" class="text-xs">
                      {muscleGroupMapService.getMuscleGroupName(muscleGroupId)}
                    </Badge>
                  {/each}
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <DialogFooter>
      <Button variant="outline" onclick={handleNewExercise}>
        <IconPlus size={16} />
        New Exercise
      </Button>
      <Button variant="outline" onclick={handleCancel}>Cancel</Button>
      <Button disabled={selectedExerciseIds.length === 0} onclick={handleConfirm}>
        Add {selectedExerciseIds.length || ''} Exercise{selectedExerciseIds.length !== 1 ? 's' : ''}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
