<!--
  @component

  Full-page rest timer with large mobile-friendly countdown display, preset
  duration buttons, and a primary-colored active background with pulse animation.
-->
<script lang="ts">
  import { IconStopwatch } from '@tabler/icons-svelte';
  import timerService from '$services/TimerService';
  import Button from '$ui/Button/Button.svelte';
  import Progress from '$ui/Progress/Progress.svelte';
  import { formatTime } from '$util/formatTime';

  const presets = [
    { label: '0:30', seconds: 30 },
    { label: '1:00', seconds: 60 },
    { label: '1:30', seconds: 90 },
    { label: '2:00', seconds: 120 },
    { label: '3:00', seconds: 180 }
  ];

  const progressValue = $derived(
    timerService.totalSeconds > 0
      ? (timerService.remainingSeconds / timerService.totalSeconds) * 100
      : 0
  );
</script>

{#if timerService.isActive}
  <!-- Active state -->
  <div
    class="bg-primary text-primary-foreground animate-timer-pulse flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-8 px-4"
  >
    <span class="font-mono text-8xl font-bold tabular-nums sm:text-9xl">
      {formatTime(timerService.remainingSeconds)}
    </span>

    <Progress
      value={progressValue}
      class="bg-primary-foreground/20 mx-auto max-w-xs **:data-[slot=progress-indicator]:bg-primary-foreground"
    />

    <Button
      variant="outline"
      size="lg"
      class="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 mt-4 cursor-pointer font-mono text-lg"
      onclick={() => timerService.stop()}
    >
      Stop
    </Button>
  </div>
{:else}
  <!-- Idle state -->
  <div class="flex flex-col items-center gap-8 p-8 pt-16">
    <IconStopwatch size={48} stroke={1.5} class="text-muted-foreground" />
    <h1 class="text-2xl font-semibold">Rest Timer</h1>

    <div class="grid grid-cols-3 gap-3">
      {#each presets as preset (preset.seconds)}
        <Button
          variant="outline"
          size="lg"
          class="cursor-pointer font-mono text-lg"
          onclick={() => timerService.start(preset.seconds)}
        >
          {preset.label}
        </Button>
      {/each}
    </div>
  </div>
{/if}
