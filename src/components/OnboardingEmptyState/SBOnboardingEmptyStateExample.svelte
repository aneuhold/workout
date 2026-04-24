<script lang="ts" module>
  export enum OnboardingStoryMode {
    ChecklistFreshStart = 'checklistFreshStart',
    ChecklistMuscleGroupsAdded = 'checklistMuscleGroupsAdded',
    ChecklistEquipmentAdded = 'checklistEquipmentAdded',
    ChecklistExercisesAdded = 'checklistExercisesAdded',
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

  const checklistModes = new Set<OnboardingStoryMode>([
    OnboardingStoryMode.ChecklistFreshStart,
    OnboardingStoryMode.ChecklistMuscleGroupsAdded,
    OnboardingStoryMode.ChecklistEquipmentAdded,
    OnboardingStoryMode.ChecklistExercisesAdded
  ]);

  function setupChecklistMode(mode: OnboardingStoryMode): void {
    switch (mode) {
      case OnboardingStoryMode.ChecklistFreshStart:
        return;
      case OnboardingStoryMode.ChecklistMuscleGroupsAdded:
        MockData.muscleGroupMapServiceMock.addDefaultMuscleGroups();
        return;
      case OnboardingStoryMode.ChecklistEquipmentAdded:
        MockData.muscleGroupMapServiceMock.addDefaultMuscleGroups();
        MockData.equipmentTypeMapServiceMock.addDefaultEquipmentTypes();
        return;
      case OnboardingStoryMode.ChecklistExercisesAdded:
        MockData.muscleGroupMapServiceMock.addDefaultMuscleGroups();
        MockData.equipmentTypeMapServiceMock.addDefaultEquipmentTypes();
        MockData.exerciseMapServiceMock.addDefaultExercises();
        return;
    }
  }

  function setupCalibrationMode(mode: OnboardingStoryMode): void {
    // Calibration-branch modes need the checklist gate to close. Base data
    // plus a free-form session provides both the exercises and the session
    // that exits checklist mode.
    const baseData = MockData.setupBaseData();
    MockData.sessionMapServiceMock.addFreeFormSession(baseData, {
      complete: true,
      exerciseCount: 1,
      setsPerExercise: 1,
      loggedSetCount: 1
    });

    switch (mode) {
      case OnboardingStoryMode.HomePageNoCalibrations:
        // setupBaseData adds 12 calibrations; drop them all to hit the
        // 0-calibration branch.
        MockData.exerciseCalibrationMapServiceMock.reset();
        return;
      case OnboardingStoryMode.HomePageFewCalibrations: {
        const firstTwo = baseData.calibrations.slice(0, 2);
        MockData.exerciseCalibrationMapServiceMock.reset();
        for (const cal of firstTwo) {
          MockData.exerciseCalibrationMapServiceMock.addCalibration({
            workoutExerciseId: cal.workoutExerciseId,
            reps: cal.reps,
            weight: cal.weight
          });
        }
        return;
      }
    }
  }

  $effect(() => {
    const mode = storyMode;

    untrack(() => {
      MockData.resetAll();
      if (checklistModes.has(mode)) {
        setupChecklistMode(mode);
      } else {
        setupCalibrationMode(mode);
      }
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

{#if checklistModes.has(storyMode)}
  <OnboardingEmptyState
    readyTitle="No active mesocycle"
    readyMessage="Start a free-form workout or create a mesocycle for planned progression."
  >
    {#snippet icon()}
      <IconBarbell size={48} class="mb-3 opacity-40" />
    {/snippet}
  </OnboardingEmptyState>
{:else if homePageModes.has(storyMode)}
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
