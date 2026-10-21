<!--
  @component

  Storybook wrapper for SettingsPage that sets whether the current user holds
  the Supporter entitlement.
-->
<script lang="ts">
  import { WorkoutEntitlement } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import userConfigServiceMock from '$services/UserConfigService/UserConfig.service.mock';
  import SettingsPage from '../SettingsPage.svelte';

  let { isSupporter = false }: { isSupporter?: boolean } = $props();

  $effect(() => {
    if (isSupporter) {
      untrack(() => {
        userConfigServiceMock.grantEntitlement(WorkoutEntitlement.Supporter);
      });
    }

    return () => {
      untrack(() => {
        userConfigServiceMock.reset();
      });
    };
  });
</script>

<SettingsPage />
