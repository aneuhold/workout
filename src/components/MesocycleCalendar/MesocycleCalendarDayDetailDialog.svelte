<script lang="ts">
  import Badge from '$ui/Badge/Badge.svelte';
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
</script>

<Dialog bind:open>
  <DialogContent>
    {#if day}
      <DialogHeader>
        <DialogTitle>{formattedDate}</DialogTitle>
        <DialogDescription>{cycleLabel} &mdash; Projected targets</DialogDescription>
      </DialogHeader>

      <div class="space-y-4 max-h-[60vh] overflow-y-auto">
        {#each day.sessions as session, sessionIdx (session.sessionId)}
          {#if sessionIdx > 0}
            <Separator />
          {/if}

          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold">{session.title}</h3>
              {#if session.exercises.length > 0 && session.exercises[0].sets.length > 0}
                {@const firstRir = session.exercises[0].sets[0].plannedRir}
                {#if firstRir !== undefined}
                  <Badge variant="secondary">{firstRir} RIR</Badge>
                {/if}
              {/if}
            </div>

            {#each session.exercises as exercise (exercise.exerciseName)}
              <div class="space-y-1">
                <p class="text-sm font-medium">{exercise.exerciseName}</p>
                <div class="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                  {#each exercise.sets as set (set.setNumber)}
                    <span>S{set.setNumber}</span>
                    <span>{set.plannedReps ?? '—'} reps</span>
                    <span>{set.plannedWeight ?? '—'} lb</span>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </DialogContent>
</Dialog>
