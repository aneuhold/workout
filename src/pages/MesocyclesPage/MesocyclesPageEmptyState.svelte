<!--
  @component

  Empty state placeholder shown when the user has no mesocycles.
  Shows onboarding guidance based on how many exercises have calibrations.
-->
<script lang="ts">
  import { IconCalendar } from '@tabler/icons-svelte';
  import OnboardingEmptyState from '$components/OnboardingEmptyState/OnboardingEmptyState.svelte';
</script>

<OnboardingEmptyState
  readyTitle="No mesocycles yet"
  readyMessage="Tap New to create your first training plan."
>
  {#snippet icon()}
    <IconCalendar size={48} class="mb-3 opacity-40" />
  {/snippet}
</OnboardingEmptyState>
