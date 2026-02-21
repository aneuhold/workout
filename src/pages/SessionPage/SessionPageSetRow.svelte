<!--
  @component

  A single set row within the exercise card set table.
  Displays weight/reps/RIR inputs and an action column (Log button, Done badge, or planned targets).
-->
<script lang="ts">
  import type { WorkoutSet } from '@aneuhold/core-ts-db-lib';
  import AlertDialog from '$ui/AlertDialog/AlertDialog.svelte';
  import AlertDialogAction from '$ui/AlertDialog/AlertDialogAction.svelte';
  import AlertDialogCancel from '$ui/AlertDialog/AlertDialogCancel.svelte';
  import AlertDialogContent from '$ui/AlertDialog/AlertDialogContent.svelte';
  import AlertDialogDescription from '$ui/AlertDialog/AlertDialogDescription.svelte';
  import AlertDialogFooter from '$ui/AlertDialog/AlertDialogFooter.svelte';
  import AlertDialogHeader from '$ui/AlertDialog/AlertDialogHeader.svelte';
  import AlertDialogTitle from '$ui/AlertDialog/AlertDialogTitle.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Input from '$ui/Input/Input.svelte';
  import { SessionPageMode, SessionPageSetState } from './sessionPageTypes';

  let {
    set,
    setNumber,
    setState,
    mode,
    onLog
  }: {
    set: WorkoutSet;
    setNumber: number;
    setState: SessionPageSetState;
    mode: SessionPageMode;
    onLog: (weight: number, reps: number, rir: number | null) => void;
  } = $props();

  let weight = $derived<number | undefined>(set.actualWeight ?? set.plannedWeight ?? undefined);
  let reps = $derived<number | undefined>(set.actualReps ?? set.plannedReps ?? undefined);
  let rir = $derived<number | undefined>(set.rir ?? set.plannedRir ?? undefined);

  let dialogOpen = $state(false);

  let canLog = $derived(weight != null && reps != null && (rir != null || set.plannedRir == null));

  function handleLogClick() {
    if (!canLog) return;
    dialogOpen = true;
  }

  function handleConfirm() {
    if (weight != null && reps != null && (rir != null || set.plannedRir == null)) {
      onLog(weight, reps, rir ?? null);
    }
    dialogOpen = false;
  }

  let numberClass = $derived(
    setState === SessionPageSetState.Completed
      ? 'text-green-600'
      : setState === SessionPageSetState.Current
        ? 'text-primary'
        : 'text-muted-foreground'
  );

  let rowClass = $derived(
    setState === SessionPageSetState.Completed
      ? 'bg-muted/30'
      : setState === SessionPageSetState.Current
        ? 'bg-primary/5 ring-1 ring-primary/20'
        : ''
  );

  let isDisabled = $derived(
    setState === SessionPageSetState.Completed ||
      mode === SessionPageMode.Review ||
      mode === SessionPageMode.View
  );

  let hasTargets = $derived(
    set.plannedWeight != null || set.plannedReps != null || set.plannedRir != null
  );
</script>

<div class="grid grid-cols-12 items-center gap-1.5 rounded-lg px-2 py-1.5 {rowClass}">
  <!-- Set number -->
  <div class="col-span-1">
    <span class="text-sm font-medium {numberClass}">{setNumber}</span>
  </div>

  <!-- Weight -->
  <div class="col-span-3">
    {#if isDisabled}
      <span
        class="text-sm {setState === SessionPageSetState.Future ? 'text-muted-foreground' : ''}"
      >
        {setState === SessionPageSetState.Completed
          ? (set.actualWeight ?? '—')
          : (set.plannedWeight ?? '—')}
      </span>
    {:else}
      <Input type="number" bind:value={weight} placeholder="lb" class="h-7 text-sm" min={0} />
    {/if}
  </div>

  <!-- Reps -->
  <div class="col-span-3">
    {#if isDisabled}
      <span
        class="text-sm {setState === SessionPageSetState.Future ? 'text-muted-foreground' : ''}"
      >
        {setState === SessionPageSetState.Completed
          ? (set.actualReps ?? '—')
          : (set.plannedReps ?? '—')}
      </span>
    {:else}
      <Input type="number" bind:value={reps} placeholder="reps" class="h-7 text-sm" min={0} />
    {/if}
  </div>

  <!-- RIR -->
  <div class="col-span-2">
    {#if set.plannedRir == null}
      <span class="text-sm text-muted-foreground">&mdash;</span>
    {:else if isDisabled}
      <span
        class="text-sm {setState === SessionPageSetState.Future ? 'text-muted-foreground' : ''}"
      >
        {setState === SessionPageSetState.Completed ? (set.rir ?? '—') : (set.plannedRir ?? '—')}
      </span>
    {:else}
      <Input
        type="number"
        bind:value={rir}
        placeholder="RIR"
        class="h-7 text-sm"
        min={0}
        max={10}
      />
    {/if}
  </div>

  <!-- Action -->
  <div class="col-span-3 flex justify-end">
    {#if setState === SessionPageSetState.Completed}
      <Badge variant="secondary">Done</Badge>
    {:else if setState === SessionPageSetState.Current && mode === SessionPageMode.Active}
      <Button size="sm" disabled={!canLog} onclick={handleLogClick}>Log</Button>
    {/if}
  </div>
</div>

{#if hasTargets}
  <div class="grid grid-cols-12 gap-1.5 px-2 pb-0.5">
    <div class="col-span-1"></div>
    <div class="col-span-11 text-xs text-muted-foreground">
      Target: {set.plannedWeight ?? '?'}lb x {set.plannedReps ?? '?'}{#if set.plannedRir != null}
        @ {set.plannedRir} RIR{/if}
    </div>
  </div>
{/if}

<AlertDialog bind:open={dialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Log Set</AlertDialogTitle>
      <AlertDialogDescription>
        {weight}lb x {reps} reps{#if rir != null}
          @ {rir} RIR{/if}
        {#if hasTargets}
          <br />
          <span class="text-muted-foreground">
            Target: {set.plannedWeight ?? '?'}lb x {set.plannedReps ??
              '?'}{#if set.plannedRir != null}
              @ {set.plannedRir} RIR{/if}
          </span>
        {/if}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onclick={handleConfirm}>Confirm</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
