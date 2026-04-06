<script lang="ts" module>
  export enum OnboardingStoryMode {
    HomePageNoCalibrations = 'homePageNoCalibrations',
    HomePageFewCalibrations = 'homePageFewCalibrations',
    HomePageReady = 'homePageReady',
    SessionsPageReady = 'sessionsPageReady',
    MesocyclesPageReady = 'mesocyclesPageReady'
  }
</script>

<script lang="ts">
  import { IconBarbell, IconCalendar } from '@tabler/icons-svelte';
  import { untrack } from 'svelte';
  import MockData from '$testUtils/MockData';
  import OnboardingEmptyState from './OnboardingEmptyState.svelte';

  let { storyMode = OnboardingStoryMode.HomePageReady }: { storyMode?: OnboardingStoryMode } =
    $props();

  const homePageModes = new Set<OnboardingStoryMode>([
    OnboardingStoryMode.HomePageNoCalibrations,
    OnboardingStoryMode.HomePageFewCalibrations,
    OnboardingStoryMode.HomePageReady
  ]);

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockData.resetAll();

      if (mode === OnboardingStoryMode.HomePageNoCalibrations) return;

      const baseData = MockData.setupBaseData();

      if (mode === OnboardingStoryMode.HomePageFewCalibrations) {
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
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

{#if homePageModes.has(storyMode)}
  <OnboardingEmptyState
    readyTitle="No active mesocycle"
    readyMessage="Start a free-form workout or create a mesocycle for planned progression."
    readyButtons={[
      { label: 'View Mesocycles', onclick: () => {} },
      { label: 'Start Free-Form Workout', onclick: () => {} }
    ]}
  >
    {#snippet icon()}
      <IconBarbell size={48} class="mb-3 opacity-40" />
    {/snippet}
  </OnboardingEmptyState>
{:else if storyMode === OnboardingStoryMode.SessionsPageReady}
  <OnboardingEmptyState
    readyTitle="No active mesocycle"
    readyMessage="Start a free-form workout from the home page, or create a mesocycle for planned progression."
    readyButtons={[{ label: 'View Mesocycles', onclick: () => {} }]}
  >
    {#snippet icon()}
      <IconBarbell size={48} class="mb-3 opacity-40" />
    {/snippet}
  </OnboardingEmptyState>
{:else if storyMode === OnboardingStoryMode.MesocyclesPageReady}
  <OnboardingEmptyState
    readyTitle="No mesocycles yet"
    readyMessage="Tap New to create your first training plan."
  >
    {#snippet icon()}
      <IconCalendar size={48} class="mb-3 opacity-40" />
    {/snippet}
  </OnboardingEmptyState>
{/if}
