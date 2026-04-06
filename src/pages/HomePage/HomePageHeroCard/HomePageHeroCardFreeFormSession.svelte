<!--
  @component

  Hero card state: a free-form session is currently in progress.
-->
<script lang="ts">
  import { IconChevronRight } from '@tabler/icons-svelte';
  import { countCompletedSets } from '$components/SessionCard/sessionCardUtils';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import Progress from '$ui/Progress/Progress.svelte';
  import { HeroCardAction, type HeroCardState } from './heroCardUtils';

  let {
    state
  }: {
    state: Extract<HeroCardState, { action: HeroCardAction.FreeFormSession }>;
  } = $props();

  const completed = $derived(countCompletedSets(state.sets));
  const percent = $derived(
    state.sets.length > 0 ? Math.round((completed / state.sets.length) * 100) : 0
  );
</script>

<Card class="ring-1 ring-foreground/10">
  <CardHeader>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold">Free-Form Workout</span>
        <Badge variant="secondary" class="text-xs">In Progress</Badge>
      </div>
      <Button size="sm" href="/session?sessionId={state.session._id}">
        Continue
        <IconChevronRight size={14} />
      </Button>
    </div>
  </CardHeader>
  <CardContent class="flex flex-col gap-2">
    <span class="text-sm font-medium">{state.session.title}</span>
    {#if state.sets.length > 0}
      <Progress value={percent} max={100} class="h-1.5" />
      <span class="text-xs text-muted-foreground">
        {completed}/{state.sets.length} sets · {state.sessionExercises.length} exercises
      </span>
    {:else}
      <span class="text-xs text-muted-foreground">
        {state.sessionExercises.length} exercises · No sets yet
      </span>
    {/if}
  </CardContent>
</Card>
