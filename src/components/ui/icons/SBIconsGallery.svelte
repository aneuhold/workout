<!--
  @component

  Storybook-only gallery that lists every icon in this folder.
  Add new icons to the `icons` array below as they're created.
-->
<script lang="ts">
  import type { Component } from 'svelte';
  import GoogleLogoIcon from './GoogleLogoIcon.svelte';

  const icons: { name: string; component: Component }[] = [
    { name: 'GoogleLogoIcon', component: GoogleLogoIcon }
  ];
</script>

<div class="grid grid-cols-3 gap-4 p-4 sm:grid-cols-4 md:grid-cols-6">
  {#each icons as { name, component: Icon } (name)}
    <div class="border-border flex flex-col items-center gap-2 rounded-lg border p-4 text-center">
      <Icon width={48} height={48} />
      <span class="text-muted-foreground text-xs">{name}</span>
    </div>
  {/each}
</div>
