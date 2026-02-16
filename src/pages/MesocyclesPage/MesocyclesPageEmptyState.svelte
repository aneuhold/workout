<!--
  @component

  Empty state placeholder shown when the user has no mesocycles.
-->
<script lang="ts">
  import { IconCalendar } from '@tabler/icons-svelte';
</script>

<div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
  <IconCalendar size={48} class="mb-3 opacity-40" />
  <p class="font-medium">No mesocycles yet</p>
  <p class="text-xs">Tap New to create your first training plan.</p>
</div>
