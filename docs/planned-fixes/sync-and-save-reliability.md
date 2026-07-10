# Sync + Save Reliability (API queue hardening)

This doc covers **four issues that all live in the same choke point**:
`src/services/WorkoutAPI.service.ts` → `#processApiRequests()` / `#callWorkoutAPI()`.
Issues 1-3 are reported; Issue 4 (dropped-write-on-failure) surfaced while investigating the others.

Because all edit the same method, they must be done in **one worktree / one pass**
to avoid conflicts. They are distinct fixes, not one, but they share the same
error-classification rework.

Original reports:
1. "For a bit it only showed very few sets for the current mesocycle, and only showed half the workouts for the current day's session." (data correctness)
2. "It infinitely had the sync icon." (stuck state)
3. "It doesn't tell you you need to log back in, it just makes it so things don't save anymore and gives an error at the top right on the cloud icon." (auth expiry not surfaced)

---

## How sync works today (shared context)

- `WorkoutAPIService.queryApi()` pushes requests onto an in-memory queue and kicks off `#processApiRequests()`.
- `#processApiRequests()` (`WorkoutAPI.service.ts:156-201`) sets `apiActivityService.setSyncing()`, drains the queue by calling `#callWorkoutAPI()` per request, shallow-merges each request's output into `combinedOutput`, then at the end calls `setError()` or `setSuccess()` and applies the combined output.
- `apiActivityService` (`src/services/ApiActivityService/ApiActivity.service.svelte.ts`) holds rune state (`Idle/Syncing/Success/Error`); `src/components/TopBar/SyncIndicator.svelte` renders the cloud icon off that state.
- Network path: app → `@aneuhold/core-ts-api-lib` `APIService.callWorkoutAPI` → `GCloudAPIService.#call` → `fetch()`.
- Tokens live in the `userConfig` local store, pushed into the API lib via `APIService.setAccessToken`/`setRefreshTokenString` at login (`src/services/Auth.service.ts`) and boot (`src/stores/session/loginState.ts`).

---

## Issue 1 — "very few sets / half the workouts" (data correctness) — CONFIRMED

### Root cause
Batched API output clobbers full stores with a mutation's echoed subset.

1. `getInitialData()` enqueues a request that gets **everything** with `all: true` per doctype (`WorkoutAPI.service.ts:120-134`).
2. The backend echoes inserted/updated docs back keyed by doctype (e.g. `gcloud-backend/build/routes/project/workout/WorkoutCreation.service.js:38,44`, `WorkoutUpdate.service.js:42,49`).
3. In `#processApiRequests` the whole queue is drained into **one** combined result before anything is applied:
   - `combinedInput.get = { ...combinedInput.get, ...currentRequest.get }` (`:172`) keeps the `all: true` flags.
   - `combinedOutput = { ...combinedOutput, ...result }` (`:178`) shallow-merges — **last write wins per doctype**.
4. When an initial-data request and a set/session-exercise mutation land in the **same batch**, the later mutation overwrites `combinedOutput.sets` / `combinedOutput.sessionExercises` with just its one or two echoed docs, while `combinedInput.get.sets.all` is still `true`.
5. `WorkoutAPIResponseHandlingService.processWorkoutApiOutput` (`src/services/WorkoutAPIResponseHandling.service.ts:38-46`) sees `get.sets.all` truthy and calls `setMapService.setMap(<subset>)` — **replacing the whole set store with the tiny subset**. Same for `sessionExercises`.

Why the symptoms match: home/session views assemble via order-array walks that silently drop IDs missing from the child map (`DocumentMapStore.service.svelte.ts:76-78` `getDocsWithIds` filters `undefined`; chained through `SessionMap.getOrderedSetsForSession`, `SessionExerciseMap.getOrderedSetsForSessionExercise`). Clobber the set/sessionExercise store to a subset → "very few sets" and "half the workouts."

Why intermittent: only triggers when a write is enqueued into the *same* drain cycle as the `getInitialData` fetch (login / app-becoming-visible window — `loginState.ts:65`, `appIsVisible.ts:15`). Next clean fetch restores it. Order-dependent (mutation-after-initial clobbers; initial-after-mutation does not).

### Fix direction
Do not gate `setMap` (full-store replacement) on accumulated `all` flags when the combined output for that doctype came from a non-`all` mutation. Cleaner: **apply each request's result on its own** rather than shallow-merging all outputs into one blob, or track per-doctype whether the output originated from an `all` get vs a mutation echo and only full-replace for the former.

