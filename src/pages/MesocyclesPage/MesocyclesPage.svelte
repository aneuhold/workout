<!--
  @component

  Main mesocycles page showing the active mesocycle with a calendar grid and
  progress bar, plus lists of future and past mesocycles.
-->
<script lang="ts">
  import { IconPlus } from '@tabler/icons-svelte';
  import { goto } from '$app/navigation';
  import StaggerItem from '$components/StaggerItem/StaggerItem.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import Button from '$ui/Button/Button.svelte';
  import MesocyclesPageCurrentCard from './MesocyclesPageCurrentCard.svelte';
  import MesocyclesPageEmptyState from './MesocyclesPageEmptyState.svelte';
  import MesocyclesPageMesoCard from './MesocyclesPageMesoCard.svelte';

  const {
    active: currentMesocycle,
    past: pastMesocycles,
    future: futureMesocycles
  } = $derived(mesocycleMapService.categorizedMesocycles);
  const allExercises = $derived(exerciseMapService.allDocs);

  const currentDocs = $derived(
    currentMesocycle
      ? mesocycleMapService.getAssociatedDocsAndCTOsForMesocycle(currentMesocycle._id)
      : null
  );
</script>

<div class="flex flex-col gap-4 p-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-semibold">Mesocycles</h1>
    <Button size="sm" onclick={() => goto('/mesocycle/new')}>
      <IconPlus size={14} />
      New
    </Button>
  </div>

  <!-- Current mesocycle or empty state -->
  {#if currentMesocycle && currentDocs}
    <MesocyclesPageCurrentCard
      mesocycle={currentMesocycle}
      sortedMicrocycles={currentDocs.microcycles}
      sessions={currentDocs.sessions}
      sessionExercises={currentDocs.sessionExercises}
      sets={currentDocs.sets}
      exercises={allExercises}
    />
  {:else if futureMesocycles.length === 0 && pastMesocycles.length === 0}
    <MesocyclesPageEmptyState />
  {/if}

  <!-- Future mesocycles -->
  {#if futureMesocycles.length > 0}
    <div class="flex flex-col gap-2">
      <h2 class="text-sm font-medium text-muted-foreground">Future Mesocycles</h2>
      {#each futureMesocycles as future, i (future._id)}
        {@const futureDocs = mesocycleMapService.getAssociatedDocsAndCTOsForMesocycle(future._id)}
        <StaggerItem index={i}>
          <MesocyclesPageMesoCard
            mesocycle={future}
            sortedMicrocycles={futureDocs.microcycles}
            sessions={futureDocs.sessions}
            variant="future"
          />
        </StaggerItem>
      {/each}
    </div>
  {/if}

  <!-- Past mesocycles -->
  {#if pastMesocycles.length > 0}
    <div class="flex flex-col gap-2">
      <h2 class="text-sm font-medium text-muted-foreground">Past Mesocycles</h2>
      {#each pastMesocycles as past, i (past._id)}
        {@const pastDocs = mesocycleMapService.getAssociatedDocsAndCTOsForMesocycle(past._id)}
        <StaggerItem index={i}>
          <MesocyclesPageMesoCard
            mesocycle={past}
            sortedMicrocycles={pastDocs.microcycles}
            sessions={pastDocs.sessions}
          />
        </StaggerItem>
      {/each}
    </div>
  {/if}
</div>
