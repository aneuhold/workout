<!--
  @component

  Hero card state: the next session is ready to start (may be on-time or late).
-->
<script lang="ts">
  import { IconChevronRight } from '@tabler/icons-svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import { cn } from '$util/svelte-shadcn-util';
  import { HeroCardAction, type HeroCardState } from './heroCardUtils';

  let {
    state,
    onStartSession
  }: {
    state: Extract<HeroCardState, { action: HeroCardAction.StartSession }>;
    onStartSession: () => void;
  } = $props();

  const daysLate = $derived(state.daysLate);
  const isLate = $derived(daysLate > 0);
  const isSeverelyLate = $derived(daysLate >= 3);
  const lateLabel = $derived(daysLate === 1 ? '1 day late' : `${daysLate} days late`);
  const totalSets = $derived(state.sets.length);

  const scheduledDateFormatted = $derived(
    state.scheduledDate
      ? state.scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : null
  );

  const exerciseBadges = $derived(
    state.sessionExercises.map((se) => ({
      id: se._id,
      name: exerciseMapService.getDoc(se.workoutExerciseId)?.exerciseName ?? 'Unknown'
    }))
  );

  const ringClass = $derived(isLate ? 'ring-amber-500/30 ring-2' : 'ring-primary/30 ring-2');
</script>

<Card class={ringClass}>
  <CardHeader>
    <div class="flex items-center justify-between">
      <span class="text-sm font-semibold">Next Up</span>
      <Button size="sm" onclick={onStartSession}>
        Start Session
        <IconChevronRight size={14} />
      </Button>
    </div>
  </CardHeader>
  <CardContent class="flex flex-col gap-2">
    <span class="text-sm font-medium">{state.session.title}</span>
    {#if isLate}
      <Badge
        variant="outline"
        class={cn(
          isSeverelyLate ? 'border-destructive text-destructive' : 'border-amber-500 text-amber-500'
        )}
      >
        {lateLabel}
      </Badge>
    {/if}
    {#if isLate}
      <div class={cn('text-xs', isSeverelyLate ? 'text-destructive' : 'text-amber-500')}>
        Scheduled for {scheduledDateFormatted} &mdash; {daysLate} day{daysLate === 1 ? '' : 's'} behind
      </div>
    {:else}
      <div class="text-xs text-muted-foreground">
        {state.sessionExercises.length} exercises · {totalSets} sets
      </div>
      <div class="flex flex-wrap gap-1">
        {#each exerciseBadges as { id, name } (id)}
          <Badge variant="outline" class="h-auto whitespace-normal text-xs">{name}</Badge>
        {/each}
      </div>
    {/if}
  </CardContent>
</Card>
