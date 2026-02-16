<!--
  @component

  Placeholder row for late-assessment fields during active recording.
  Shows a clock icon with the field label, "Record later" subtext, and a brief reason.
-->
<script lang="ts">
  import { IconClock } from '@tabler/icons-svelte';

  let { label, reason }: { label: string; reason: string } = $props();
</script>

<div class="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
  <IconClock size={16} class="shrink-0 text-muted-foreground" />
  <div class="flex flex-col">
    <span class="text-sm text-muted-foreground">{label}</span>
    <span class="text-xs text-muted-foreground/70">Record later — {reason}</span>
  </div>
</div>
