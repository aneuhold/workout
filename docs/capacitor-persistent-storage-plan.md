# Capacitor persistent storage plan

Sub-plan for Step 3 of [`capacitor-android-plan.md`](./capacitor-android-plan.md). Goal: replace `localStorage` with platform-appropriate native storage on Android (and later iOS) without changing what `LocalData` exposes to the rest of the codebase — `LocalData.ts` stays the single public entry point and is also where backend routing happens.

---

## Why two backends per platform

[`@capacitor/preferences`](https://capacitorjs.com/docs/apis/preferences) wraps `UserDefaults` (iOS) and `SharedPreferences` (Android). Both have practical limits the workout document maps will blow past:

- iOS hard cap: **4 MB** per app. Writes past that throw [`Attempting to store >= 4194304 bytes of data in CFPreferences/NSUserDefaults on this platform is invalid`](https://github.com/j3k0/cordova-plugin-openwith/issues/79).
- Android: no hard cap, but the [official guide](https://developer.android.com/training/data-storage/shared-preferences) says it's for "a relatively small collection of key-values"; the whole XML file is loaded into memory and rewritten per `apply()`, with OOM/ANR around 1–2 MB in practice.
- The Capacitor docs themselves warn: *"This API is not meant to be used as a local database. If your app stores a lot of data… we recommend taking a look at a SQLite-based solution."*

`localStorage` has the same problem on web: [MDN puts it at ~5 MiB per origin](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria). [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) is the standards-blessed answer for structured client-side storage at scale — *"Each browser determines, using whatever mechanism it chooses, the maximum amount of storage a given origin can use"*, with Chrome up to 60% of disk, Firefox up to 10 GiB best-effort, and Safari WebKit apps ~60%.

So we split per tier per platform:

| Tier | Native | Web | Contents |
|---|---|---|---|
| Small (<100 KB) | [`@capacitor/preferences`](https://capacitorjs.com/docs/apis/preferences) | `localStorage` | `password`, `username`, `userConfig`, `currentApiRequest` |
| Large (MB-scale) | [`@capacitor-community/sqlite`](https://github.com/capacitor-community/sqlite) (no encryption) | [`IndexedDB`](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) | `translations`, `apiRequestQueue`, all nine `*Map` document caches |

`@capacitor-community/sqlite` is MIT-licensed and free; we open the connection without an encryption secret so [SQLCipher](https://github.com/capacitor-community/sqlite#readme) is linked but unused. We deliberately do **not** add `jeep-sqlite` — the web build uses native IndexedDB instead, so no `sql-wasm.wasm` ships in the web bundle.

---

## Public API becomes async

Capacitor Preferences, SQLite, and IndexedDB are all async. Rather than fake a sync API with an in-memory mirror, `LocalData`'s getters/setters become async and call sites `await` them. Storage access on every platform here is fast enough that the real cost in this app is the network, not the disk.

Practical implications:

- `LocalData.password` and friends become methods (`getPassword()` / `setPassword(value)`) returning `Promise<…>`. Property-access getter/setter syntax doesn't compose with async, so the static-property style in the current `LocalData.ts` becomes static methods.
- Module-level reads at import time (e.g. `const initialTranslations = LocalData.translations ?? {}` in `src/stores/local/translations.ts:7`) move into a `hydrate()` method on the store, called from the same `+layout.svelte` `onMount` that already calls `WorkoutHydrationService.hydrateDocumentMaps()`.
- `WorkoutHydrationService.hydrateDocumentMaps()` becomes `async` and `Promise.all`s the per-service hydrates.
- Writes that don't need to be observed (most state-driven persistence) can be `void LocalData.setX(value)`. Writes that need to surface errors (e.g. saving a critical credential) can be awaited.

The existing `+layout.svelte` already gates UI on a `mounted` flag and shows "Loading…", so this slots in cleanly:

```ts
onMount(async () => {
  await LocalData.init();
  await WorkoutHydrationService.hydrateDocumentMaps();
  mounted = true;
  …
});
```

`LocalData.init()` opens the SQLite connection (native) or IndexedDB database (web), runs the one-time schema setup, and returns. Small-tier backends don't need init.

---

## File layout under `src/util/LocalData/`

```
src/util/LocalData/
├── LocalData.ts                       (public API + routing — single entry point)
├── ILocalDataBackend.ts               (interface: get/set/remove, all async)
├── PreferencesBackend.ts              (native small-tier — @capacitor/preferences)
├── LocalStorageBackend.ts             (web small-tier — window.localStorage)
├── SqliteBackend.ts                   (native large-tier — @capacitor-community/sqlite)
└── IndexedDbBackend.ts                (web large-tier — idb)
```

`LocalData.ts` instantiates the right pair of backends at module load (small + large) based on `Capacitor.isNativePlatform()` and `browser`, then every public method is a one-liner that delegates to the correct backend. No barrel file (per the `index.ts` rule in `copilot-instructions.md`); imports stay as `import LocalData from '$util/LocalData/LocalData'`.

A single `ILocalDataBackend` interface fits all four implementations:

```ts
export interface ILocalDataBackend {
  init?(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
```

Strings only — `LocalData.ts` keeps owning the JSON.stringify / `DateService.dateReviver` boundary it already does today, so backends stay dumb.

---

## SQLite schema (native large-tier)

```sql
CREATE TABLE IF NOT EXISTS document_blobs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

One row per logical key (`v4-mesocycleMap`, `v4-translations`, etc.); value is the JSON blob `LocalData` already produces. Like-for-like swap of `localStorage` semantics — no per-document schema, no flattening of maps, no behavior change for `JSON.parse(…, DateService.dateReviver)`. Per-document rows are a future optimization if write perf becomes the bottleneck; today the bottleneck is size, not write frequency, and SQLite handles MB-scale TEXT writes fine.

Connection setup (once at `init()`):

```ts
const sqlite = new SQLiteConnection(CapacitorSQLite);
const db = await sqlite.createConnection('workout', false, 'no-encryption', 1, false);
await db.open();
await db.execute('CREATE TABLE IF NOT EXISTS document_blobs (key TEXT PRIMARY KEY, value TEXT NOT NULL);');
```

Writes use `INSERT … ON CONFLICT(key) DO UPDATE` so the same statement works for create and update.

---

## IndexedDB schema (web large-tier)

Wrapped via [`idb`](https://github.com/jakearchibald/idb) (Jake Archibald's ~1.4 KB promise wrapper around the raw [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)). One object store mirroring the SQLite shape, with the key as the out-of-line key:

```ts
import { openDB } from 'idb';

const db = await openDB('workout', 1, {
  upgrade(db) {
    db.createObjectStore('documentBlobs');
  }
});

await db.get('documentBlobs', 'v4-mesocycleMap');
await db.put('documentBlobs', value, 'v4-mesocycleMap');
await db.delete('documentBlobs', 'v4-mesocycleMap');
```

Stored values are JSON strings, identical to what SQLite stores, so the `LocalData` JSON layer doesn't branch on platform.

---

## Implementation order

Each step ends in a green `pnpm lint --fix && pnpm check && pnpm test`, plus `npx cap sync android` and a manual smoke run on the emulator after the native steps.

1. **Refactor `LocalData` to async + introduce the backend interface**, with `LocalStorageBackend` (small-tier) and a temporary `LocalStorageBackend` reused for the large-tier slot. Update every call site to `await`. Web behavior unchanged; native still goes through the WebView's `localStorage`. This isolates the API-shape change from the platform change.
2. **`pnpm add idb`, add `IndexedDbBackend`** and route the large-tier slot to it on web. `LocalData.init()` opens the DB and creates the object store. Verify on the web build that all nine document maps and translations round-trip through IndexedDB; localStorage now only holds the small-tier keys.
3. **`pnpm add @capacitor/preferences @capacitor-community/sqlite`**, write `PreferencesBackend` and `SqliteBackend`, route both tiers to the native backends when `Capacitor.isNativePlatform()` is true. `npx cap sync android` and verify on the emulator.
4. **Audit oversized values**: log `value.length` for every key during init in dev builds; confirm nothing >100 KB lands on the small tier. Move keys between tiers in `LocalData.ts` if the audit surfaces a surprise.

---

## Validation checkpoints

In addition to the standard repo checks:

- **Web**: clear site data → log in → record a workout → reload: data is present without an API round-trip. DevTools → Application → IndexedDB shows the `workout` database with a populated `documentBlobs` store; `localStorage` shows only the small-tier keys.
- **Android**: fresh install on emulator → log in → record a workout → kill app → relaunch: data persists.
- **Android**: `adb shell run-as <package> ls databases/` shows the SQLite file; `adb shell run-as <package> cat shared_prefs/CapacitorStorage.xml` shows only the small-tier keys.
- Web bundle size and behavior are otherwise unchanged (no `jeep-sqlite`, no WASM).
