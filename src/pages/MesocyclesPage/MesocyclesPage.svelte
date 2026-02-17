<!--
  @component

  Main mesocycles page showing the active mesocycle with a calendar grid and
  progress bar, plus a list of past completed mesocycles.
-->
<script lang="ts">
  import { IconPlus } from '@tabler/icons-svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import Button from '$ui/Button/Button.svelte';
  import MesocyclesPageCurrentCard from './MesocyclesPageCurrentCard.svelte';
  import MesocyclesPageEmptyState from './MesocyclesPageEmptyState.svelte';
  import MesocyclesPagePastCard from './MesocyclesPagePastCard.svelte';

  const currentMesocycle = $derived(mesocycleMapService.getActiveMesocycle());
  const pastMesocycles = $derived(mesocycleMapService.getPastMesocycles());
  const allExercises = $derived(exerciseMapService.getDocs());

  const currentDocs = $derived(
    currentMesocycle
      ? mesocycleMapService.getAssociatedDocsForMesocycle(currentMesocycle._id)
      : null
  );
</script>

<div class="flex flex-col gap-4 p-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-semibold">Mesocycles</h1>
    <Button size="sm">
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
  {:else if pastMesocycles.length === 0}
    <MesocyclesPageEmptyState />
  {/if}

  <!-- Past mesocycles -->
  {#if pastMesocycles.length > 0}
    <div class="flex flex-col gap-2">
      <h2 class="text-sm font-medium text-muted-foreground">Past Mesocycles</h2>
      {#each pastMesocycles as past (past._id)}
        {@const pastDocs = mesocycleMapService.getAssociatedDocsForMesocycle(past._id)}
        <MesocyclesPagePastCard
          mesocycle={past}
          sortedMicrocycles={pastDocs.microcycles}
          sessions={pastDocs.sessions}
        />
      {/each}
    </div>
  {/if}
</div>
