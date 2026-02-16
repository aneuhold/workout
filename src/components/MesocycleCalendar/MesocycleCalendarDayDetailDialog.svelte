<script lang="ts">
  import { IconExternalLink } from '@tabler/icons-svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Dialog from '$ui/Dialog/Dialog.svelte';
  import DialogContent from '$ui/Dialog/DialogContent.svelte';
  import DialogDescription from '$ui/Dialog/DialogDescription.svelte';
  import DialogHeader from '$ui/Dialog/DialogHeader.svelte';
  import DialogTitle from '$ui/Dialog/DialogTitle.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import type { MesocycleCalendarDayCell } from './mesocycleCalendarTypes';

  let {
    day,
    open = $bindable(false),
    totalCycles
  }: {
    day: MesocycleCalendarDayCell | null;
    open: boolean;
    totalCycles: number;
  } = $props();

  const formattedDate = $derived(
    day
      ? day.date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      : ''
  );

  const cycleLabel = $derived(
    day ? (day.isDeload ? 'Deload' : `Cycle ${day.cycleNumber} of ${totalCycles}`) : ''
  );

  const subtitle = $derived(() => {
    if (!day) return '';
    const sessions = day.sessions;
    if (sessions.length === 0) return '';
    const allCompleted = sessions.every((s) => s.completed);
    const allIncomplete = sessions.every((s) => !s.completed);
    if (allCompleted) return 'Completed';
    if (allIncomplete) return 'Projected targets';
    return 'Session details';
  });
</script>

<Dialog bind:open>
  <DialogContent>
    {#if day}
      <DialogHeader>
        <DialogTitle>{formattedDate}</DialogTitle>
        <DialogDescription>{cycleLabel} &mdash; {subtitle()}</DialogDescription>
      </DialogHeader>

      <div class="space-y-4 max-h-[60vh] overflow-y-auto">
        {#each day.sessions as session, sessionIdx (session.sessionId)}
          {#if sessionIdx > 0}
            <Separator />
          {/if}

          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold">{session.title}</h3>
              {#if session.completed}
                <Badge>Completed</Badge>
              {:else if session.exercises.length > 0 && session.exercises[0].sets.length > 0}
                {@const firstRir = session.exercises[0].sets[0].plannedRir}
                {#if firstRir != null}
                  <Badge variant="secondary">{firstRir} RIR</Badge>
                {/if}
              {/if}
              {#if session.completed}
                <div class="ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    href={`/session?sessionId=${session.sessionId}`}
                  >
                    View Session
                    <IconExternalLink data-icon="inline-end" />
                  </Button>
                </div>
              {/if}
            </div>

            {#each session.exercises as exercise (exercise.exerciseName)}
              <div class="space-y-1">
                <p class="text-sm font-medium">{exercise.exerciseName}</p>
                {#if session.completed}
                  <div class="grid grid-cols-4 gap-1 text-xs">
                    {#each exercise.sets as set (set.setNumber)}
                      <span class="text-muted-foreground">S{set.setNumber}</span>
                      <span>{set.actualReps ?? '—'} reps</span>
                      <span>{set.actualWeight ?? '—'} lb</span>
                      <span>{set.actualRir ?? '—'} RIR</span>
                      <span></span>
                      <span class="text-muted-foreground text-[0.65rem]"
                        >plan: {set.plannedReps ?? '—'} reps</span
                      >
                      <span class="text-muted-foreground text-[0.65rem]"
                        >{set.plannedWeight ?? '—'} lb</span
                      >
                      <span class="text-muted-foreground text-[0.65rem]"
                        >{set.plannedRir ?? '—'} RIR</span
                      >
                    {/each}
                  </div>
                {:else}
                  <div class="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                    {#each exercise.sets as set (set.setNumber)}
                      <span>S{set.setNumber}</span>
                      <span>{set.plannedReps ?? '—'} reps</span>
                      <span>{set.plannedWeight ?? '—'} lb</span>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </DialogContent>
</Dialog>