---

## Issue 2 — infinite sync icon (stuck state) — CONFIRMED

### Root cause
`#processApiRequests` has **no try/catch/finally** around the `await #callWorkoutAPI(...)` loop (`WorkoutAPI.service.ts:156-201`). `#callWorkoutAPI` (`:203-218`) awaits `APIService.callWorkoutAPI` with no guard, and the lib's `GCloudAPIService.#fetchAndDecode` calls raw `fetch()`, which **rejects on any transport error** (offline, DNS, CORS, dropped connection). That rejection aborts `#processApiRequests` mid-loop, so:

- `apiActivityService.setSyncing()` was set (`:158`) but neither `setSuccess()` nor `setError()` (`:196-200`) is ever reached → cloud icon stays on `IconCloudUp` forever.
- `#processingRequestQueue` is left `true` (never reset from `:157`) → future `queryApi` calls see the flag set (`:73`) and never restart the queue → **saves silently stop too**.

Note the API lib deliberately returns `success:false` for HTTP-level errors and JSON parse failures, so those are already handled; only a **thrown/rejected fetch** (transport failure) causes the stuck state. There is also a secondary lost-wakeup risk: an item enqueued between the `while` seeing an empty queue (`:162`) and `#processingRequestQueue = false` (`:195`) is never processed until another trigger.

### Fix direction
Wrap the loop body in try/catch/finally. Put `#processingRequestQueue = false` in `finally` so the queue flag can never stick. Treat a thrown call as `hadError = true` (or `setError()` in catch) so the icon always resolves. Consider re-checking the queue in `finally` (or after clearing the flag) to close the lost-wakeup gap. Decide desired behavior for transient offline errors (currently failed items are dropped, not retried — see commented-out block near `:189-193`).

---

## Issue 3 — expired login not surfaced (auth expiry) — CONFIRMED

### Root cause
On an expired access token the backend returns 401; the lib auto-refreshes (`GCloudAPIService.#call` → `#tryRefreshTokens()`, retries once, fires `onTokensRefreshed` which `loginState.ts:43-45` persists). Once the **refresh token** is also expired, `#tryRefreshTokens()` returns false and the call resolves as `{ success: false, errors: [...] }`. In `#callWorkoutAPI` (`WorkoutAPI.service.ts:211-217`) only `result.success` is checked — `result.errors` (which carry the 401/auth info) are logged and discarded, returning `null` → `hadError = true` → red `IconCloudOff`.

There is **no code that maps an auth failure to `loginState.set(LoginState.LoggedOut)`** or prompts re-login. An auth failure is indistinguishable from a generic network failure at this layer, so the user just sees the error icon and silent save failure.

#### Production evidence (Sentry WORKOUT-P, user polarBar, 2026-07-08)

Breadcrumbs from a native-app app-start (build 1.1.4):

```
Getting initial data...
POST /project/workout   → 401      (access token expired)
POST /auth/refresh      → 201      (refresh attempt)
→ result surfaced to app: { data:{}, success:false,
                            errors:["Response did not match the expected APIResponse shape"] }
```

The lib refreshes on 401 and retries once (`GCloudAPI.service.ts:178-193`), but the retried
`/project/workout` response fails `#isAPIResponseShape` (`:259-270`), collapsing the 401 into a
generic `success:false`. The auth origin is gone by the time it reaches `#callWorkoutAPI`, so the
app logs `[WorkoutAPIService.ts] Error processing API request` (WORKOUT-P) and shows the error
icon with no re-login prompt. Whether the malformed retry body is itself a 401 error body that
does not match the APIResponse shape, or a genuinely different backend response, is not yet
confirmed from the trace alone.

### Fix direction
Make auth failures distinguishable and actionable:
- The API lib currently swallows the 401 into a generic `success:false`. Add an explicit auth-expired signal on the response (a typed error / flag) **or** an `onAuthExpired` callback analogous to `onTokensRefreshed`. This is a small `@aneuhold/core-ts-api-lib` change (see `~/Development/GithubRepos/ts-libs/packages/core-ts-api-lib/src/services/GCloudAPIService/GCloudAPI.service.ts` — `#call:178-193`, `#tryRefreshTokens:200-223`).
- In the app, route an auth error to `loginState.set(LoginState.LoggedOut)` plus a user-facing "please log in again" prompt. Wire it in `src/stores/session/loginState.ts` next to `onTokensRefreshed`.

