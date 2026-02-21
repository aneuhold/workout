<!--
  @component

  Card for selecting calibrated exercises to include in a mesocycle.
-->
<script lang="ts">
  import { type CalibrationExercisePair } from '@aneuhold/core-ts-db-lib';
  import { IconSearch } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import InputGroupAddon from '$ui/InputGroup/InputGroupAddon.svelte';
  import InputGroupInput from '$ui/InputGroup/InputGroupInput.svelte';
  import InputGroupRoot from '$ui/InputGroup/InputGroupRoot.svelte';
  import Pagination from '$ui/Pagination/Pagination.svelte';
  import PaginationContent from '$ui/Pagination/PaginationContent.svelte';
  import PaginationEllipsis from '$ui/Pagination/PaginationEllipsis.svelte';
  import PaginationItem from '$ui/Pagination/PaginationItem.svelte';
  import PaginationLink from '$ui/Pagination/PaginationLink.svelte';
  import PaginationNext from '$ui/Pagination/PaginationNext.svelte';
  import PaginationPrevious from '$ui/Pagination/PaginationPrevious.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import Switch from '$ui/Switch/Switch.svelte';

  const PAGE_SIZE = 5;

  let {
    calibratedExercisePairs,
    selectedCalibrationIds = $bindable<UUID[]>([]),
    disabled = false
  }: {
    calibratedExercisePairs: CalibrationExercisePair[];
    selectedCalibrationIds: UUID[];
    disabled?: boolean;
  } = $props();

  function toggleCalibration(calibrationId: UUID) {
    if (selectedCalibrationIds.includes(calibrationId)) {
      selectedCalibrationIds = selectedCalibrationIds.filter(
        (existingId) => existingId !== calibrationId
      );
    } else {
      selectedCalibrationIds = [...selectedCalibrationIds, calibrationId];
    }
  }

  let searchQuery = $state('');
  let normalizedQuery = $derived(searchQuery.trim().toLowerCase());
  let currentPage = $state(1);

  function getMuscleGroupNames(pair: CalibrationExercisePair): string[] {
    return pair.exercise.primaryMuscleGroups
      .map((id) => muscleGroupMapService.getDoc(id)?.name)
      .filter((name): name is string => name != null);
  }

  const filteredPairs = $derived.by(() => {
    if (!normalizedQuery) return calibratedExercisePairs;
    return calibratedExercisePairs.filter((pair) => {
      if (pair.exercise.exerciseName.toLowerCase().includes(normalizedQuery)) return true;
      return getMuscleGroupNames(pair).some((name) => name.toLowerCase().includes(normalizedQuery));
    });
  });

  const displayPairs = $derived(
    disabled
      ? calibratedExercisePairs.filter((pair) =>
          selectedCalibrationIds.includes(pair.calibration._id)
        )
      : filteredPairs
  );

  // Reset to page 1 when search changes the result set
  $effect(() => {
    void normalizedQuery;
    currentPage = 1;
  });

  const totalPages = $derived(Math.ceil(displayPairs.length / PAGE_SIZE));
  const showPagination = $derived(totalPages > 1);

  const paginatedPairs = $derived(
    displayPairs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  );
</script>

<Card>
  <CardHeader>
    <CardTitle>Exercises</CardTitle>
    <CardDescription>
      {#if disabled}
        Exercises included in this mesocycle.
      {:else}
        Select calibrated exercises to include. The algorithm distributes them across sessions.
      {/if}
    </CardDescription>
  </CardHeader>
  <CardContent class="flex flex-col gap-4">
    {#if calibratedExercisePairs.length === 0}
      <p class="text-sm text-muted-foreground">
        No calibrated exercises found. Calibrate exercises first to include them in a mesocycle.
      </p>
    {:else}
      {#if !disabled && calibratedExercisePairs.length > 5}
        <InputGroupRoot>
          <InputGroupAddon>
            <IconSearch size={16} />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search exercises..." bind:value={searchQuery} />
        </InputGroupRoot>
      {/if}

      <div class="flex flex-col">
        {#each paginatedPairs as pair, i (pair.calibration._id)}
          {@const isSelected = selectedCalibrationIds.includes(pair.calibration._id)}
          {@const muscleGroups = getMuscleGroupNames(pair)}
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 py-2 text-left {disabled
              ? 'cursor-default opacity-70'
              : ''}"
            {disabled}
            onclick={() => toggleCalibration(pair.calibration._id)}
          >
            <div class="flex min-w-0 flex-1 flex-col gap-1">
              <span class="text-sm leading-snug">{pair.exercise.exerciseName}</span>
              {#if muscleGroups.length > 0}
                <div class="flex flex-wrap gap-1">
                  {#each muscleGroups as group (group)}
                    <Badge variant="secondary" class="px-1.5 py-0 text-[10px]">{group}</Badge>
                  {/each}
                </div>
              {/if}
            </div>
            <div class="pointer-events-none shrink-0">
              <Switch checked={isSelected} {disabled} />
            </div>
          </button>
          {#if i < paginatedPairs.length - 1}
            <Separator />
          {/if}
        {/each}
      </div>

      {#if showPagination}
        <Pagination bind:page={currentPage} count={displayPairs.length} perPage={PAGE_SIZE}>
          {#snippet children({ pages })}
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious />
              </PaginationItem>
              {#each pages as p (p.key)}
                {#if p.type === 'page'}
                  <PaginationItem>
                    <PaginationLink page={p} isActive={currentPage === p.value} />
                  </PaginationItem>
                {:else}
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                {/if}
              {/each}
              <PaginationItem>
                <PaginationNext />
              </PaginationItem>
            </PaginationContent>
          {/snippet}
        </Pagination>
      {/if}

      {#if !disabled && normalizedQuery && displayPairs.length === 0}
        <p class="text-sm text-muted-foreground">No exercises match "{searchQuery.trim()}".</p>
      {/if}

      {#if selectedCalibrationIds.length > 0}
        <p class="text-xs text-muted-foreground">
          {selectedCalibrationIds.length} exercise{selectedCalibrationIds.length !== 1 ? 's' : ''} selected
        </p>
      {/if}
    {/if}
  </CardContent>
</Card>
