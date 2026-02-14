<!--
  @component

  Form for creating or editing an exercise.
  Handles all form state, validation, and submission.
-->
<script lang="ts">
  import {
    ExerciseProgressionType,
    ExerciseRepRange,
    type WorkoutExercise,
    WorkoutExerciseSchema
  } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import { untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { goto } from '$app/navigation';
  import InfoPopover from '$components/InfoPopover/InfoPopover.svelte';
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import { currentUserId } from '$stores/derived/currentUserId';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Input from '$ui/Input/Input.svelte';
  import Label from '$ui/Label/Label.svelte';
  import Select from '$ui/Select/Select.svelte';
  import SelectContent from '$ui/Select/SelectContent.svelte';
  import SelectItem from '$ui/Select/SelectItem.svelte';
  import SelectTrigger from '$ui/Select/SelectTrigger.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import Slider from '$ui/Slider/Slider.svelte';
  import Textarea from '$ui/Textarea/Textarea.svelte';

  let {
    exercise,
    isNew,
    onCancel
  }: {
    exercise?: WorkoutExercise;
    isNew: boolean;
    onCancel: () => void;
  } = $props();

  // --- Data sources ---

  let allEquipment = $derived(equipmentTypeMapService.getDocs());
  let allMuscleGroups = $derived(muscleGroupMapService.getDocs());

  // --- Form state ---

  let formName = $state('');
  let formEquipmentId = $state<string>('');
  let formRepRange = $state<string>(ExerciseRepRange.Medium);
  let formProgressionType = $state<string>(ExerciseProgressionType.Rep);
  let formPrimary = new SvelteSet<string>();
  let formSecondary = new SvelteSet<string>();
  let formRestSeconds = $state<number | undefined>(undefined);
  let formNotes = $state('');
  let formJointFatigue = $state<number[]>([0]);
  let formPerceivedEffort = $state<number[]>([0]);
  let formUnusedMuscle = $state<number[]>([0]);

  // Populate form when entering edit mode.
  $effect(() => {
    const ex = exercise;
    const creating = isNew;

    untrack(() => {
      if (ex && !creating) {
        formName = ex.exerciseName;
        formEquipmentId = ex.workoutEquipmentTypeId;
        formRepRange = ex.repRange;
        formProgressionType = ex.preferredProgressionType;
        formPrimary.clear();
        ex.primaryMuscleGroups.forEach((id) => formPrimary.add(id));
        formSecondary.clear();
        ex.secondaryMuscleGroups.forEach((id) => formSecondary.add(id));
        formRestSeconds = ex.restSeconds ?? undefined;
        formNotes = ex.notes ?? '';
        const fg = ex.initialFatigueGuess;
        formJointFatigue = [fg.jointAndTissueDisruption ?? 0];
        formPerceivedEffort = [fg.perceivedEffort ?? 0];
        formUnusedMuscle = [fg.unusedMusclePerformance ?? 0];
      } else if (creating) {
        formName = '';
        formEquipmentId = allEquipment.length > 0 ? allEquipment[0]._id : '';
        formRepRange = 'Medium';
        formProgressionType = 'Rep';
        formPrimary.clear();
        formSecondary.clear();
        formRestSeconds = undefined;
        formNotes = '';
        formJointFatigue = [0];
        formPerceivedEffort = [0];
        formUnusedMuscle = [0];
      }
    });
  });

  let formIsValid = $derived(
    formName.trim().length > 0 && formEquipmentId.length > 0 && formPrimary.size > 0
  );

  // --- Helpers ---

  function getMuscleGroupName(id: UUID): string {
    return muscleGroupMapService.getDoc(id)?.name ?? 'Unknown';
  }

  // --- Fatigue descriptions ---

  const jointDescriptions = [
    'You had minimal to no pain or perturbation in your joints or connective tissues',
    'You had some pain or perturbation in your joints and connective tissues but recovered by the next day',
    'You had some persistent pain or tightness in your connective tissues that lasted through the following day or several days',
    'You develop chronic pain in the joints and connective tissues that persists across days to weeks or longer'
  ];

  const effortDescriptions = [
    'Training felt very easy and hardly taxed you psychologically',
    'You put effort into the training, but felt recovered by the end of the day',
    'You put a large effort into the training and felt drained through the next day',
    'You put an all-out effort into the training and felt drained for days'
  ];

  const unusedMuscleDescriptions = [
    'Performance on subsequent exercises targeting unused muscles was better than expected',
    'Performance on subsequent exercises targeting unused muscles was as expected',
    'Performance on subsequent exercises targeting unused muscles was worse than expected',
    'Your performance on subsequent exercises targeting unused muscles was hugely deteriorated'
  ];

  // --- Muscle group toggle (cycles: unselected -> primary -> secondary -> unselected) ---

  function toggleMuscleGroup(id: string) {
    if (formPrimary.has(id)) {
      formPrimary.delete(id);
      formSecondary.add(id);
    } else if (formSecondary.has(id)) {
      formSecondary.delete(id);
    } else {
      formPrimary.add(id);
    }
  }

  // --- Save ---

  function handleSave() {
    if (!formIsValid) return;
    const userId = $currentUserId;

    const fatigueGuess = {
      jointAndTissueDisruption: formJointFatigue[0],
      perceivedEffort: formPerceivedEffort[0],
      unusedMusclePerformance: formUnusedMuscle[0]
    };

    const formData = {
      userId,
      exerciseName: formName.trim(),
      workoutEquipmentTypeId: formEquipmentId,
      repRange: formRepRange,
      preferredProgressionType: formProgressionType,
      primaryMuscleGroups: [...formPrimary],
      secondaryMuscleGroups: [...formSecondary],
      restSeconds: formRestSeconds && formRestSeconds > 0 ? formRestSeconds : null,
      notes: formNotes.trim() || null,
      initialFatigueGuess: fatigueGuess
    };

    if (isNew) {
      const doc = WorkoutExerciseSchema.parse(formData);
      exerciseMapService.addDoc(doc);
      goto(`/exercise?exerciseId=${doc._id}`);
    } else if (exercise) {
      const parsed = WorkoutExerciseSchema.parse({ ...formData, _id: exercise._id });
      exerciseMapService.updateDoc(exercise._id, (doc) => {
        doc.exerciseName = parsed.exerciseName;
        doc.workoutEquipmentTypeId = parsed.workoutEquipmentTypeId;
        doc.repRange = parsed.repRange;
        doc.preferredProgressionType = parsed.preferredProgressionType;
        doc.primaryMuscleGroups = parsed.primaryMuscleGroups;
        doc.secondaryMuscleGroups = parsed.secondaryMuscleGroups;
        doc.restSeconds = parsed.restSeconds;
        doc.notes = parsed.notes;
        doc.initialFatigueGuess = parsed.initialFatigueGuess;
        doc.lastUpdatedDate = new Date();
        return doc;
      });
      onCancel();
    }
  }
</script>

<form
  class="flex flex-col gap-4"
  onsubmit={(e) => {
    e.preventDefault();
    handleSave();
  }}
>
  <p class="text-xs text-muted-foreground">* Required</p>

  <div class="flex flex-col gap-1.5">
    <Label for="ex-name">Exercise Name *</Label>
    <Input id="ex-name" placeholder="e.g. Barbell Bench Press" bind:value={formName} required />
  </div>

  <div class="flex flex-col gap-1.5">
    <Label>Equipment *</Label>
    <Select bind:value={formEquipmentId} type="single">
      <SelectTrigger>
        {allEquipment.find((e) => e._id === formEquipmentId)?.title ?? 'Select equipment'}
      </SelectTrigger>
      <SelectContent>
        {#each allEquipment as eq (eq._id)}
          <SelectItem value={eq._id}>{eq.title}</SelectItem>
        {/each}
      </SelectContent>
    </Select>
  </div>

  <div class="grid grid-cols-2 gap-3">
    <div class="flex flex-col gap-1.5">
      <Label>Rep Range</Label>
      <Select bind:value={formRepRange} type="single">
        <SelectTrigger>{formRepRange}</SelectTrigger>
        <SelectContent>
          <SelectItem value="Heavy">Heavy (5-15)</SelectItem>
          <SelectItem value="Medium">Medium (10-20)</SelectItem>
          <SelectItem value="Light">Light (15-30)</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="flex flex-col gap-1.5">
      <Label>Progression</Label>
      <Select bind:value={formProgressionType} type="single">
        <SelectTrigger>{formProgressionType}</SelectTrigger>
        <SelectContent>
          <SelectItem value="Rep">Rep</SelectItem>
          <SelectItem value="Load">Load</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  <!-- Muscle groups -->
  <div class="flex flex-col gap-3 rounded-lg border border-border p-3">
    <div class="flex flex-col gap-1">
      <Label>Muscle Groups *</Label>
      <p class="text-xs text-muted-foreground">
        At least one primary muscle group is required. Tap once to mark as primary, tap again to
        mark as secondary, tap a third time to remove.
      </p>
    </div>

    <div class="flex flex-wrap gap-1.5">
      {#each allMuscleGroups as mg (mg._id)}
        <button type="button" onclick={() => toggleMuscleGroup(mg._id)}>
          <Badge
            variant={formPrimary.has(mg._id)
              ? 'default'
              : formSecondary.has(mg._id)
                ? 'secondary'
                : 'outline'}
          >
            {mg.name}
            {#if formPrimary.has(mg._id)}
              <span class="ml-0.5 text-[10px] opacity-70">1°</span>
            {:else if formSecondary.has(mg._id)}
              <span class="ml-0.5 text-[10px] opacity-70">2°</span>
            {/if}
          </Badge>
        </button>
      {/each}
    </div>

    {#if formPrimary.size > 0 || formSecondary.size > 0}
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {#if formPrimary.size > 0}
          <span
            >Primary: {[...formPrimary]
              .map((id) => getMuscleGroupName(id as UUID))
              .join(', ')}</span
          >
        {/if}
        {#if formSecondary.size > 0}
          <span
            >Secondary: {[...formSecondary]
              .map((id) => getMuscleGroupName(id as UUID))
              .join(', ')}</span
          >
        {/if}
      </div>
    {/if}
  </div>

  <div class="flex flex-col gap-1.5">
    <Label for="ex-rest">Rest Time (seconds)</Label>
    <Input
      id="ex-rest"
      type="number"
      bind:value={formRestSeconds}
      min="0"
      step="1"
      placeholder="e.g. 120"
    />
  </div>

  <div class="flex flex-col gap-1.5">
    <Label for="ex-notes">Notes</Label>
    <Textarea id="ex-notes" bind:value={formNotes} placeholder="Optional notes..." />
  </div>

  <!-- Fatigue Guess -->
  <Separator />
  <div class="flex items-center gap-2">
    <h2 class="text-base font-medium">Initial Fatigue Guess</h2>
    <InfoPopover>
      These values help position the exercise correctly within your mesocycles. Without them, the
      app can't determine how fatiguing this exercise is relative to others, which affects volume
      and recovery planning.
    </InfoPopover>
  </div>

  <!-- Joint & Tissue Disruption -->
  <div class="flex flex-col gap-2">
    <Label>Joint & Tissue Disruption</Label>
    <Slider type="multiple" bind:value={formJointFatigue} min={0} max={3} step={1} />
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">{formJointFatigue[0]}</span>
    </div>
    <p class="text-xs text-muted-foreground">{jointDescriptions[formJointFatigue[0]]}</p>
  </div>

  <!-- Perceived Effort -->
  <div class="flex flex-col gap-2">
    <Label>Perceived Effort</Label>
    <Slider type="multiple" bind:value={formPerceivedEffort} min={0} max={3} step={1} />
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">{formPerceivedEffort[0]}</span>
    </div>
    <p class="text-xs text-muted-foreground">{effortDescriptions[formPerceivedEffort[0]]}</p>
  </div>

  <!-- Unused Muscle Performance -->
  <div class="flex flex-col gap-2">
    <Label>Unused Muscle Performance</Label>
    <Slider type="multiple" bind:value={formUnusedMuscle} min={0} max={3} step={1} />
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">{formUnusedMuscle[0]}</span>
    </div>
    <p class="text-xs text-muted-foreground">
      {unusedMuscleDescriptions[formUnusedMuscle[0]]}
    </p>
  </div>

  <Separator />

  <div class="flex gap-2">
    <Button type="submit" disabled={!formIsValid}>Save</Button>
    <Button variant="outline" type="button" onclick={onCancel}>Cancel</Button>
  </div>
</form>