---

## Issue 4 — a failed write is dropped from the queue (data loss)

### Root cause

`#processApiRequests` (`WorkoutAPI.service.ts:162-194`) removes each request from the queue before
sending it and does not put it back when the call fails:

```js
const currentRequest = this.#inMemoryApiRequestQueue.shift();  // removed up front
const result = await this.#callWorkoutAPI(currentRequest);
if (result) { combinedOutput = { ...combinedOutput, ...result }; } else { hadError = true; }
// on failure: no re-queue (the retry block at :189-193 is commented out)
```

So any write (insert / update / delete) whose call returns `success:false` or throws is discarded.
The document was already written to local storage synchronously via `persistToLocalData`, so it
keeps showing in the UI, but it never reaches the backend. A later successful `get { all: true }`
then replaces the store with backend truth (Issue 1 path), and the never-synced document disappears.

This is the mechanism that turns a transient failure (offline, expired token per Issue 3, or a
malformed response) into permanent, silent data loss rather than a retry.

### Fix direction

On a failed write, re-queue it (or persist it to a durable pending-writes list) instead of dropping
it, and retry once connectivity / auth is restored. Distinguish auth failures (Issue 3) so an
expired token pauses the queue and prompts re-login rather than draining and dropping every pending
write. Be careful not to re-queue a `get` the same way, and cap retries to avoid an infinite loop.

---

## Key files

App:
- `src/services/WorkoutAPI.service.ts` — the queue loop; all three issues converge here.
- `src/services/WorkoutAPIResponseHandling.service.ts` — the `all`-gated full-store replacement (Issue 1).
- `src/services/DocumentMapStore.service.svelte.ts` — `setMap` / silent-drop assembly (`:76-78`, `:197-200`).
- `src/services/ApiActivityService/ApiActivity.service.svelte.ts` — sync state machine (Issue 2).
- `src/components/TopBar/SyncIndicator.svelte` — cloud icon UI.
- `src/services/Auth.service.ts`, `src/stores/session/loginState.ts` — login state + token wiring (Issue 3).

Library:
- `~/Development/GithubRepos/ts-libs/packages/core-ts-api-lib/src/services/GCloudAPIService/GCloudAPI.service.ts` — fetch/401/refresh (Issue 3 needs a small change here).

Backend (reference only, confirms Issue 1 echo behavior):
- `gcloud-backend/build/routes/project/workout/Workout.service.js:50`, `WorkoutCreation.service.js:38,44`, `WorkoutUpdate.service.js:42,49`.

---

## Suggested approach / order

1. **Refactor error classification once** in `#callWorkoutAPI`: classify a call outcome as transport error / auth error / generic API error / success. This is the shared foundation for Issues 2 and 3.
2. **Issue 2**: guarantee state + flag reset via try/finally so the icon and queue can never stick.
3. **Issue 3**: branch auth errors to logout + re-login prompt (needs the small API-lib signal).
4. **Issue 1**: fix the combined-output application so a mutation echo never full-replaces a store that a batched `all` get was supposed to populate. This is more self-contained but lives in the same method/response handler, so keep it in the same worktree.

## How to reproduce
- Issue 1: log in (or background/foreground to trigger initial fetch); while it's in flight, log/add a set; observe the current mesocycle drop to a handful of sets and the session show half its exercises until the next clean refetch. Add a temp log in `processWorkoutApiOutput` printing `output.sets.length` vs the request's `get.sets.all`.
- Issue 2: force a transport-level fetch rejection (go offline mid-sync) and confirm the icon sticks and subsequent saves stop.
- Issue 3: invalidate/expire the refresh token and confirm the app shows the error icon with no re-login prompt.

## Tests
- Deterministic unit test for Issue 1: feed a combined input (initial `all` get) + a second output containing only `sets: [oneSet]`; assert the store is NOT reduced to one.
- Unit test for Issue 2: make `#callWorkoutAPI` throw; assert `#processingRequestQueue` resets and sync state ends in error (not syncing).
- Unit test for Issue 3: simulate the auth-expired signal; assert login state flips to logged out and the prompt fires.

## Before done
Run `pnpm lint --fix`, `pnpm check`, `pnpm test`. If the API lib is changed, follow `~/Development/GithubRepos/ts-libs/.github/copilot-instructions.md`, add tests, and wait ~6s for propagation.
