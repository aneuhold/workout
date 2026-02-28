<!--
  @component

  Storybook decorator that mounts all singleton components (dialogs and confetti)
  so they are available in every story. Used as a global decorator in preview.ts.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Confetti from './Confetti/Confetti.svelte';
  import SingletonCalibrationFormDialog from './dialogs/SingletonCalibrationFormDialog/SingletonCalibrationFormDialog.svelte';
  import SingletonDeleteDialog from './dialogs/SingletonDeleteDialog/SingletonDeleteDialog.svelte';
  import SingletonDeloadDialog from './dialogs/SingletonDeloadDialog/SingletonDeloadDialog.svelte';
  import SingletonEquipmentFormDialog from './dialogs/SingletonEquipmentFormDialog/SingletonEquipmentFormDialog.svelte';
  import SingletonMoveSessionsDialog from './dialogs/SingletonMoveSessionsDialog/SingletonMoveSessionsDialog.svelte';
  import SingletonMuscleGroupFormDialog from './dialogs/SingletonMuscleGroupFormDialog/SingletonMuscleGroupFormDialog.svelte';

  let { children }: { children?: Snippet } = $props();
</script>

{@render children?.()}
<Confetti />
<SingletonCalibrationFormDialog />
<SingletonDeleteDialog />
<SingletonDeloadDialog />
<SingletonEquipmentFormDialog />
<SingletonMoveSessionsDialog />
<SingletonMuscleGroupFormDialog />
