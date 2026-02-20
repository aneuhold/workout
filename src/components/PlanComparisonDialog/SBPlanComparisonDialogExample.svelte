<script lang="ts">
  import Confetti from '$components/singletons/Confetti/Confetti.svelte';
  import Button from '$ui/Button/Button.svelte';
  import PlanComparisonDialog from './PlanComparisonDialog.svelte';
  import type { PlanComparisonHighlight, PlanComparisonStat } from './planComparisonTypes';

  type StoryMode = 'microcycleComplete' | 'mesocycleStart' | 'deloadMicrocycle';

  let { storyMode = 'microcycleComplete' }: { storyMode?: StoryMode } = $props();

  let open = $state(false);

  const configs: Record<
    StoryMode,
    {
      title: string;
      subtitle?: string;
      stats: PlanComparisonStat[];
      highlights?: PlanComparisonHighlight[];
      buttonLabel: string;
    }
  > = {
    microcycleComplete: {
      title: 'Microcycle 2 Done!',
      subtitle: 'Your Microcycle 3 plan is ready.',
      stats: [
        { label: 'Sessions', value: 5 },
        { label: 'Total Sets', value: 42 },
        { label: 'Exercises', value: 8 }
      ],
      highlights: [
        {
          label: 'Recovery Exercises Added',
          variant: 'success',
          items: ['Face Pulls', 'Band Pull-Aparts']
        }
      ],
      buttonLabel: "Let's Go"
    },
    mesocycleStart: {
      title: 'Mesocycle Started!',
      subtitle: 'Your plan has been optimized.',
      stats: [
        { label: 'Sessions', value: 30 },
        { label: 'Total Sets', value: 240 },
        { label: 'Exercises', value: 12 }
      ],
      buttonLabel: 'Start Training'
    },
    deloadMicrocycle: {
      title: 'Microcycle 5 Done!',
      subtitle: 'Your deload microcycle is ready.',
      stats: [
        { label: 'Sessions', value: 4 },
        { label: 'Total Sets', value: 24 },
        { label: 'Exercises', value: 8 }
      ],
      highlights: [
        {
          label: 'Deload Microcycle',
          variant: 'warning',
          items: ['Reduced volume', 'Lower intensity']
        }
      ],
      buttonLabel: "Let's Go"
    }
  };

  const config = $derived(configs[storyMode]);
</script>

<Confetti />

<div class="flex items-center justify-center p-8">
  <Button onclick={() => (open = true)}>Open Dialog</Button>
</div>

<PlanComparisonDialog
  bind:open
  title={config.title}
  subtitle={config.subtitle}
  stats={config.stats}
  highlights={config.highlights}
  buttonLabel={config.buttonLabel}
/>
