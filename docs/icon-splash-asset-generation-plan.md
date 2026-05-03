# Icon + Splash Asset Generation Plan (`@capacitor/assets`)

Implements the "Icon + splash asset generation" sub-step of `docs/capacitor-android-plan.md`. Generates Android adaptive launcher icons + splash variants. Hooks into the existing `scripts/generate-icons.ts` so a single `pnpm generate:icons` produces PWA icons, wide logos, and Android assets. Splash plugin **runtime** configuration is out of scope (separate sub-step).

---

## Context

- Brand has been redesigned. `docs/officialAssets/` now contains 5 shape variants × 2 themes = 10 SVGs:
  - `logo-{light,dark}.svg` — wordmark
  - `logo-{light,dark}-icon.svg` — M-letterform on rounded-square solid background (`rx=64`)
  - `logo-{light,dark}-icon-circle.svg` — M-letterform on solid circle
  - `logo-{light,dark}-icon-circle-gradient-background.svg` — M-letterform on circle with radial gradient (light: white→mint; dark: faint glow→near-black `#06120f`)
  - `logo-{light,dark}-icon-gradient-background.svg` — M-letterform on rounded-square with radial gradient
  - Plus `logo-old-*.svg` (legacy, ignored).
- `scripts/generate-icons.ts` already exists, uses `rsvg-convert` (librsvg, picked over ImageMagick because of `userSpaceOnUse` gradient handling), and currently:
  - Renders `logo-dark-icon-circle-gradient-background.svg` to PWA PNGs (48–192) + favicon
  - Copies `logo-{light,dark}.svg` → `static/logo-{light,dark}.svg` for runtime theme switching in TopBar
- Android resources are currently Capacitor's defaults (`mipmap-*/ic_launcher*.png` placeholders, `values/ic_launcher_background.xml` = `#FFFFFF`). Overwritten on generation.
- Previous attempt (now reverted) used Easy Mode. **Easy Mode is too restrictive** here: one source must drive both adaptive-icon foreground and splash. With our new asset library we want the launcher to use the dark gradient icon (canonical brand) while the **splash respects light/dark theme** — that needs Custom Mode.

## How `@capacitor/assets` Custom Mode works (per upstream README)

- Reads from `--assetPath <path>` (default `./assets` or `./resources`).
- Custom Mode expects these filenames:
  - `icon-only.(png|jpg|svg)` — ≥1024×1024, drives legacy mipmap launcher PNGs
  - `icon-foreground.(png|jpg|svg)` — ≥1024×1024, drives adaptive-icon foreground layer
  - `icon-background.(png|jpg|svg)` — optional; if omitted, `--iconBackgroundColor` flag fills in
  - `splash.(png|jpg|svg)` — ≥2732×2732, full splash image (no auto-centering)
  - `splash-dark.(png|jpg|svg)` — same, used in `drawable-night-*/`
- Custom Mode does NOT have an `icon-foreground-dark` slot — Android adaptive icons have no native dark variant pre-Android 13's monochrome-icon feature. Light/dark control is splash-only.

## Source-to-slot mapping (the part the user wants control over)

Defined as a single grouped constant `ANDROID_ASSETS` at the top of `scripts/generate-icons.ts` so all Android settings live together and swapping is a one-line edit:

| cap-assets slot      | Source SVG                                                          | Notes                                                                                               |
| -------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `icon-only.svg`      | `logo-dark-icon-circle-gradient-background.svg`                     | Matches existing PWA icon source. Visible on Android <8 launchers.                                  |
| `icon-foreground.svg`| `logo-dark-icon-circle-gradient-background.svg`                     | Used as adaptive-icon foreground. Opaque, so background flag mostly cosmetic.                       |
| (background color)   | `--iconBackgroundColor '#06120f'`                                   | Dark gradient edge color — blends if OS mask cuts the foreground circle.                            |
| `splash.svg`         | wrapper around `logo-light-icon-circle-gradient-background.svg` on `#ffffff` | Centered at ~37% of 2732×2732 canvas so logo doesn't fill the device screen edge-to-edge. |
| `splash-dark.svg`    | wrapper around `logo-dark-icon-circle-gradient-background.svg` on `#0a1814` | Same wrapper, dark background.                                                            |

Sketch of the constant (final shape decided in step 3):

```ts
const ANDROID_ASSETS = {
  outputDir: 'android/capacitor-assets',
  sources: {
    iconOnly: `${ASSETS_DIR}/logo-dark-icon-circle-gradient-background.svg`,
    iconForeground: `${ASSETS_DIR}/logo-dark-icon-circle-gradient-background.svg`,
    splashLogoLight: `${ASSETS_DIR}/logo-light-icon-circle-gradient-background.svg`,
    splashLogoDark: `${ASSETS_DIR}/logo-dark-icon-circle-gradient-background.svg`
  },
  colors: {
    iconBackground: '#06120f',
    splashBackgroundLight: '#ffffff',
    splashBackgroundDark: '#0a1814'
  }
} as const;
```

