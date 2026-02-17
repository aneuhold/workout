<!--
  @component

  Section showing the last few fully-completed sessions.
-->
<script lang="ts">
  import SessionCard from '$components/SessionCard/SessionCard.svelte';
  import { SessionStatus } from '$components/SessionCard/sessionCardTypes';
  import type { HomePageSessionBundle } from './homePageUtils';

  let { recentSessions }: { recentSessions: HomePageSessionBundle[] } = $props();
</script>

<div class="flex flex-col gap-2">
  <span class="text-sm font-medium">Recent Sessions</span>
  <div class="flex flex-col gap-2">
    {#each recentSessions as bundle (bundle.session._id)}
      <SessionCard
        session={bundle.session}
        status={SessionStatus.Completed}
        sessionExercises={bundle.sessionExercises}
        sets={bundle.sets}
      />
    {/each}
  </div>
</div>
