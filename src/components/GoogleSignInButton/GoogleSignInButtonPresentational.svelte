<!--
  @component

  Custom-branded "Continue with Google" button. Styled per Google's
  Sign in with Google brand guidelines. The hex colors below are kept
  inline (rather than promoted to CSS custom properties in `global.css`)
  because they apply only to this button per Google's guidelines — they
  must not be reused as a theme palette.
  https://developers.google.com/identity/branding-guidelines
-->
<script lang="ts">
  import GoogleLogoIcon from '$ui/icons/GoogleLogoIcon.svelte';

  let {
    onclick,
    disabled = false
  }: {
    onclick: () => void;
    disabled?: boolean;
  } = $props();
</script>

<button
  type="button"
  {disabled}
  {onclick}
  class="flex h-10 w-full items-center justify-center gap-3 rounded-lg border
    border-[#747775] bg-white text-sm font-medium text-[#1f1f1f] transition-colors
    hover:bg-[#f8f8f8] active:bg-[#f1f1f1] disabled:pointer-events-none disabled:opacity-50
    dark:border-[#8e918f] dark:bg-[#131314] dark:text-white dark:hover:bg-[#1f1f20] dark:active:bg-[#2a2a2c]"
>
  <GoogleLogoIcon width={18} height={18} />
  Continue with Google
</button>
