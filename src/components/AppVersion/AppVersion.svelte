<!--
  @component

  Renders the current app version as muted footer text. The literal
  `#DEV.VERSION#` placeholder is rewritten to the `package.json` version
  by `scripts/replaceDevVersion.ts` after `vite build`.
-->

<p class="text-muted-foreground mt-4 text-center text-xs">App Version: #DEV.VERSION#</p>
