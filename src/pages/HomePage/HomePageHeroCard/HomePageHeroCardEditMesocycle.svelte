<!--
  @component

  Hero card state: the mesocycle is scheduled but not yet started.
-->
<script lang="ts">
  import { IconChevronRight, IconEdit } from '@tabler/icons-svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';

  let {
    mesocycleId,
    mesocycleTitle,
    startDate
  }: {
    mesocycleId: string;
    mesocycleTitle: string;
    startDate: Date;
  } = $props();
</script>

<Card class="ring-primary/30 ring-2">
  <CardHeader>
    <div class="flex items-center gap-2">
      <IconEdit size={18} class="text-primary" />
      <span class="text-sm font-semibold">{mesocycleTitle}</span>
    </div>
  </CardHeader>
  <CardContent class="flex flex-col gap-3">
    <p class="text-xs text-muted-foreground">
      Scheduled to start {startDate.toLocaleDateString()}
    </p>
    <Button size="sm" href="/mesocycle?mesocycleId={mesocycleId}">
      Edit Mesocycle
      <IconChevronRight size={14} />
    </Button>
  </CardContent>
</Card>
