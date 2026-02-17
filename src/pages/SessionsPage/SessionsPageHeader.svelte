<!--
  @component

  Header for the sessions page with title, mesocycle subtitle, and link to plans.
-->
<script lang="ts">
  import { IconChevronRight } from '@tabler/icons-svelte';
  import Button from '$ui/Button/Button.svelte';

  let {
    mesocycleTitle
  }: {
    mesocycleTitle: string;
  } = $props();
</script>

<div class="flex items-center justify-between">
  <div class="flex flex-col">
    <h1 class="text-xl font-semibold">Sessions</h1>
    <p class="text-sm text-muted-foreground">{mesocycleTitle}</p>
  </div>
  <Button variant="ghost" size="sm" href="/mesocycles">
    View All Mesocycles
    <IconChevronRight size={14} />
  </Button>
</div>
