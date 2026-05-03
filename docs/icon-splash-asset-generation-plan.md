# Icon + Splash Asset Generation Plan (`@capacitor/assets`)

Implements the "Icon + splash asset generation" sub-step of `docs/capacitor-android-plan.md`. Generates Android adaptive launcher icons + splash variants from a single source SVG. PWA icon generation stays as-is. Splash plugin **runtime** configuration is out of scope (separate sub-step in the parent plan).

---

## Context

- Brand color `#009869` (manifest `theme_color`); manifest `background_color` `#000`.
- Source SVGs in `docs/officialAssets/`:
  - `logo-icon-circle.svg` — green-circle background + dumbbell, 512×512 viewBox. **The asset we want to drive everything from.**
  - `logo-icon.svg` — dumbbell only (unused; kept as brand asset).
  - `logo.svg` — wordmark (unused in code; kept as brand asset).
- Only one code path currently references any of these: the `generate:icons` npm script's `ICON=docs/officialAssets/logo-icon-circle.svg` (verified via grep).
- Android resources are still Capacitor's defaults (`mipmap-*/ic_launcher*.png` placeholders, `values/ic_launcher_background.xml` = `#FFFFFF`). Will be overwritten.
- Existing `generate:icons` emits PWA PNGs into `static/icons/` via ImageMagick. We **keep** it — `static/manifest.json` references those exact filenames. `@capacitor/assets --pwa` would emit a different filename set; switching breaks references for no benefit.

## How `@capacitor/assets` works (per upstream README)

- Reads from `./assets` or `./resources` by default; `--assetPath <path>` overrides.
- **Easy Mode**: a single `logo.png|svg` (or `icon.png|svg`, optional `logo-dark`) drives both icons and splashes. Background colors come from CLI flags. Recommended in the upstream docs.
- **Custom Mode**: separate `icon-only` / `icon-foreground` / `icon-background` / `splash` / `splash-dark` files for full control.

We use **Easy Mode** with `--assetPath docs/officialAssets` and rename our source to the conventional name. Zero duplication, single source of truth.

---

## Decisions / open questions

1. **Adaptive-icon background color**: brand green `#009869` (matches `theme_color`). Replaces current `#FFFFFF`. Confirm.
2. **Splash background**: `#000` to match manifest `background_color`. Logo (the green-circle icon) reads cleanly on black. Confirm — alternative is `#009869` everywhere.
3. **No `logo-dark`**: same logo works on both light and dark backgrounds (green circle on either). Skip until a clear visual reason emerges.
4. **Easy Mode trade-off**: the same source drives both adaptive-icon foreground and splash logo. Since `logo-icon-circle.svg` fills its viewBox edge-to-edge, aggressive Android mask shapes (squircle, rounded square) clip the green corners of the foreground — fine when the OS background is the same green, since the visual result is just "green circle in OS-shaped frame." If on-device testing shows the dumbbell itself getting clipped, switch to Custom Mode with a separately-shrunk `icon-foreground.svg`. Deferred — don't pre-build.

---

## Steps

### 1. Rename source so Easy Mode auto-discovers it

- `git mv docs/officialAssets/logo-icon-circle.svg docs/officialAssets/icon.svg`
- Update `package.json` `generate:icons` script: change `ICON=docs/officialAssets/logo-icon-circle.svg` → `ICON=docs/officialAssets/icon.svg`. Echo string can be tightened to match.
- Update the stale path reference in `docs/capacitor-android-plan.md` line 47 (`Source: docs/officialAssets/logo-icon-circle.svg` → `docs/officialAssets/icon.svg`).
- Wordmark `logo.svg` and `logo-icon.svg` are untouched (no references, no risk).

### 2. Install `@capacitor/assets`

- `pnpm add -D @capacitor/assets` — lands in `devDependencies` next to other `@capacitor/*` packages.

### 3. Add the generation script

- File: `package.json` (`scripts` block)
- Add:
  ```
  "generate:android-assets": "npx @capacitor/assets generate --android --assetPath docs/officialAssets --iconBackgroundColor '#009869' --iconBackgroundColorDark '#009869' --splashBackgroundColor '#000' --splashBackgroundColorDark '#000'"
  ```
- Chain it onto the existing `generate:icons` so a single `pnpm generate:icons` produces both PWA + Android assets: append ` && pnpm generate:android-assets` to the existing command.
- Add a one-line entry to `scriptsComments` explaining `generate:android-assets` (mention Easy Mode, the source path, and that the splash plugin is a separate concern).

### 4. Run generation and commit the output

- `pnpm generate:icons`
- Expected new/changed files (tool output — do not hand-edit):
  - `android/app/src/main/res/mipmap-{m,h,xh,xxh,xxxh}dpi/ic_launcher.png`
  - `android/app/src/main/res/mipmap-{m,h,xh,xxh,xxxh}dpi/ic_launcher_round.png`
  - `android/app/src/main/res/mipmap-{m,h,xh,xxh,xxxh}dpi/ic_launcher_foreground.png`
  - `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml` (regenerated)
  - `android/app/src/main/res/values/ic_launcher_background.xml` (color flips `#FFFFFF` → `#009869`)
  - `android/app/src/main/res/drawable-{port,land}-{m,h,xh,xxh,xxxh}dpi/splash.png` (10 files)
  - `android/app/src/main/res/drawable/splash.png`
- Commit Android resource changes alongside the rename, `package.json`, and `pnpm-lock.yaml`.

### 5. Spot-check the output on a real launcher

- Run `pnpm preview:android` — confirm launcher icon, adaptive mask, and splash all look right.
- Visual smoke-test is required; lint/check/test won't catch a broken-looking icon.

---

## Validation

- `pnpm lint --fix`
- `pnpm check`
- `pnpm test`
- Visual check on emulator (step 5).

---

## Out of scope

- Adding `@capacitor/splash-screen` plugin / configuring `SplashScreen` in `capacitor.config.ts` — separate sub-step.
- iOS asset generation — parent plan open question #1.
