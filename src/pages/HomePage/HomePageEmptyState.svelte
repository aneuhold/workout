<!--
  @component

  Empty state shown when there is no active mesocycle and no free-form session
  in progress on the home page.
-->
<script lang="ts">
  import { IconBarbell } from '@tabler/icons-svelte';
  import { goto } from '$app/navigation';
  import OnboardingEmptyState from '$components/OnboardingEmptyState/OnboardingEmptyState.svelte';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';

  function handleStartFreeForm() {
    const session = sessionMapService.createFreeFormSession();
    goto(`/session?sessionId=${session._id}`);
  }

  const readyButtons = [
    {
      label: 'View Mesocycles',
      onclick: () => {
        goto('/mesocycles');
      }
    },
    { label: 'Start Free-Form Workout', onclick: handleStartFreeForm }
  ];
</script>

<OnboardingEmptyState
  readyTitle="No active mesocycle"
  readyMessage="Start a free-form workout or create a mesocycle for planned progression."
  {readyButtons}
>
  {#snippet icon()}
    <IconBarbell size={48} class="mb-3 opacity-40" />
  {/snippet}
</OnboardingEmptyState>
