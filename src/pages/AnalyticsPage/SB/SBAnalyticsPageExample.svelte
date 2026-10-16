<script lang="ts">
  import { WorkoutEntitlement } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import userConfigServiceMock from '$services/UserConfigService/UserConfig.service.mock';
  import AnalyticsPage from '../AnalyticsPage.svelte';

  let { isSupporter = true }: { isSupporter?: boolean } = $props();

  $effect(() => {
    const supporter = isSupporter;

    untrack(() => {
      if (supporter) {
        userConfigServiceMock.grantEntitlement(WorkoutEntitlement.Supporter);
      } else {
        userConfigServiceMock.setEntitlementExpiresAt(WorkoutEntitlement.Supporter, null);
      }
    });

    return () => {
      untrack(() => {
        userConfigServiceMock.reset();
      });
    };
  });
</script>

<AnalyticsPage />
