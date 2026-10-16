<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { spyOn } from 'storybook/test';
  import purchaseService from '$services/PurchaseService/Purchase.service';
  import { createBoolArgTypes } from '$storybook/storybookUtil';
  import SBSettingsPageExample from './SBSettingsPageExample.svelte';

  const { Story } = defineMeta({
    title: 'Pages/SettingsPage',
    tags: ['!autodocs'],
    component: SBSettingsPageExample,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      ...createBoolArgTypes('isSupporter')
    },
    args: {
      isSupporter: false
    },
    beforeEach: () => {
      // The purchase provider is disabled in Storybook, so a supporter would have nothing to manage
      spyOn(purchaseService, 'getManagementUrl').mockResolvedValue(
        'https://play.google.com/store/account/subscriptions'
      );
    }
  });
</script>

<Story name="Default" />

<Story name="Supporter" args={{ isSupporter: true }} />