---

## Steps

### 1. Install `@capacitor/assets` + allow sharp's postinstall

- `pnpm add -D @capacitor/assets`
- Add `pnpm.onlyBuiltDependencies: ["sharp"]` to `package.json` so the native binding actually installs (pnpm 10 blocks postinstall scripts by default; cap-assets relies on `sharp` for image processing). Without this, generation fails with `Cannot find module '../build/Release/sharp-darwin-arm64v8.node'`.
- Re-run `pnpm install` so sharp's postinstall runs.

### 2. Extend `scripts/generate-icons.ts`

Single file edit. Additions:

- New grouped constant `ANDROID_ASSETS` (shape sketched above) — single object with `outputDir`, `sources`, and `colors` sub-keys.
- New helper `buildSplashWrapperSvg(sourceSvgPath, bgColor)` — reads the source SVG, extracts its inner content with a single regex, and emits a 2732×2732 wrapper SVG: `<svg viewBox="0 0 2732 2732"><rect ... fill="${bg}"/><svg x="866" y="866" width="1000" height="1000" viewBox="0 0 512 512">{inner}</svg></svg>`. Nested SVG with its own viewBox is valid; cap-assets/sharp rasterizes it via librsvg.
- New function `generateAndroidAssets()`:
  - `mkdirSync(ANDROID_ASSETS.outputDir, { recursive: true })` (creates `android/capacitor-assets/` if missing)
  - `copyFileSync` the `iconOnly` and `iconForeground` sources into `android/capacitor-assets/icon-only.svg` and `android/capacitor-assets/icon-foreground.svg`
  - `writeFileSync` the two wrapper SVGs into `android/capacitor-assets/splash.svg` and `android/capacitor-assets/splash-dark.svg`
  - Invoke cap-assets via `pnpm exec` (no `npx`): `execFileSync('pnpm', ['exec', 'capacitor-assets', 'generate', '--android', '--assetPath', ANDROID_ASSETS.outputDir, '--iconBackgroundColor', ANDROID_ASSETS.colors.iconBackground, '--iconBackgroundColorDark', ANDROID_ASSETS.colors.iconBackground, '--splashBackgroundColor', ANDROID_ASSETS.colors.splashBackgroundLight, '--splashBackgroundColorDark', ANDROID_ASSETS.colors.splashBackgroundDark], { stdio: 'inherit' })`
  - **No cleanup** — `android/capacitor-assets/` is committed alongside the generated `android/app/src/main/res/` outputs so the inputs are auditable.
- Call `generateAndroidAssets()` last (after `generateIcons()` and `copyWideLogos()`).

The script keeps the existing manual cadence — it's only run when icons are updated (`pnpm generate:icons`), not on every build. No script-name change needed.

**Path note**: `android/capacitor-assets/` sits alongside `android/app/`. Gradle/Cap won't pick it up (nothing in `settings.gradle` references it; `cap sync` writes only into `android/app/`). It's ordinary source-controlled content that just happens to live inside the Android tree. Should not cause issues.

### 3. Run + inspect

- `pnpm generate:icons`
- Expected output (cap-assets writes ~74 files into `android/app/src/main/res/`):
  - `mipmap-{ldpi…xxxhdpi}/ic_launcher{,_round,_foreground,_background}.png`
  - `mipmap-anydpi-v26/ic_launcher{,_round}.xml` regenerated — the new layout references `@mipmap/ic_launcher_background` (PNG) instead of `@color/ic_launcher_background`.
  - `drawable[-port|-land][-night]-{ldpi…xxxhdpi}/splash.png`
  - `AndroidManifest.xml` may get a cosmetic whitespace reformat from cap-assets — accept it (regenerating would re-apply it anyway).
- **Delete orphaned `values/ic_launcher_background.xml`** — the new launcher XML no longer references its color resource. Verify no other XML references it before deleting (`grep -rn ic_launcher_background android/`).

### 4. Spot-check on a launcher

- `pnpm preview:android` — confirm launcher icon, mask shape, light splash, and dark splash all look right.
- Visual check is required; lint/check/test won't catch a broken-looking icon.

---

## Validation

- `pnpm lint --fix`
- `pnpm check`
- `pnpm test`
- Visual check on emulator (step 4).

---

## Out of scope

- Adding `@capacitor/splash-screen` plugin / configuring `SplashScreen` in `capacitor.config.ts` — separate sub-step.
- iOS asset generation — parent plan open question #1. Custom Mode would generate iOS assets too if `--ios` were added; deliberately holding off.
- Themed (monochrome) adaptive icons for Android 13+ — separate enhancement.
