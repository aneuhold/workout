<script lang="ts">
  import type { NonogramKatanaUpgradeName } from '@aneuhold/core-ts-db-lib';
  import nonogramKatanaUpgradeMapService from '$services/NonogramKatana/NonogramKatanaUpgradeMapService';
  import { nonogramKatanaUpgradesDisplayInfo } from './nonogramKatanaUpgradesDisplayInfo';

  let { upgradeName }: { upgradeName: NonogramKatanaUpgradeName } = $props();
  let upgrade = $derived(nonogramKatanaUpgradeMapService.getUpgradeByName(upgradeName));
  let upgradeDisplayName = $derived(nonogramKatanaUpgradesDisplayInfo[upgradeName].displayName);
</script>

<li>{upgrade?.completed ? '✅ ' : '❌ '}{upgradeDisplayName}</li>
