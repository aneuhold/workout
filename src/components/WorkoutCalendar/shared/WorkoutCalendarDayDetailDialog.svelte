<!--
  @component

  Shared detail dialog for both WorkoutMesocycleCalendar and WorkoutSessionCalendar.
  Shows workout session details (exercises and sets) for a selected calendar day.
-->
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
  import type { WorkoutCalendarSession } from './workoutCalendarTypes';

  let {
    formattedDate,
    description,
    sessions,
    showSourceLabels = false,
    open = $bindable(false)
  }: {
    /** Formatted date string for the dialog title (e.g. "Monday, March 29, 2026"). */
    formattedDate: string;
    /** Two-part subtitle rendered as "{primary} — {secondary}" with distinct styling. */
    description: { primary: string; secondary: string };
    /** Sessions to display in the detail view. */
    sessions: WorkoutCalendarSession[];
    /**
     * When true, renders a "Free Form" badge next to the title of any session with
     * `isFreeForm: true`. WorkoutSessionCalendar passes true; WorkoutMesocycleCalendar
     * passes false (all its sessions are mesocycle sessions, so the label would be noise).
     */
    showSourceLabels?: boolean;
    /** Controls dialog open state. */
    open: boolean;
  } = $props();
</script>

<Dialog bind:open>
  <DialogContent>
    {#if formattedDate}
      <DialogHeader>
        <DialogTitle>{formattedDate}</DialogTitle>
        <DialogDescription>
          <span>{description.primary}</span>
          &mdash;
          <span class="text-muted-foreground">{description.secondary}</span>
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 max-h-[60vh] overflow-y-auto">
        {#each sessions as session, sessionIdx (session.sessionId)}
          {#if sessionIdx > 0}
            <Separator />
          {/if}

          <div class="space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm font-semibold">{session.title}</h3>
                {#if showSourceLabels && session.isFreeForm}
                  <Badge
                    variant="secondary"
                    class="bg-violet-500/20 text-violet-700 dark:text-violet-300">Free Form</Badge
                  >
                {/if}
                {#if session.completed}
                  <Badge>Completed</Badge>
                {:else if session.exercises.length > 0 && session.exercises[0].sets.length > 0}
                  {@const firstRir = session.exercises[0].sets[0].plannedRir}
                  {#if firstRir != null}
                    <Badge variant="secondary">{firstRir} RIR</Badge>
                  {/if}
                {/if}
              </div>
              <Button variant="ghost" size="sm" href={`/session?sessionId=${session.sessionId}`}>
                View Session
                <IconExternalLink data-icon="inline-end" />
              </Button>
            </div>

            {#each session.exercises as exercise (exercise.exerciseName)}
              <div class="space-y-1">
                <p class="text-sm font-medium">
                  {exercise.exerciseName}
                  {#if exercise.isRecoveryExercise}
                    <span class="text-xs font-normal text-amber-600 dark:text-amber-400"
                      >Recovery</span
                    >
                  {/if}
                </p>
                {#if session.completed}
                  <div class="grid grid-cols-4 gap-1 text-xs">
                    {#each exercise.sets as set, setIdx (setIdx)}
                      <span class="text-muted-foreground">S{setIdx + 1}</span>
                      <span>{set.actualReps ?? '—'} reps</span>
                      <span>{set.actualWeight ?? '—'} lb</span>
                      <span>{set.rir ?? '—'} RIR</span>
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
                    {#each exercise.sets as set, setIdx (setIdx)}
                      <span>S{setIdx + 1}</span>
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
