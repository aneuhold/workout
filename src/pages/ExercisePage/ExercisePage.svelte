<!--
  @component

  Full-page exercise detail, edit, and creation view.
  Supports view mode (read-only), edit mode, and new exercise creation.
-->
<script lang="ts">
  import {
    ExerciseProgressionType,
    ExerciseRepRange,
    WorkoutExerciseCalibrationService,
    WorkoutExerciseSchema,
    WorkoutExerciseService
  } from '@aneuhold/core-ts-db-lib';
  import { IconArrowLeft } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import { untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { goto } from '$app/navigation';
  import { calibrationFormDialog } from '$components/singletons/dialogs/SingletonCalibrationFormDialog/SingletonCalibrationFormDialog.svelte';
  import SingletonCalibrationFormDialog from '$components/singletons/dialogs/SingletonCalibrationFormDialog/SingletonCalibrationFormDialog.svelte';
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
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
    exerciseId,
    isNew
  }: {
    exerciseId: string | null;
    isNew: boolean;
  } = $props();

  // --- Data sources ---

  let exercise = $derived(
    exerciseId ? exerciseMapService.getDocs().find((e) => e._id === exerciseId) : undefined
  );
  let allEquipment = $derived(equipmentTypeMapService.getDocs());
  let allMuscleGroups = $derived(muscleGroupMapService.getDocs());

  let calibrations = $derived.by(() => {
    if (!exercise) return [];
    return exerciseCalibrationMapService
      .getDocs()
      .filter((c) => c.workoutExerciseId === exercise._id);
  });
  let latestCalibration = $derived(calibrations[calibrations.length - 1]);

  // --- Mode ---

  let editOverride = $state<boolean | null>(null);
  let editMode = $derived(editOverride !== null ? editOverride : isNew);

  // --- Edit form state ---

  let formName = $state('');
  let formEquipmentId = $state<string>('');
  let formRepRange = $state<string>(ExerciseRepRange.Medium);
  let formProgressionType = $state<string>(ExerciseProgressionType.Rep);
  let formPrimary = new SvelteSet<string>();
  let formSecondary = new SvelteSet<string>();
  let formRestSeconds = $state<number | undefined>(undefined);
  let formNotes = $state('');
  let formJointFatigue = $state<number[]>([]);
  let formPerceivedEffort = $state<number[]>([]);
  let formUnusedMuscle = $state<number[]>([]);
  let jointFatigueNotSet = $state(true);
  let perceivedEffortNotSet = $state(true);
  let unusedMuscleNotSet = $state(true);

  // Populate form when entering edit mode.
  // Track only the triggers (editMode, exercise, isNew), untrack state mutations.
  $effect(() => {
    const mode = editMode;
    const ex = exercise;
    const creating = isNew;

    untrack(() => {
      if (mode && ex && !creating) {
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
        if (fg.jointAndTissueDisruption != null) {
          formJointFatigue = [fg.jointAndTissueDisruption];
          jointFatigueNotSet = false;
        } else {
          formJointFatigue = [0];
          jointFatigueNotSet = true;
        }
        if (fg.perceivedEffort != null) {
          formPerceivedEffort = [fg.perceivedEffort];
          perceivedEffortNotSet = false;
        } else {
          formPerceivedEffort = [0];
          perceivedEffortNotSet = true;
        }
        if (fg.unusedMusclePerformance != null) {
          formUnusedMuscle = [fg.unusedMusclePerformance];
          unusedMuscleNotSet = false;
        } else {
          formUnusedMuscle = [0];
          unusedMuscleNotSet = true;
        }
      } else if (mode && creating) {
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
        jointFatigueNotSet = true;
        perceivedEffortNotSet = true;
        unusedMuscleNotSet = true;
      }
    });
  });

  let formIsValid = $derived(formName.trim().length > 0 && formEquipmentId.length > 0);

  // --- Helpers ---

  function getMuscleGroupName(id: UUID): string {
    return muscleGroupMapService.getDoc(id)?.name ?? 'Unknown';
  }

  function getEquipmentName(id: UUID): string {
    return equipmentTypeMapService.getDoc(id)?.title ?? 'Unknown';
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

  // --- Muscle group toggle ---

  function togglePrimary(id: string) {
    if (formPrimary.has(id)) {
      formPrimary.delete(id);
    } else {
      formSecondary.delete(id);
      formPrimary.add(id);
    }
  }

  function toggleSecondary(id: string) {
    if (formSecondary.has(id)) {
      formSecondary.delete(id);
    } else {
      formPrimary.delete(id);
      formSecondary.add(id);
    }
  }

  // --- Save ---

  function handleSave() {
    if (!formIsValid) return;
    const userId = $currentUserId;

    const fatigueGuess = {
      jointAndTissueDisruption: jointFatigueNotSet ? null : formJointFatigue[0],
      perceivedEffort: perceivedEffortNotSet ? null : formPerceivedEffort[0],
      unusedMusclePerformance: unusedMuscleNotSet ? null : formUnusedMuscle[0]
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
      editOverride = false;
    }
  }

  function handleCancel() {
    if (isNew) {
      goto('/library');
    } else {
      editOverride = false;
    }
  }
</script>

<div class="flex flex-col gap-4 p-4">
  <!-- Header -->
  <div class="flex items-center gap-2">
    <Button variant="ghost" size="sm" onclick={() => goto('/library')}>
      <IconArrowLeft size={16} />
    </Button>
    {#if editMode}
      <h1 class="text-xl font-semibold">{isNew ? 'New Exercise' : 'Edit Exercise'}</h1>
    {:else if exercise}
      <h1 class="text-xl font-semibold">{exercise.exerciseName}</h1>
    {/if}
  </div>

  {#if editMode}
    <!-- Edit / New mode -->
    <form
      class="flex flex-col gap-4"
      onsubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      <div class="flex flex-col gap-1.5">
        <Label for="ex-name">Exercise Name</Label>
        <Input id="ex-name" placeholder="e.g. Barbell Bench Press" bind:value={formName} required />
      </div>

      <div class="flex flex-col gap-1.5">
        <Label>Equipment</Label>
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

      <!-- Primary muscle groups -->
      <div class="flex flex-col gap-1.5">
        <Label>Primary Muscle Groups</Label>
        <div class="flex flex-wrap gap-1.5">
          {#each allMuscleGroups as mg (mg._id)}
            <button type="button" onclick={() => togglePrimary(mg._id)}>
              <Badge variant={formPrimary.has(mg._id) ? 'default' : 'outline'}>
                {mg.name}
              </Badge>
            </button>
          {/each}
        </div>
      </div>

      <!-- Secondary muscle groups -->
      <div class="flex flex-col gap-1.5">
        <Label>Secondary Muscle Groups</Label>
        <div class="flex flex-wrap gap-1.5">
          {#each allMuscleGroups.filter((mg) => !formPrimary.has(mg._id)) as mg (mg._id)}
            <button type="button" onclick={() => toggleSecondary(mg._id)}>
              <Badge variant={formSecondary.has(mg._id) ? 'secondary' : 'outline'}>
                {mg.name}
              </Badge>
            </button>
          {/each}
        </div>
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
      <h2 class="text-base font-medium">Initial Fatigue Guess</h2>

      <!-- Joint & Tissue Disruption -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <Label>Joint & Tissue Disruption</Label>
          <button
            type="button"
            class="text-xs text-muted-foreground hover:text-foreground"
            onclick={() => (jointFatigueNotSet = !jointFatigueNotSet)}
          >
            {jointFatigueNotSet ? 'Set value' : 'Clear'}
          </button>
        </div>
        {#if !jointFatigueNotSet}
          <Slider type="multiple" bind:value={formJointFatigue} min={0} max={3} step={1} />
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">{formJointFatigue[0]}</span>
          </div>
          <p class="text-xs text-muted-foreground">{jointDescriptions[formJointFatigue[0]]}</p>
        {:else}
          <p class="text-xs text-muted-foreground italic">Not set</p>
        {/if}
      </div>

      <!-- Perceived Effort -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <Label>Perceived Effort</Label>
          <button
            type="button"
            class="text-xs text-muted-foreground hover:text-foreground"
            onclick={() => (perceivedEffortNotSet = !perceivedEffortNotSet)}
          >
            {perceivedEffortNotSet ? 'Set value' : 'Clear'}
          </button>
        </div>
        {#if !perceivedEffortNotSet}
          <Slider type="multiple" bind:value={formPerceivedEffort} min={0} max={3} step={1} />
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">{formPerceivedEffort[0]}</span>
          </div>
          <p class="text-xs text-muted-foreground">{effortDescriptions[formPerceivedEffort[0]]}</p>
        {:else}
          <p class="text-xs text-muted-foreground italic">Not set</p>
        {/if}
      </div>

      <!-- Unused Muscle Performance -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <Label>Unused Muscle Performance</Label>
          <button
            type="button"
            class="text-xs text-muted-foreground hover:text-foreground"
            onclick={() => (unusedMuscleNotSet = !unusedMuscleNotSet)}
          >
            {unusedMuscleNotSet ? 'Set value' : 'Clear'}
          </button>
        </div>
        {#if !unusedMuscleNotSet}
          <Slider type="multiple" bind:value={formUnusedMuscle} min={0} max={3} step={1} />
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">{formUnusedMuscle[0]}</span>
          </div>
          <p class="text-xs text-muted-foreground">
            {unusedMuscleDescriptions[formUnusedMuscle[0]]}
          </p>
        {:else}
          <p class="text-xs text-muted-foreground italic">Not set</p>
        {/if}
      </div>

      <Separator />

      <div class="flex gap-2">
        <Button type="submit" disabled={!formIsValid}>Save</Button>
        <Button variant="outline" type="button" onclick={handleCancel}>Cancel</Button>
      </div>
    </form>
  {:else if exercise}
    <!-- View mode -->
    <div class="flex flex-col gap-4">
      <!-- Properties grid -->
      <div class="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <span class="text-xs text-muted-foreground">Equipment</span>
          <p class="text-sm">{getEquipmentName(exercise.workoutEquipmentTypeId)}</p>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Progression</span>
          <p class="text-sm">{exercise.preferredProgressionType}</p>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Rest Time</span>
          <p class="text-sm">{exercise.restSeconds ?? '—'}s</p>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Rep Range</span>
          <p class="text-sm">
            {WorkoutExerciseService.getRepRangeValues(exercise.repRange)
              .min}-{WorkoutExerciseService.getRepRangeValues(exercise.repRange).max} ({exercise.repRange})
          </p>
        </div>
      </div>

      <!-- Muscle groups -->
      <div>
        <span class="text-xs text-muted-foreground">Muscle Groups</span>
        <div class="mt-1 flex flex-wrap gap-1">
          {#each exercise.primaryMuscleGroups as mgId (mgId)}
            <Badge>{getMuscleGroupName(mgId)}</Badge>
          {/each}
          {#each exercise.secondaryMuscleGroups as mgId (mgId)}
            <Badge variant="outline">{getMuscleGroupName(mgId)}</Badge>
          {/each}
          {#if exercise.primaryMuscleGroups.length === 0 && exercise.secondaryMuscleGroups.length === 0}
            <span class="text-xs text-muted-foreground">None assigned</span>
          {/if}
        </div>
      </div>

      <!-- Notes -->
      {#if exercise.notes}
        <div>
          <span class="text-xs text-muted-foreground">Notes</span>
          <p class="mt-0.5 text-sm">{exercise.notes}</p>
        </div>
      {/if}

      <!-- Fatigue guess -->
      {#if exercise.initialFatigueGuess}
        <Separator />
        <div>
          <span class="text-xs text-muted-foreground">Fatigue Guess</span>
          <div class="mt-1 grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <span class="text-xs text-muted-foreground">Joint</span>
              <p class="font-medium">
                {exercise.initialFatigueGuess.jointAndTissueDisruption ?? '—'}
              </p>
            </div>
            <div>
              <span class="text-xs text-muted-foreground">Effort</span>
              <p class="font-medium">{exercise.initialFatigueGuess.perceivedEffort ?? '—'}</p>
            </div>
            <div>
              <span class="text-xs text-muted-foreground">Unused</span>
              <p class="font-medium">
                {exercise.initialFatigueGuess.unusedMusclePerformance ?? '—'}
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Calibration -->
      <Separator />
      {#if latestCalibration}
        <div class="rounded-lg bg-muted/50 p-3">
          <span class="text-xs text-muted-foreground">
            Calibrated on {latestCalibration.dateRecorded.toLocaleDateString()}
          </span>
          <div class="mt-2 grid grid-cols-3 text-center">
            <div>
              <span class="text-xs text-muted-foreground">Weight</span>
              <p class="font-medium">{latestCalibration.weight} lb</p>
            </div>
            <div>
              <span class="text-xs text-muted-foreground">Reps</span>
              <p class="font-medium">{latestCalibration.reps}</p>
            </div>
            <div>
              <span class="text-xs text-muted-foreground">Est. 1RM</span>
              <p class="font-medium">
                {Math.round(WorkoutExerciseCalibrationService.get1RM(latestCalibration))} lb
              </p>
            </div>
          </div>
        </div>
      {/if}
      <Button variant="outline" size="sm" onclick={() => calibrationFormDialog.open(exercise)}>
        Add Calibration
      </Button>

      <!-- Actions -->
      <div class="flex gap-2">
        <Button onclick={() => (editOverride = true)}>Edit</Button>
        <Button variant="outline" onclick={() => goto('/library')}>Back</Button>
      </div>
    </div>
  {:else}
    <p class="text-sm text-muted-foreground">Exercise not found.</p>
    <Button variant="outline" onclick={() => goto('/library')}>Back to Library</Button>
  {/if}
</div>

<SingletonCalibrationFormDialog />
