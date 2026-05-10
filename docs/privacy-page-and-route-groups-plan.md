# Privacy Policy Page + Route Group Restructure

Goal: ship a publicly reachable `/privacy` URL so the Play Console listing has a working **Privacy policy** field (covers the privacy-policy slice of [`play-policy-compliance-plan.md`](./play-policy-compliance-plan.md) Step 1d and [`play-store-submission-plan.md`](./play-store-submission-plan.md) Step 1).

The page must be reachable without auth, share light/dark mode + view transitions with the app, and **not** render the TopBar/NavBar. The cleanest way to get that is a [SvelteKit layout group](https://svelte.dev/docs/kit/advanced-routing#Advanced-layouts-group) split: `(app)` for everything that requires login, `(marketing)` for the publicly-reachable static pages. The root `+layout.svelte` shrinks to truly shared concerns.

This plan only covers the privacy page. Terms and account-deletion pages can drop into `(marketing)/` later without reworking the structure.

---

## Step 1 — Split the root layout

Today `src/routes/+layout.svelte` does three jobs at once: shared shell (CSS + `<ModeWatcher />` + view-transition `onNavigate`), auth gate / app init, and app chrome (TopBar / NavBar / `<main>` / singleton dialogs). After this step the responsibilities are split across three files.

### 1a. Slim `src/routes/+layout.svelte` to shared shell only

Keep:
- `import '../globalStyles/global.css';`
- `<ModeWatcher />`
- The `onNavigate` view-transition handler (so transitions work across `(app)` ↔ `(marketing)` and within each group)
- `{@render children?.()}`

Remove from this file (move to `(app)/+layout.svelte` in 1b):
- `mounted` / `LocalData.init` / `password.hydrate` / `translations.hydrate` / `userConfig.hydrate` / `WorkoutAPIService.hydrate` / `WorkoutHydrationService.hydrateDocumentMaps`
- `loginState.init` / Login fallback / `LoginState` branching
- `timerService.init` / `nativePlatformService.init`
- `appIsVisible` visibility-change listener (it gates timer behavior, app-only)
- TopBar, NavBar, `<main>`, all `Singleton*Dialog` components
- All imports those used (`Login`, `NavBar`, `TopBar`, every `Singleton*`, `appIsVisible`, `password`, `translations`, `userConfig`, `loginState`, `LocalData`, `timerService`, `nativePlatformService`, `WorkoutAPIService`, `WorkoutHydrationService`, `page`, `browser`)

End state for the root layout: a couple dozen lines, no `mounted` state, no auth awareness.

### 1b. Create `src/routes/(app)/+layout.svelte`

This is essentially the deleted half of step 1a, lifted verbatim. Copy the auth init, `mounted` gating, Login fallback, TopBar / NavBar render, the `<main class="[view-transition-name:main-content] ...">` wrapper with the existing `md:pt-(--top-nav-height) pb-(--bottom-nav-height) md:pb-0 md:pl-48` classes (and the conditional `pt-(--top-nav-height)` for active timer), and all the `Singleton*Dialog` components. Take `children` via `$props()` and render it inside `<main>` exactly like today.

The view transition CSS rules in `global.css` (`::view-transition-old(main-content)` / `::view-transition-new(main-content)`) already key off the `main-content` name, so no CSS change is needed.

### 1c. Create `src/routes/(marketing)/+layout.svelte`

Minimal pass-through:
- Take `children` via `$props()`.
- Render a `<main class="[view-transition-name:main-content] mx-auto max-w-3xl px-4 py-8">` (or similar) wrapping `{@render children?.()}`.
- No TopBar/NavBar. No auth. No singleton dialogs. No `onMount` work.

The shared `<ModeWatcher />` from the root layout already handles light/dark; the shared `onNavigate` handles view transitions across the group boundary.

---

## Step 2 — Move existing routes under `(app)`

Move every current route folder + the root `+page.*`/`pageInfo.ts` into `src/routes/(app)/`. Folders: `analytics/`, `exercise/`, `library/`, `mesocycle/`, `mesocycles/`, `session/`, `sessions/`, `settings/`, `timer/`, plus `+page.svelte`, `+page.ts`, and `pageInfo.ts` (home). URLs do not change — SvelteKit groups are URL-invisible.

Then update `src/util/navInfo.ts` import paths from `$routes/<x>/pageInfo` to `$routes/(app)/<x>/pageInfo` (11 imports including `$routes/pageInfo` → `$routes/(app)/pageInfo`). No other file in the codebase imports from `$routes/` (verified by grep), so this is the only ripple.

---

## Step 3 — Add the privacy policy page

### 3a. Page component

Create `src/pages/PrivacyPolicyPage/PrivacyPolicyPage.svelte` following the existing `$pages/<Name>Page/<Name>Page.svelte` convention. Plain prose using Tailwind utilities (`flex flex-col gap-4`, `text-2xl font-semibold`, `prose`-style spacing via stacked utilities — no `@apply`, no inline styles, keep classes minimal per the styling rules). Include a small logo + "MesoPro" header at the top so the page is visually anchored without needing the TopBar.

Sections (must match the Data Safety answers in `play-store-submission-plan.md` Step 5 and the items in `play-policy-compliance-plan.md` Step 1d):
1. Last updated date (hard-coded string, easy to bump)
2. Summary paragraph
3. Data we collect — auth identifiers (Google account ID / username), workout/session/mesocycle documents, device + crash data
4. How it's used — providing the service; no advertising; no selling
5. Where it's stored — MongoDB Atlas (via `gcloud-backend`), Sentry (crash reporting)
6. Third parties — Google Sign-In, Sentry; link to each privacy policy
7. Retention — kept until account deletion
8. Account deletion — in-app Settings path **and** mention of the upcoming `/account/delete` URL (placeholder OK; replaced when that route lands as part of `play-policy-compliance-plan.md` Step 1d)
9. Children's policy — not directed at children under 13
10. Contact — `agneuhold@gmail.com`

Keep the legal text concise and readable; this is not a generated boilerplate dump.

### 3b. Route files

- `src/routes/(marketing)/privacy/+page.svelte` — imports `PrivacyPolicyPage` from `$pages/PrivacyPolicyPage/PrivacyPolicyPage.svelte` and renders it under a `<svelte:head>` that sets `<title>Privacy Policy · MesoPro</title>` and a meta description. Mirrors the existing pattern in `src/routes/settings/+page.svelte`.
- `src/routes/(marketing)/privacy/+page.ts` — `export const prerender = true;` so the static adapter emits real HTML at deploy time (Play crawls the URL; SPA fallback would not be acceptable).

No `pageInfo.ts` — marketing pages aren't part of `navInfo` and don't appear in the nav bar.

---

## Step 4 — Storybook integration

Wire the privacy page into the Full App Storybook so navigation from the app shell (e.g. a future Settings → Privacy Policy link) lands somewhere real.

### 4a. Marketing-paths constant

Add `src/routes/(marketing)/marketingPaths.ts` exporting a string-literal set of marketing URLs (initially just `'/privacy'`). Co-locating it with the `(marketing)` group keeps the source of truth next to the routes and makes future additions (terms, `/account/delete`) a one-line change. Export a small `isMarketingPath(path: string): boolean` helper alongside it.

### 4b. Branch `SBFullAppRouter.svelte`

Add a privacy branch using the same `routeState.path` pattern as existing routes:

```
{:else if routeState.path === '/privacy'}
  <PrivacyPolicyPage />
```

Import `PrivacyPolicyPage` from `$pages/PrivacyPolicyPage/PrivacyPolicyPage.svelte`. Keep the comparison string inline — the rest of the router does the same with hard-coded paths (`'/exercise/new'`) where there's no `navInfo` entry, and marketing pages deliberately don't have `navInfo` entries.

### 4c. Conditionally drop chrome in `SBFullAppShell.svelte`

Today the shell unconditionally renders `<TopBar>` + `<NavBar>` + the app-shell `<main>`. Production won't render those for `/privacy` (the `(marketing)` layout has no chrome), so the storybook should match.

Change the shell to:
- Compute `const isMarketing = $derived(isMarketingPath(routeState.path));`
- When `isMarketing`, render only `<main class="[view-transition-name:main-content] mx-auto max-w-3xl px-4 py-8"><SBFullAppRouter /></main>` (mirrors `(marketing)/+layout.svelte` from Step 1c).
- Otherwise render the existing TopBar + NavBar + app-shell `<main>` exactly as today.

Reuse the wrapper class string from `(marketing)/+layout.svelte` — if the two diverge later, that's a sign to extract a shared constant, but for one page it's fine to keep them identical inline.

### 4d. Component story

Also add `src/pages/PrivacyPolicyPage/PrivacyPolicyPage.stories.svelte` with one default story rendering `PrivacyPolicyPage` directly (no wrapper — the page is self-contained per the Storybook conventions in `copilot-instructions.md`). This gives an isolated view of the page outside the Full App scenario.

---

## Step 5 — Hook the URL into Play Console (manual, post-deploy)

After deploying, paste the resulting `https://<host>/privacy` URL into Play Console → **App content → Privacy policy** and into the **Main store listing → Privacy Policy URL** field. Verify the URL loads in a fresh incognito window before saving. (This step lives in the existing submission plan; called out here so it isn't lost.)

---

## Validation

- `pnpm lint --fix`
- `pnpm check` (catches any missed `$routes/` import after the move)
- `pnpm test`
- `pnpm dev` → visit `/` (logs in / renders app shell as before), `/settings` (still inside `(app)` shell), `/privacy` (no TopBar/NavBar, light/dark toggles still take effect from a prior session, content is readable on mobile + desktop widths)
- Open `/privacy` in an incognito window with no auth state — must render fully without redirecting to Login
- Navigate `/privacy` → `/` (or vice versa) and confirm the view transition still cross-fades the `<main>` regions
- `pnpm build` produces a static `build/privacy/index.html` with the policy text inlined

---

## Open questions / trade-offs

- **`(marketing)` vs. `(public)`.** The existing `play-policy-compliance-plan.md` Step 1d names the group `(public)`. This plan uses `(marketing)` per the user's direction; that name also accommodates a future landing page. If Terms / `account/delete` later prefer `(public)` semantics, they can still live alongside in the same `(marketing)` folder — the group name is implementation detail.
- **Marketing page header.** This plan includes a small logo + title so the page isn't headerless. If a future marketing landing page introduces a real marketing nav, factor it into `(marketing)/+layout.svelte` then; for one static page, doing it inline keeps the layout file truly minimal.
- **`prerender` consistency.** `src/routes/+page.ts` already prerenders. After the move that becomes `(app)/+page.ts` — still prerendered, no change. Worth a quick check that no app route accidentally relies on SSR (none do today; the adapter is `adapter-static`).
- **Privacy text source of truth.** Hard-coded in the `.svelte` file is the simplest path and matches the existing static-page pattern in this repo. A markdown-based pipeline is over-engineering for one page.
