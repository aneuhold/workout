<!--
  @component

  Hero card state: a mesocycle session is currently in progress.
-->
<script lang="ts">
  import { IconChevronRight } from '@tabler/icons-svelte';
  import { countCompletedSets } from '$components/SessionCard/sessionCardUtils';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import Progress from '$ui/Progress/Progress.svelte';
  import { HeroCardAction, type HeroCardState } from './heroCardUtils';

  let {
    state
  }: {
    state: Extract<HeroCardState, { action: HeroCardAction.ContinueSession }>;
  } = $props();

  const totalSets = $derived(state.sets.length);
  const completed = $derived(countCompletedSets(state.sets));
  const percent = $derived(totalSets > 0 ? Math.round((completed / totalSets) * 100) : 0);
</script>

<Card class="ring-primary/30 ring-2">
  <CardHeader>
    <div class="flex items-center justify-between">
      <span class="text-sm font-semibold">Continue Session</span>
      <Button size="sm" href="/session?sessionId={state.session._id}">
        Continue
        <IconChevronRight size={14} />
      </Button>
    </div>
  </CardHeader>
  <CardContent class="flex flex-col gap-2">
    <span class="text-sm font-medium">{state.session.title}</span>
    <Progress value={percent} max={100} class="h-1.5" />
    <span class="text-xs text-muted-foreground">{completed}/{totalSets} sets completed</span>
  </CardContent>
</Card>
