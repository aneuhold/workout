<script lang="ts">
  import { IconBarbell, IconCalendar } from '@tabler/icons-svelte';
  import { untrack } from 'svelte';
  import MockData from '$testUtils/MockData';
  import OnboardingEmptyState from './OnboardingEmptyState.svelte';

  type StoryMode = 'noCalibrations' | 'fewCalibrations' | 'readyWithButton' | 'readyWithoutButton';

  let { storyMode = 'noCalibrations' }: { storyMode?: StoryMode } = $props();

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockData.resetAll();

      if (mode === 'noCalibrations') return;

      // Set up exercises and equipment (needed for calibrations)
      const baseData = MockData.setupBaseData();

      if (mode === 'fewCalibrations') {
        // setupBaseData adds 12 calibrations. Reset and re-add only 2 so the
        // component shows the "on your way" state (0 < count < 4).
        const firstTwo = baseData.calibrations.slice(0, 2);
        MockData.exerciseCalibrationMapServiceMock.reset();
        for (const cal of firstTwo) {
          MockData.exerciseCalibrationMapServiceMock.addCalibration({
            workoutExerciseId: cal.workoutExerciseId,
            reps: cal.reps,
            weight: cal.weight
          });
        }
      }

      // readyWithButton and readyWithoutButton keep all 12 calibrations (>= 4)
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

{#if storyMode === 'readyWithoutButton'}
  <OnboardingEmptyState
    readyTitle="No mesocycles yet"
    readyMessage="Tap New to create your first training plan."
  >
    {#snippet icon()}
      <IconCalendar size={48} class="mb-3 opacity-40" />
    {/snippet}
  </OnboardingEmptyState>
{:else}
  <OnboardingEmptyState
    readyTitle="No active mesocycle"
    readyMessage="Create a mesocycle to start planning sessions."
    readyButton={{ label: 'View Mesocycles', href: '/mesocycles' }}
  >
    {#snippet icon()}
      <IconBarbell size={48} class="mb-3 opacity-40" />
    {/snippet}
  </OnboardingEmptyState>
{/if}
