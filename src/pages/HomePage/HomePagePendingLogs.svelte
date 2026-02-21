<!--
  @component

  Section showing completed sessions that still need exercise review.
-->
<script lang="ts">
  import { WorkoutSessionExerciseService } from '@aneuhold/core-ts-db-lib';
  import { IconChevronRight, IconClock } from '@tabler/icons-svelte';
  import sessionExerciseMapService from '$services/documentMapServices/sessionExerciseMapService.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import type { HomePageSessionBundle } from './homePageUtils';

  let { pendingLogs }: { pendingLogs: HomePageSessionBundle[] } = $props();

  const fmt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  });

  function reviewCount(bundle: HomePageSessionBundle): number {
    return bundle.sessionExercises.filter((se) => {
      const seSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
      return !WorkoutSessionExerciseService.hasAllSessionMetricsFilled(se, seSets);
    }).length;
  }
</script>

<Card>
  <CardHeader>
    <div class="flex items-center gap-2">
      <IconClock size={16} class="text-amber-500" />
      <span class="text-sm font-semibold text-amber-500">Pending Logs</span>
    </div>
  </CardHeader>
  <CardContent class="flex flex-col gap-1">
    {#each pendingLogs as bundle (bundle.session._id)}
      <a
        href="/session?sessionId={bundle.session._id}"
        class="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
      >
        <div class="min-w-0 flex-1">
          <span class="truncate text-sm font-medium">{bundle.session.title}</span>
          <div class="text-xs text-muted-foreground">
            {fmt.format(new Date(bundle.session.startTime))} · {reviewCount(bundle)} exercises need review
          </div>
        </div>
        <IconChevronRight size={14} class="shrink-0 text-muted-foreground" />
      </a>
    {/each}
  </CardContent>
</Card>
