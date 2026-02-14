<script lang="ts">
  import type { Snippet } from 'svelte';
  import SingletonMuscleGroupFormDialog from './SingletonMuscleGroupFormDialog.svelte';

  let { children }: { children?: Snippet } = $props();
</script>

{@render children?.()}
<SingletonMuscleGroupFormDialog />
