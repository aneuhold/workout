<!--
  @component

  Rest timer section for an exercise card.
  Shows timer controls (start, pause, resume, stop) and rest readiness guidelines.
-->
<script lang="ts">
  import type { WorkoutExercise } from '@aneuhold/core-ts-db-lib';
  import {
    IconPlayerPause,
    IconPlayerPlay,
    IconPlayerStop,
    IconStopwatch
  } from '@tabler/icons-svelte';
  import { goto } from '$app/navigation';
  import InfoPopover from '$components/InfoPopover/InfoPopover.svelte';
  import muscleGroupMapService from '$services/documentMapServices/MuscleGroupMap.service.svelte';
  import timerService from '$services/TimerService';
  import Button from '$ui/Button/Button.svelte';
  import { formatTime } from '$util/formatTime';

  let {
    exercise
  }: {
    exercise: WorkoutExercise | undefined;
  } = $props();

  let primaryMuscleNames = $derived(
    exercise
      ? exercise.primaryMuscleGroups
          .map((id) => muscleGroupMapService.getMuscleGroupName(id))
          .join(', ')
      : ''
  );

  let secondaryMuscleNames = $derived(
    exercise
      ? exercise.secondaryMuscleGroups
          .map((id) => muscleGroupMapService.getMuscleGroupName(id))
          .join(', ')
      : ''
  );

  function handleStartTimer() {
    const seconds = exercise?.restSeconds ?? 180;
    timerService.start(seconds);
  }
</script>

<div class="flex items-center gap-2">
  {#if timerService.isActive}
    <Button
      size="sm"
      class={timerService.isPaused ? '' : 'animate-timer-pulse'}
      onclick={() => goto('/timer')}
    >
      <IconStopwatch size={14} />
      {formatTime(timerService.remainingSeconds)}
    </Button>
    {#if timerService.isPaused}
      <Button variant="outline" size="icon-sm" onclick={() => timerService.resume()}>
        <IconPlayerPlay size={14} />
      </Button>
    {:else}
      <Button variant="outline" size="icon-sm" onclick={() => timerService.pause()}>
        <IconPlayerPause size={14} />
      </Button>
    {/if}
    <Button variant="outline" size="icon-sm" onclick={() => timerService.stop()}>
      <IconPlayerStop size={14} />
    </Button>
  {:else}
    <Button variant="outline" size="sm" onclick={handleStartTimer}>
      <IconStopwatch size={14} />
      Start Rest Timer
    </Button>
  {/if}
  <InfoPopover>
    <p class="mb-2 font-medium">Rest Readiness Guidelines</p>
    <ul class="flex flex-col gap-1.5 text-sm">
      <li>
        Are my <strong>{primaryMuscleNames}</strong> no longer burning from the last set?
      </li>
      {#if secondaryMuscleNames}
        <li>
          Are my <strong>{secondaryMuscleNames}</strong> ready to support my
          <strong>{primaryMuscleNames}</strong> in another set?
        </li>
      {/if}
      <li>
        Do I feel mentally and physically like I can push hard with my
        <strong>{primaryMuscleNames}</strong> again?
      </li>
      <li>Is my breathing more or less back to normal?</li>
    </ul>
    <p class="mt-2 text-xs text-muted-foreground">
      If you can answer yes to all of these, you are ready for the next set.
    </p>
  </InfoPopover>
</div>
