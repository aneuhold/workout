<script lang="ts">
  import type { Snippet } from 'svelte';
  import SingletonCalibrationFormDialog from './SingletonCalibrationFormDialog.svelte';

  let { children }: { children?: Snippet } = $props();
</script>

{@render children?.()}
<SingletonCalibrationFormDialog />
