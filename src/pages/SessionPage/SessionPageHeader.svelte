<!--
  @component

  Header for the session page with back button, title, and optional description.
-->
<script lang="ts">
  import { IconArrowLeft } from '@tabler/icons-svelte';
  import Button from '$ui/Button/Button.svelte';

  let {
    title,
    description
  }: {
    title: string;
    description?: string | null;
  } = $props();
</script>

<div class="flex items-center gap-2">
  <Button variant="ghost" size="sm" onclick={() => history.back()}>
    <IconArrowLeft size={16} />
  </Button>
  <div class="flex flex-col">
    <h1 class="text-xl font-semibold">{title}</h1>
    {#if description}
      <p class="text-sm text-muted-foreground">{description}</p>
    {/if}
  </div>
</div>
