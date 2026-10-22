<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { spyOn, userEvent, within } from 'storybook/test';
  import purchaseService from '$services/PurchaseService/Purchase.service';
  import { createBoolArgTypes } from '$storybook/storybookUtil';
  import SBAnalyticsPageExample from './SBAnalyticsPageExample.svelte';

  const { Story } = defineMeta({
    title: 'Pages/AnalyticsPage',
    tags: ['!autodocs'],
    component: SBAnalyticsPageExample,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      ...createBoolArgTypes('isSupporter')
    },
    args: {
      isSupporter: true
    }
  });

  /**
   * Starts a purchase from the paywall.
   *
   * @param canvasElement The story's root element.
   */
  const clickSubscribe = async (canvasElement: HTMLElement) => {
    await userEvent.click(within(canvasElement).getByTestId('subscribe-button'));
  };
</script>

<Story name="Default" />

<Story name="Paywall" args={{ isSupporter: false }} />

<!-- The purchase never settles, so the button stays in its processing state. -->
<Story
  name="Paywall - Processing"
  args={{ isSupporter: false }}
  beforeEach={() => {
    spyOn(purchaseService, 'purchaseEntitlement').mockReturnValue(new Promise(() => {}));
  }}
  play={async ({ canvasElement }) => {
    await clickSubscribe(canvasElement);
  }}
/>

<Story
  name="Paywall - Failed"
  args={{ isSupporter: false }}
  beforeEach={() => {
    spyOn(purchaseService, 'purchaseEntitlement').mockRejectedValue(
      new Error('Mock purchase failure')
    );
  }}
  play={async ({ canvasElement }) => {
    await clickSubscribe(canvasElement);
  }}
/>
