<!--
  @component

  Performance analytics page. Available to MesoPro Supporters; everyone else
  sees the subscription paywall instead.
-->
<script lang="ts">
  import { WorkoutEntitlement } from '@aneuhold/core-ts-db-lib';
  import userConfigService from '$services/UserConfigService/UserConfig.service.svelte';
  import AnalyticsPagePaywall from './AnalyticsPagePaywall.svelte';
</script>

<div class="flex flex-col gap-4 p-4">
  {#if !userConfigService.entitlements[WorkoutEntitlement.Supporter]}
    <AnalyticsPagePaywall />
  {:else}
    <p class="text-muted-foreground">Analytics page coming soon.</p>
  {/if}
</div>
