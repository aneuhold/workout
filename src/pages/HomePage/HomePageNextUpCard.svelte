<!--
  @component

  Hero card showing the in-progress or next-up session at the top of the home page.
-->
<script lang="ts">
  import type {
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import { IconChevronRight } from '@tabler/icons-svelte';
  import { countCompletedSets } from '$components/SessionCard/sessionCardUtils';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import Progress from '$ui/Progress/Progress.svelte';

  let {
    session,
    isInProgress,
    sessionExercises,
    sets
  }: {
    session: WorkoutSession;
    isInProgress: boolean;
    sessionExercises: WorkoutSessionExercise[];
    sets: WorkoutSet[];
  } = $props();

  const totalSets = $derived(sets.length);
  const completed = $derived(countCompletedSets(sets));
  const percent = $derived(totalSets > 0 ? Math.round((completed / totalSets) * 100) : 0);

  const exerciseNames = $derived(
    sessionExercises.map((se) => {
      const exercise = exerciseMapService.getDoc(se.workoutExerciseId);
      return exercise?.exerciseName ?? 'Unknown';
    })
  );
</script>

<Card class="ring-primary/30 ring-2">
  <CardHeader>
    <div class="flex items-center justify-between">
      <span class="text-sm font-semibold">
        {isInProgress ? 'Continue Session' : 'Next Up'}
      </span>
      <Button size="sm" href="/session?sessionId={session._id}">
        {isInProgress ? 'Continue' : 'Start Session'}
        <IconChevronRight size={14} />
      </Button>
    </div>
  </CardHeader>
  <CardContent class="flex flex-col gap-2">
    <span class="text-sm font-medium">{session.title}</span>
    {#if isInProgress}
      <Progress value={percent} max={100} class="h-1.5" />
      <span class="text-xs text-muted-foreground">{completed}/{totalSets} sets completed</span>
    {:else}
      <div class="text-xs text-muted-foreground">
        {sessionExercises.length} exercises · {totalSets} sets
      </div>
      <div class="flex flex-wrap gap-1">
        {#each exerciseNames as name (name)}
          <Badge variant="outline" class="text-xs">{name}</Badge>
        {/each}
      </div>
    {/if}
  </CardContent>
</Card>
