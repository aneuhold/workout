<!--
  @component

  Empty state shown when there is no active mesocycle.
  Shows onboarding guidance based on how many exercises have calibrations.
-->
<script lang="ts">
  import { IconBarbell } from '@tabler/icons-svelte';
  import { goto } from '$app/navigation';
  import OnboardingEmptyState from '$components/OnboardingEmptyState/OnboardingEmptyState.svelte';
</script>

<OnboardingEmptyState
  readyTitle="No active mesocycle"
  readyMessage="Start a free-form workout from the home page, or create a mesocycle for planned progression."
  readyButtons={[
    {
      label: 'View Mesocycles',
      onclick: () => {
        goto('/mesocycles');
      }
    }
  ]}
>
  {#snippet icon()}
    <IconBarbell size={48} class="mb-3 opacity-40" />
  {/snippet}
</OnboardingEmptyState>
