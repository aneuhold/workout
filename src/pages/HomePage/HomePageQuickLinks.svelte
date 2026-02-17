<!--
  @component

  Navigation shortcuts grid for quick access to key pages.
-->
<script lang="ts">
  import { IconCalendar, IconChartBar } from '@tabler/icons-svelte';
  import Button from '$ui/Button/Button.svelte';
</script>

<div class="grid grid-cols-2 gap-2">
  <Button variant="outline" href="/mesocycles">
    <IconCalendar size={16} />
    Plan Mesocycles
  </Button>
  <Button variant="outline" href="/analytics">
    <IconChartBar size={16} />
    View Analytics
  </Button>
</div>
