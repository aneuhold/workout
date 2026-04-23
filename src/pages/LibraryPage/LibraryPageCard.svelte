<!--
  @component

  Shared expandable card scaffold for Library page entries (exercises,
  muscle groups, equipment). Renders the outer card shell, the collapsed
  header button, the expand chevron, and the expand/collapse transition.
  Callers supply a `header` snippet for the title block and a `body`
  snippet for the expanded content.
-->
<script lang="ts">
  import { IconChevronDown } from '@tabler/icons-svelte';
  import type { Snippet } from 'svelte';
  import { slide } from 'svelte/transition';
  import Separator from '$ui/Separator/Separator.svelte';

  let {
    typeLabel,
    expanded,
    onToggle,
    header,
    body
  }: {
    typeLabel: string | null;
    expanded: boolean;
    onToggle: () => void;
    header: Snippet;
    body: Snippet;
  } = $props();
</script>

<div
  class="bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl text-sm ring-1 ring-foreground/10"
>
  <button
    class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
    onclick={onToggle}
  >
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      {#if typeLabel !== null}
        <span class="text-xs text-muted-foreground">{typeLabel}</span>
      {/if}
      {@render header()}
    </div>
    <IconChevronDown
      size={16}
      class="shrink-0 text-muted-foreground transition-transform duration-200
        {expanded ? 'rotate-180' : ''}"
    />
  </button>

  {#if expanded}
    <div transition:slide={{ duration: 200 }}>
      <Separator />
      <div class="flex flex-col gap-3 px-3 py-3">
        {@render body()}
      </div>
    </div>
  {/if}
</div>
