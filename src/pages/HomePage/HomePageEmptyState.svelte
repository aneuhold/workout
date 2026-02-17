<!--
  @component

  Empty state shown when there is no active mesocycle on the home page.
-->
<script lang="ts">
  import { IconBarbell, IconChevronRight } from '@tabler/icons-svelte';
  import Button from '$ui/Button/Button.svelte';
</script>

<div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
  <IconBarbell size={48} class="mb-3 opacity-40" />
  <p class="font-medium">No active mesocycle</p>
  <p class="mb-4 text-xs">Create a mesocycle to start planning sessions.</p>
  <Button variant="outline" size="sm" href="/mesocycles">
    View Mesocycles
    <IconChevronRight size={14} />
  </Button>
</div>
