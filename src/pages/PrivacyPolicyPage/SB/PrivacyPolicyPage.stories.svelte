<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import PrivacyPolicyPage from '../PrivacyPolicyPage.svelte';

  const { Story } = defineMeta({
    title: 'Pages/PrivacyPolicyPage',
    tags: ['!autodocs'],
    component: PrivacyPolicyPage,
    parameters: {
      layout: 'fullscreen'
    }
  });
</script>

<Story name="Default" />
