<!--
  @component

  Empty state shown when there is no active mesocycle.
  Shows onboarding guidance based on how many exercises have calibrations.
-->
<script lang="ts">
  import { IconBarbell } from '@tabler/icons-svelte';
  import OnboardingEmptyState from '$components/OnboardingEmptyState/OnboardingEmptyState.svelte';
</script>

<OnboardingEmptyState
  readyTitle="No active mesocycle"
  readyMessage="Create a mesocycle to start planning sessions."
  readyButton={{ label: 'View Mesocycles', href: '/mesocycles' }}
>
  {#snippet icon()}
    <IconBarbell size={48} class="mb-3 opacity-40" />
  {/snippet}
</OnboardingEmptyState>
