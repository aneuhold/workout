<!--
  @component

  Set grid for an exercise card: column headers, set rows, add/remove controls, and tip text.
-->
<script lang="ts">
  import type { WorkoutSet } from '@aneuhold/core-ts-db-lib';
  import { IconMinus, IconPlus } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import Button from '$ui/Button/Button.svelte';
  import SessionPageSetRow from '../SessionPageSetRow.svelte';
  import { SessionPageMode } from '../sessionPageTypes';
  import { getSetState } from './exerciseCardUtils';

  let {
    sets,
    hasRirAndReps,
    isDeload,
    mode,
    freeFormEditable,
    onAddSet,
    onRemoveSet,
    onLogSet,
    onEditSet,
    onPlannedChange
  }: {
    sets: WorkoutSet[];
    hasRirAndReps: boolean;
    isDeload: boolean;
    mode: SessionPageMode;
    freeFormEditable: boolean;
    onAddSet?: () => void;
    onRemoveSet?: (setId: UUID) => void;
    onLogSet: (set: WorkoutSet, weight: number, reps: number, rir: number | null) => void;
    onEditSet: (set: WorkoutSet, weight: number, reps: number, rir: number | null) => void;
    onPlannedChange: (
      set: WorkoutSet,
      weight: number | undefined,
      reps: number | undefined
    ) => void;
  } = $props();
</script>

<div class="flex flex-col gap-1">
  <div
    class="grid items-center gap-1.5 px-2 text-xs text-muted-foreground {mode ===
    SessionPageMode.Planning
      ? 'grid-cols-7'
      : mode === SessionPageMode.Active
        ? 'grid-cols-12'
        : 'grid-cols-9'}"
  >
    <div class="col-span-1">#</div>
    <div class="col-span-3">Weight</div>
    <div class="col-span-3">Reps</div>
    {#if mode !== SessionPageMode.Planning}
      <div class="col-span-2">RIR</div>
    {/if}
    {#if mode === SessionPageMode.Active}
      <div class="col-span-3"></div>
    {/if}
  </div>
  {#each sets as set, i (set._id)}
    <div class="flex items-center gap-1">
      <div class="flex-1">
        <SessionPageSetRow
          {set}
          setNumber={i + 1}
          setState={getSetState(set, i, mode, sets)}
          {mode}
          onLog={(weight, reps, rir) => onLogSet(set, weight, reps, rir)}
          onEdit={(weight, reps, rir) => onEditSet(set, weight, reps, rir)}
          onPlannedChange={(weight, reps) => onPlannedChange(set, weight, reps)}
        />
      </div>
      {#if freeFormEditable && (mode === SessionPageMode.Active || mode === SessionPageMode.Planning) && sets.length > 1}
        <button
          class="shrink-0 p-1 text-muted-foreground transition-colors hover:text-destructive"
          onclick={() => onRemoveSet?.(set._id)}
        >
          <IconMinus size={14} />
        </button>
      {/if}
    </div>
  {/each}
  {#if hasRirAndReps && !isDeload && mode === SessionPageMode.Active}
    <p class="px-2 pt-1 text-xs text-muted-foreground/70">
      Hit target reps first, then keep going until you reach target RIR.
    </p>
  {/if}
  {#if freeFormEditable && (mode === SessionPageMode.Active || mode === SessionPageMode.Planning)}
    <Button variant="ghost" size="sm" class="self-start" onclick={() => onAddSet?.()}>
      <IconPlus size={14} />
      Add Set
    </Button>
  {/if}
</div>
