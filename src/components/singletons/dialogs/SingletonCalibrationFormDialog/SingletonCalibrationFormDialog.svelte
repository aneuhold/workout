<!--
  @component

  Singleton dialog for adding calibration data to an exercise.
  Import `calibrationFormDialog` and call `.open()` from anywhere.
-->
<script lang="ts" module>
  import type { WorkoutExercise } from '@aneuhold/core-ts-db-lib';

  let open = $state(false);
  let currentExercise = $state<WorkoutExercise | null>(null);

  export const calibrationFormDialog = {
    open: (exercise: WorkoutExercise) => {
      currentExercise = exercise;
      open = true;
    }
  };
</script>

<script lang="ts">
  import {
    WorkoutExerciseCalibrationSchema,
    WorkoutExerciseCalibrationService
  } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
  import { currentUserId } from '$stores/derived/currentUserId';
  import Button from '$ui/Button/Button.svelte';
  import Dialog from '$ui/Dialog/Dialog.svelte';
  import DialogClose from '$ui/Dialog/DialogClose.svelte';
  import DialogContent from '$ui/Dialog/DialogContent.svelte';
  import DialogFooter from '$ui/Dialog/DialogFooter.svelte';
  import DialogHeader from '$ui/Dialog/DialogHeader.svelte';
  import DialogTitle from '$ui/Dialog/DialogTitle.svelte';
  import Input from '$ui/Input/Input.svelte';
  import Label from '$ui/Label/Label.svelte';

  let weight = $state<number | undefined>();
  let reps = $state<number | undefined>();

  $effect(() => {
    const opened = open;

    untrack(() => {
      if (opened) {
        weight = undefined;
        reps = undefined;
      }
    });
  });

  let isValid = $derived(weight !== undefined && weight > 0 && reps !== undefined && reps > 0);

  let estimated1RM = $derived.by(() => {
    if (!isValid || !weight || !reps) return null;
    return WorkoutExerciseCalibrationService.get1RMRaw(weight, reps);
  });

  function handleSubmit() {
    if (!isValid || !currentExercise || !weight || !reps) return;
    const userId = $currentUserId;

    const doc = WorkoutExerciseCalibrationSchema.parse({
      userId,
      workoutExerciseId: currentExercise._id,
      weight,
      reps,
      dateRecorded: new Date()
    });
    exerciseCalibrationMapService.addDoc(doc);
    open = false;
  }
</script>

<Dialog bind:open>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Calibration</DialogTitle>
    </DialogHeader>
    {#if currentExercise}
      <p class="text-sm text-muted-foreground">
        For: <span class="font-medium text-foreground">{currentExercise.exerciseName}</span>
      </p>
    {/if}
    <form
      class="flex flex-col gap-4"
      onsubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1.5">
          <Label for="cal-weight">Weight (lb)</Label>
          <Input id="cal-weight" type="number" bind:value={weight} min="0" step="any" required />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="cal-reps">Reps</Label>
          <Input id="cal-reps" type="number" bind:value={reps} min="1" step="1" required />
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label>Date</Label>
        <p class="text-sm">{new Date().toLocaleDateString()}</p>
      </div>

      {#if estimated1RM !== null}
        <div class="rounded-lg bg-muted/50 p-3 text-center">
          <span class="text-xs text-muted-foreground">Estimated 1RM</span>
          <p class="text-lg font-semibold">{Math.round(estimated1RM)} lb</p>
        </div>
      {/if}

      <DialogFooter>
        <DialogClose>
          <Button variant="outline" type="button">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={!isValid}>Add Calibration</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
