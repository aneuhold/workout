<!--
  @component

  Empty state shown when there is no active mesocycle on the home page.
-->
<script lang="ts">
  import { IconBarbell } from '@tabler/icons-svelte';
  import OnboardingEmptyState from '$components/OnboardingEmptyState/OnboardingEmptyState.svelte';
</script>

<OnboardingEmptyState
  readyTitle="No active mesocycle"
  readyMessage="Create a mesocycle to start planning sessions."
  readyButtonLabel="View Mesocycles"
  readyButtonHref="/mesocycles"
>
  {#snippet icon()}
    <IconBarbell size={48} class="mb-3 opacity-40" />
  {/snippet}
</OnboardingEmptyState>
