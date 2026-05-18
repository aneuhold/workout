# Asset Info

Where the brand source assets live and where each generated artifact lands.

## Source

All brand SVGs live in [`docs/officialAssets/`](officialAssets/).

## Generated

`pnpm generate:assets` regenerates everything. It runs [`scripts/generate-icons.ts`](../scripts/generate-icons.ts) (icons, splash, Play 512) and then [`scripts/play-store-assets/render-feature-graphic.ts`](../scripts/play-store-assets/render-feature-graphic.ts) (Playwright render of the feature graphic).

| Folder                       | Contents                                                           |
| ---------------------------- | ------------------------------------------------------------------ |
| `static/`                    | Favicon + wide light/dark logos                                    |
| `static/icons/`              | PWA launcher icons (48–192 px)                                     |
| `android/capacitor-assets/`  | Staging SVGs consumed by `@capacitor/assets`                       |
| `android/app/src/main/res/`  | Android launcher mipmaps + 12+ splash color + splash icon drawable |
| `android/play-store-assets/` | Play Store 512 icon + 1024×500 feature graphic                     |
