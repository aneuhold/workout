<!--
  @component

  Account section for the Settings page. Holds the account management actions.
-->
<script lang="ts">
  import SettingsPageDeleteAccountButton from './SettingsPageDeleteAccountButton.svelte';
</script>

<section class="flex flex-col items-start gap-3">
  <div class="flex flex-col gap-1">
    <h2 class="font-medium">Account</h2>
    <p class="text-muted-foreground text-sm">
      Permanently delete your account and all of its data.
    </p>
  </div>
  <SettingsPageDeleteAccountButton />
</section>
