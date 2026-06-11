<!--
  @component

  Card displaying a monthly session calendar showing all workout sessions
  across mesocycles and free-form workouts.
-->
<script lang="ts">
  import SessionCalendar from '$components/WorkoutCalendar/SessionCalendar/WorkoutSessionCalendar.svelte';
  import exerciseMapService from '$services/documentMapServices/ExerciseMap.service.svelte';
  import sessionExerciseMapService from '$services/documentMapServices/SessionExerciseMap.service.svelte';
  import sessionMapService from '$services/documentMapServices/SessionMap.service.svelte';
  import setMapService from '$services/documentMapServices/SetMap.service.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
</script>

<Card>
  <CardHeader>
    <CardTitle>Session Calendar</CardTitle>
  </CardHeader>
  <CardContent>
    <SessionCalendar
      sessions={sessionMapService.allDocs}
      sessionExercises={sessionExerciseMapService.allDocs}
      sets={setMapService.allDocs}
      exercises={exerciseMapService.allDocs}
    />
  </CardContent>
</Card>
