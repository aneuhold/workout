<!--
  @component

  Empty state placeholder shown when search/filter yields no results.
-->
<script lang="ts">
  import { IconSearch } from '@tabler/icons-svelte';
</script>

<div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
  <IconSearch size={48} class="mb-3 opacity-40" />
  <p class="font-medium">No results found</p>
  <p class="text-xs">Try a different search or tab.</p>
</div>
