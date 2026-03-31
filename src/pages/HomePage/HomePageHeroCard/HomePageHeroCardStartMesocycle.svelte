<!--
  @component

  Hero card state: the mesocycle is ready to start.
-->
<script lang="ts">
  import { IconChevronRight, IconSparkles } from '@tabler/icons-svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';

  let {
    mesocycleTitle,
    onStartMesocycle
  }: {
    mesocycleTitle: string;
    onStartMesocycle: () => void;
  } = $props();
</script>

<Card class="ring-primary/30 ring-2">
  <CardHeader>
    <div class="flex items-center gap-2">
      <IconSparkles size={18} class="text-primary" />
      <span class="text-sm font-semibold">{mesocycleTitle}</span>
    </div>
  </CardHeader>
  <CardContent class="flex flex-col gap-3">
    <p class="text-xs text-muted-foreground">
      Your plan will be optimized based on the latest calibration data.
    </p>
    <Button size="sm" onclick={onStartMesocycle}>
      Start Mesocycle
      <IconChevronRight size={14} />
    </Button>
  </CardContent>
</Card>
