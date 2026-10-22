<!--
  @component

  Storybook wrapper for AnalyticsPage that sets whether the current user holds
  the Supporter entitlement.
-->
<script lang="ts">
  import { WorkoutEntitlement } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import userConfigServiceMock from '$services/UserConfigService/UserConfig.service.mock';
  import AnalyticsPage from '../AnalyticsPage.svelte';

  let { isSupporter = true }: { isSupporter?: boolean } = $props();

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

<AnalyticsPage />
