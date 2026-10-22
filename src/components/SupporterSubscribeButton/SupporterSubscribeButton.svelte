<!--
  @component

  The one way into the MesoPro Supporter purchase, so every place that offers
  the subscription handles progress and failures the same way.
-->
<script lang="ts">
  import { WorkoutEntitlement } from '@aneuhold/core-ts-db-lib';
  import { IconLoader2 } from '@tabler/icons-svelte';
  import LoggingService from '$services/LoggingService/Logging.service';
  import purchaseService from '$services/PurchaseService/Purchase.service';
  import Button from '$ui/Button/Button.svelte';

  const log = LoggingService.createLogger('SupporterSubscribeButton.svelte');

  let processing = $state(false);
  let purchaseFailed = $state(false);

  async function handleSubscribe() {
    processing = true;
    purchaseFailed = false;
    try {
      await purchaseService.purchaseEntitlement(WorkoutEntitlement.Supporter);
    } catch (e) {
      log.error('Supporter purchase failed', e);
      purchaseFailed = true;
    } finally {
      processing = false;
    }
  }
</script>

<div class="flex w-full flex-col gap-2">
  <Button data-testid="subscribe-button" disabled={processing} onclick={handleSubscribe}>
    {#if processing}
      <IconLoader2 class="animate-spin" />
      Subscribing...
    {:else}
      Subscribe
    {/if}
  </Button>
  {#if purchaseFailed}
    <p class="text-destructive text-sm">The purchase could not be completed. Please try again.</p>
  {/if}
</div>
