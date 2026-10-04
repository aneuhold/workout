# Asset Info

Where the brand source assets live and where each generated artifact lands.

## Source

All brand SVGs live in [`docs/officialAssets/`](officialAssets/).

## Generated

`pnpm generate:assets` regenerates everything in three steps:

1. [`scripts/commands/generate-icons/generate-icons.ts`](../scripts/commands/generate-icons/generate-icons.ts) renders the icons, splash, and Play 512 icon.
2. [`scripts/commands/renderFeatureGraphic/index.ts`](../scripts/commands/renderFeatureGraphic/index.ts) renders the 1024×500 feature graphic from [`feature-graphic.html`](../scripts/commands/renderFeatureGraphic/feature-graphic.html).
3. `vitest run -c testUtils/configs/vitest.screenshots.config.ts` ([config](../testUtils/configs/vitest.screenshots.config.ts)) runs every story tagged `playstore-screenshot` as a Vitest browser test through `@storybook/addon-vitest`, and saves a 1080×1920 capture of each after its `play` function finishes.
   - Screenshot stories live in [`src/pages/SBFullApp/FullApp.Screenshots.stories.svelte`](../src/pages/SBFullApp/FullApp.Screenshots.stories.svelte) (`Full App/Screenshots` in Storybook), which tags them all `playstore-screenshot`. To add one, add a `<Story>` there with a `scenario`, and optionally a `route` to open or a `play` function for interactions. The PNG is named after the story's export name in kebab case, such as `active-session.png`..
   - All outputs are 24-bit PNGs with no alpha channel, per Google's [asset specs](https://support.google.com/googleplay/android-developer/answer/9866151).

| Folder                                   | Contents                                                           |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `static/`                                | Favicon + wide light/dark logos                                    |
| `static/icons/`                          | PWA launcher icons (48–192 px)                                     |
| `android/capacitor-assets/`              | Staging SVGs consumed by `@capacitor/assets`                       |
| `android/app/src/main/res/`              | Android launcher mipmaps + 12+ splash color + splash icon drawable |
| `android/play-store-assets/`             | Play Store 512 icon + 1024×500 feature graphic                     |
| `android/play-store-assets/screenshots/` | Phone screenshots rendered from tagged stories                     |
