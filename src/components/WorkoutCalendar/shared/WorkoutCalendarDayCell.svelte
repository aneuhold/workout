<!--
  @component

  Generic day cell used by all workout calendar views. Renders the date label,
  session indicator dots/checkmarks, and an optional left accent border.
  The parent calendar is responsible for computing the correct `visual` variant
  and `isClickable` flag.
-->
<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const workoutCalendarDayCellVariants = tv({
    base: 'relative flex flex-col items-center rounded-md p-1 min-h-12 text-xs transition-colors',
    variants: {
      visual: {
        completed: 'bg-muted/50 text-muted-foreground',
        today: 'bg-primary/10 ring-2 ring-primary',
        session: 'bg-primary/10 ring-1 ring-primary/40',
        rest: 'bg-muted/40 text-muted-foreground',
        empty: 'bg-muted/20 text-muted-foreground',
        'outside-month': 'opacity-30'
      },
      accentLeft: {
        true: 'border-l-2 border-l-primary rounded-l-none'
      }
    }
  });

  export type WorkoutCalendarDayCellVisual = VariantProps<
    typeof workoutCalendarDayCellVariants
  >['visual'];
</script>

<script lang="ts">
  import { IconCheck } from '@tabler/icons-svelte';
  import { cn } from '$util/svelte-shadcn-util';
  import type { WorkoutCalendarSession } from './workoutCalendarTypes';

  let {
    dateLabel,
    sessions,
    visual,
    isClickable,
    onDayClick,
    accentLeft = false
  }: {
    /** Date number to display (e.g. 15). */
    dateLabel: number;
    /** Sessions on this day. Used to render indicator dots/checkmarks. */
    sessions: WorkoutCalendarSession[];
    /** Visual variant computed by the parent calendar. */
    visual: WorkoutCalendarDayCellVisual;
    /** Whether clicking the cell opens the detail dialog. */
    isClickable: boolean;
    /** Called when a clickable cell is tapped. */
    onDayClick: () => void;
    /** Show a left accent border (used by WorkoutMesocycleCalendar for cycle starts). */
    accentLeft?: boolean;
  } = $props();

  /**
   * Returns the Tailwind color class for a session's checkmark icon.
   *
   * @param session - The session to get the checkmark color for
   */
  function checkClass(session: WorkoutCalendarSession): string {
    if (session.hasRecoveryExercise) return 'text-amber-500';
    if (session.isFreeForm) return 'text-violet-500';
    return 'text-primary';
  }

  /**
   * Returns the Tailwind class string for a session's incomplete dot.
   *
   * @param session - The session to get the dot color for
   */
  function dotClass(session: WorkoutCalendarSession): string {
    if (session.hasRecoveryExercise) return 'bg-amber-500/60';
    if (session.isFreeForm) return 'bg-violet-500/60';
    return 'bg-primary/60';
  }
</script>

{#if isClickable}
  <button
    type="button"
    class={workoutCalendarDayCellVariants({ visual, accentLeft })}
    onclick={onDayClick}
  >
    <span class="text-foreground">{dateLabel}</span>
    <div class="flex gap-0.5 mt-0.5">
      {#each sessions as session (session.sessionId)}
        {#if session.completed}
          <IconCheck class={cn('size-3', checkClass(session))} />
        {:else}
          <span class={cn('size-2 rounded-full', dotClass(session))}></span>
        {/if}
      {/each}
    </div>
  </button>
{:else}
  <div class={workoutCalendarDayCellVariants({ visual, accentLeft })}>
    <span class="text-foreground">{dateLabel}</span>
    {#if visual === 'rest'}
      <span class="text-[10px] text-muted-foreground mt-0.5">Rest</span>
    {/if}
  </div>
{/if}
