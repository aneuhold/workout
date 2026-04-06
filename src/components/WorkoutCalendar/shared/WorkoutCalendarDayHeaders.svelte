<script lang="ts">
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
</script>

<div class="grid grid-cols-7 gap-1">
  {#each dayNames as name (name)}
    <div class="text-center text-xs text-muted-foreground py-1">{name}</div>
  {/each}
</div>
