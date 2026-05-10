<script lang="ts">
  import PrivacyPolicyPage from '$pages/PrivacyPolicyPage/PrivacyPolicyPage.svelte';
  import { privacyPageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{privacyPageInfo.title}</title>
  <meta name="description" content={privacyPageInfo.description} />
</svelte:head>

<PrivacyPolicyPage />
