<script lang="ts">
  import Confetti, { triggerConfetti } from './Confetti.svelte';

  let { numButtons = 1 }: { numButtons?: number } = $props();

  let confettiButtonInfo = $derived(Array(numButtons).fill(null));
</script>

<div class="exampleContainer">
  <Confetti />
  {#each confettiButtonInfo as _, index (index)}
    <button
      class="exampleConfettiButton"
      onclick={(event) => {
        triggerConfetti(event.clientX, event.clientY);
      }}
    >
      Click me
    </button>
  {/each}
</div>

<style>
  .exampleContainer {
    display: flex;
    flex-direction: column;
  }
  .exampleConfettiButton {
    margin: auto;
  }
</style>
