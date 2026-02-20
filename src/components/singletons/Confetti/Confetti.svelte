<script lang="ts" module>
  import { writable } from 'svelte/store';

  /**
   * Triggers a confetti animation at the specified coordinates. This is supposed to be triggered
   * with the clickX and clickY from a mouse event.
   *
   * @param centerX the x coordinate of the center of the confetti explosion, relative to the viewport
   * @param centerY the y coordinate of the center of the confetti explosion, relative to the viewport
   * @param durationMs how long the confetti should last before disappearing, in milliseconds. Defaults to 3000 (3 seconds).
   */
  export function triggerConfetti(centerX: number, centerY: number, durationMs?: number) {
    confettiSettings.set({ centerX, centerY, durationMs, show: true });
  }

  type ConfettiSettings = {
    centerX: number;
    centerY: number;
    durationMs?: number;
    show: boolean;
  };

  function createConfettiSettings() {
    let currentTimeout: NodeJS.Timeout | undefined;
    const { subscribe, set } = writable<ConfettiSettings>({
      centerX: 100,
      centerY: 100,
      show: false
    });
    return {
      subscribe,
      set: (settings: ConfettiSettings) => {
        if (settings.show) {
          if (currentTimeout) {
            // Clear the timeout
            clearTimeout(currentTimeout);
            // Set the settings to not display the confetti anymore
            set({ ...settings, show: false });
            // Wait for the next tick to set the settings to display the
            // confetti again
            tick().then(() => {
              set(settings);
            });
          } else {
            set(settings);
          }
          currentTimeout = setTimeout(() => {
            set({ ...settings, show: false });
          }, settings.durationMs ?? 3000);
        } else {
          set(settings);
        }
      }
    };
  }
  const confettiSettings = createConfettiSettings();
</script>

<!--
  @component
  
  A component that provides a confetti animation to the rest of the application.
  This is separated out to solve issues with overflow, and to make sure there
  is ever only 1 animation happening at a time.

  Maybe write something for the dispatch of confetti being complete?
-->
<script lang="ts">
  import { confetti } from '@neoconfetti/svelte';
  import { tick } from 'svelte';

  let showConfetti = $derived($confettiSettings.show);
</script>

{#if showConfetti}
  <div class="confettiContainer">
    <div
      class="confetti"
      style={`left: ${$confettiSettings.centerX}px; top: ${$confettiSettings.centerY}px;`}
      use:confetti={{
        stageWidth: window.innerWidth,
        stageHeight: window.innerHeight,
        duration: $confettiSettings.durationMs,
        destroyAfterDone: false
      }}
    ></div>
  </div>
{/if}

<style>
  .confettiContainer {
    position: fixed;
    pointer-events: none;
    width: 100vw;
    height: 100vh;
    z-index: 1;
  }
  .confetti {
    position: absolute;
  }
</style>
