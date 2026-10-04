# Asset Info

Where the brand source assets live and where each generated artifact lands.

## Source

All brand SVGs live in [`docs/officialAssets/`](officialAssets/).

## Generated

Requires `rsvg-convert` (librsvg) and `magick` (ImageMagick) on the `PATH`, e.g. `brew install librsvg imagemagick`.

`pnpm generate:assets` regenerates everything in two steps:

1. [`scripts/commands/generate-icons/generate-icons.ts`](../scripts/commands/generate-icons/generate-icons.ts) renders the icons, splash, and Play 512 icon.
2. `vitest run -c testUtils/configs/vitest.screenshots.config.ts` ([config](../testUtils/configs/vitest.screenshots.config.ts)) runs every story tagged `playstore-asset` as a Vitest browser test through `@storybook/addon-vitest`, and saves a capture of each after its `play` function finishes. Stories render with the app's own CSS from `src/globalStyles/global.css`.
   - The feature graphic is [`SBPlayStoreFeatureGraphic.svelte`](../src/pages/SBFullApp/SBPlayStoreFeatureGraphic.svelte) (`Full App/Feature Graphic` in Storybook), captured at 1024×500.
   - Screenshot stories live in [`src/pages/SBFullApp/FullApp.Screenshots.stories.svelte`](../src/pages/SBFullApp/FullApp.Screenshots.stories.svelte) (`Full App/Store Assets` in Storybook), captured at 1080×1920. To add one, add a `<Story>` there with a `scenario`, and optionally a `route` to open or a `play` function for interactions. The PNG is named after the story's export name in kebab case, such as `active-session.png`.
   - All outputs are 24-bit PNGs with no alpha channel, per Google's [asset specs](https://support.google.com/googleplay/android-developer/answer/9866151).

| Folder                                   | Contents                                                           |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `static/`                                | Favicon + wide light/dark logos                                    |
| `static/icons/`                          | PWA launcher icons (48–192 px)                                     |
| `android/capacitor-assets/`              | Staging SVGs consumed by `@capacitor/assets`                       |
| `android/app/src/main/res/`              | Android launcher mipmaps + 12+ splash color + splash icon drawable |
| `android/play-store-assets/`             | Play Store 512 icon + 1024×500 feature graphic                     |
| `android/play-store-assets/screenshots/` | Phone screenshots rendered from tagged stories                     |
