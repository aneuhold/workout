<!--
  @component

  MesoPro Supporter card for the Settings page. Invites non-supporters to
  subscribe, and lets supporters see and manage their subscription.
-->
<script lang="ts">
  import { WorkoutEntitlement } from '@aneuhold/core-ts-db-lib';
  import { IconHeartFilled } from '@tabler/icons-svelte';
  import SupporterSubscribeButton from '$components/SupporterSubscribeButton/SupporterSubscribeButton.svelte';
  import LoggingService from '$services/LoggingService/Logging.service';
  import purchaseService from '$services/PurchaseService/Purchase.service';
  import userConfigService from '$services/UserConfigService/UserConfig.service.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardAction from '$ui/Card/CardAction.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardFooter from '$ui/Card/CardFooter.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import sharedTextConstants from '$util/sharedTextConstants';

  const log = LoggingService.createLogger('SettingsPageSupporterCard.svelte');

  let managementUrl = $state<string | null>(null);
  let isSupporter = $derived(userConfigService.entitlements[WorkoutEntitlement.Supporter]);
  let expiresAt = $derived(
    userConfigService.currentConfig?.entitlements[WorkoutEntitlement.Supporter]?.expiresAt
  );

  $effect(() => {
    if (isSupporter) {
      void loadManagementUrl();
    } else {
      managementUrl = null;
    }
  });

  async function loadManagementUrl() {
    try {
      managementUrl = await purchaseService.getManagementUrl();
    } catch (e) {
      log.warn('Failed to get the subscription management URL', e);
    }
  }
</script>

<Card class="bg-primary/5 ring-primary/30 ring-2">
  <CardHeader>
    <CardTitle class="flex items-center gap-2">
      <IconHeartFilled size={18} class="text-primary" />
      MesoPro Supporter
    </CardTitle>
    <CardDescription>
      {#if isSupporter}
        Thanks for supporting MesoPro!
        {#if expiresAt}
          Active until {expiresAt.toLocaleDateString()}.
        {/if}
      {:else}
        Unlock performance analytics and support MesoPro development for {sharedTextConstants.supporterPrice}.
      {/if}
    </CardDescription>
    {#if isSupporter}
      <CardAction>
        <Badge>Active</Badge>
      </CardAction>
    {/if}
  </CardHeader>
  {#if !isSupporter}
    <CardFooter>
      <SupporterSubscribeButton />
    </CardFooter>
  {:else if managementUrl}
    <CardFooter>
      <Button
        variant="outline"
        class="w-full"
        href={managementUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Manage subscription
      </Button>
    </CardFooter>
  {/if}
</Card>
