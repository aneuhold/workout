# Workout API queue plan

Reworks how workout API requests are queued and sent so that saves are never silently dropped, the sync icon can't get stuck, and a full refresh can't wipe local data. Supersedes `docs/planned-fixes/sync-and-save-reliability.md`, which is deleted as part of this work.

## Problems this fixes

From the old doc, still present in `src/services/WorkoutAPIService/WorkoutAPI.service.ts`:

1. A mutation's echoed output replaces a full store when it shares a batch with a `get all` (shallow merge of `combinedOutput`).
2. A rejected `fetch` leaves `#processingRequestQueue` set and the sync icon on Syncing forever (no try/finally).
3. A failed write is removed from the queue with `shift()` before sending and never put back.

Found since:

4. A `get all` snapshot requested before a write finishes is applied after it, so the write disappears from the UI until the next fetch.
5. The persisted queue is loaded at startup but never sent, and `getInitialDataIfNeeded()` skips the fetch while the queue is non-empty.
6. `#inMemoryCurrentApiRequest` is persisted but never read back.
7. After auth expires, the remaining writes each get a 401 and are dropped.
8. `reset()` during an outstanding request lets a second loop start, and the old loop can still apply its output.
9. `fetch` has no timeout, so a hung request blocks the queue.
10. Retrying an insert after an ambiguous failure hits a duplicate `_id` in `insertMany`.
11. The app can't tell a server error from a bad request or an expired login: `APIResponse` only carries `success` and error strings. `GCloudAPIService.#call` has the HTTP status from `fetch`, but drops it when it returns the decoded body.
12. With writes waiting to be sent, the sync icon gives no sign of it.

## Design

A new exported class, `WorkoutAPIQueueService`, owns sending: the queue of writes, the pending get, persistence, retries, and handing get output back to its owner. `WorkoutAPIService` creates the instance and keeps its public methods (`queryApi`, `hydrate`, `setApiOutputHandlers`, `reset`, `getInitialData*`), so none of its callers change. It still decides what to fetch and when (`lastInitialDataFetchTime`, the update check) and applies get output to the output handlers.

- **Writes queued, gets merged.** `queryApi(options)` puts `insert` / `update` / `delete` into the queue as one item (unchanged shape, no merging across items). `options.get` is merged into a single pending get instead of being queued. This covers both the full refresh and the `ctoGet` that document map services attach to writes, without changing how those services build requests.
- **Peek, send, then remove.** An item stays at the head of the queue (and in storage) until its request succeeds or is classified as permanently failed.
- **One loop at a time.** The loop flag is reset in `finally`, and the queue is checked again afterward so nothing queued at the last moment is missed.
- **Outcome classification** for each write:

  | Outcome | Action | Sync state |
  |---|---|---|
  | `success: true` | Remove the item, continue. | Syncing |
  | `fetch` rejected or timed out | Keep the item; retry with exponential backoff plus jitter, capped delay. | Offline |
  | HTTP 5xx, or a response that failed to parse | Keep the item; same backoff, up to 5 attempts, then drop and log an error. | Pending, then Error on drop |
  | HTTP 401 | Pause the queue and keep every item. The existing `onAuthExpired` handler logs the user out; login resumes the queue. | Pending |
  | Any other 4xx | Drop the item, log an error (reaches Sentry), continue. | Error |

- **Pending get runs last.** When the queue has no writes and a pending get exists, the loop sends it. If a write is queued while that get is outstanding, the result is discarded and the get stays pending, so it runs again after the write. A failed get stays pending and uses the same backoff.
- **Output handling.** Only get responses go to the output handlers; write responses are ignored (no handler uses them today, since every `handleApiOutput` checks `input.get?.X?.all`). The handlers and `AbstractDocumentMapStoreService.handleApiOutput` stay as they are, with `input` being the get that was sent.
- **Reset.** `WorkoutAPIService.reset()` calls `dispose()` on the current instance and creates a new one. A disposed instance cancels its backoff timer, and its loop exits after the outstanding `await` without applying anything or touching storage, so two loops never touch app state.

## Steps

Repositories:

- Workout app: `~/Development/GithubRepos/workout-wt-HardenAppABit` (branch `HardenAppABit`)
- Libraries: `~/Development/GithubRepos/ts-libs-wt-WorkoutAPIHardening` (branch `WorkoutAPIHardening`). Not the main `ts-libs` checkout.
- Backend: `~/Development/GithubRepos/gcloud-backend` (branch `HardenWorkoutAPI`)

`pnpm watch` is already running in the `ts-libs` worktree, so library changes publish locally. To test them in a consumer, run `pnpm sub:core-ts-api-lib` in the workout app or the backend (`pnpm unsub:core-ts-api-lib` afterward).

### 1. `@aneuhold/core-ts-api-lib`: status code, error code, and timeout

Work in the `ts-libs` worktree at `~/Development/GithubRepos/ts-libs-wt-WorkoutAPIHardening` (branch `WorkoutAPIHardening`), not the main `ts-libs` checkout. Files: `packages/core-ts-api-lib/src/types/APIResponse.ts`, a new `src/types/APIErrorCode.ts` (exported from `src/browser.ts` next to `APIResponse`), `src/services/GCloudAPIService/GCloudAPI.service.ts`, `GCloudAPI.service.spec.ts`.

The worktree already has an earlier version of this step: `statusCode` optional, the timeout, `#fetchAndDecode` returning a bare `APIResponse`, and `#call` checking `result.statusCode === 401`. Rework it to match the bullets below; the timeout and its test stay as they are.

- `statusCode` is a **required** field on `APIResponse`: the HTTP status the response is sent with. The backend sets it on every response (step 2). The client sets it only on an `APIResponse` it builds itself.
- `errorCode` is an **optional** `APIErrorCode` field on `APIResponse`, set on every response where `success` is `false` and never on a success. `statusCode` gives the category of failure (retry, re-login, give up); `errorCode` names the specific failure so a caller can react to it without matching on `errors` strings, which stay human-readable.
- `APIErrorCode` is a string enum of the codes shared by every project, each documented with the HTTP status it goes out with:

  | Code | Status | Meaning |
  |---|---|---|
  | `Unauthorized` | 401 | The access token is missing, invalid, or expired. |
  | `InvalidRefreshToken` | 401 | The refresh token is invalid or expired, or its user no longer exists. |
  | `MissingCredentials` | 400 | `validateUser` got neither a Google credential token nor a username and password. |
  | `NoProjectAccess` | 403 | The user has no access to the requested project. |
  | `Forbidden` | 403 | Any other refusal. |
  | `BadRequest` | 4xx | Any other client error. |
  | `InternalError` | 5xx | An unexpected server error. |
  | `InvalidAPIResponseShape` | any | Set by the client: the body was not a valid `APIResponse` (e.g. an error page from Cloud Run). |

- No project-specific codes apply yet: workout and dashboard failures are all unexpected exceptions (`InternalError`). The `APIErrorCode` JSDoc says, in one sentence, that a project's own codes go in their own enum export (e.g. `WorkoutAPIErrorCode`) and that project's responses use `APIErrorCode | WorkoutAPIErrorCode`.
- `#isAPIResponseShape` also requires `statusCode` to be a number, and `errorCode`, when present, to be a string. It does not check `errorCode` against the enum, so a code added by a newer backend still decodes.
- `#decodeResponse` returns a valid body unchanged. When the body fails to parse or fails the shape check (for example a Cloud Run or load balancer error page that never reached the app), it builds the unsuccessful `APIResponse` with `statusCode: response.status` and `errorCode: APIErrorCode.InvalidAPIResponseShape`. This is the only place the client reads the HTTP status.
- `#call` checks `statusCode === 401` on the decoded response for the refresh and `onAuthExpired` logic.
- The `authLogout` short-circuit (no refresh token) returns `statusCode: 200`.
- `#fetchAndDecode` aborts `fetch` after a timeout (an `AbortController` with a `setTimeout`, so fake timers drive it) so a hung request rejects. A failure to read the body also rejects. Transport failures stay as rejections; the app classifies a rejection as Offline.
- Tests: a valid body keeps its `statusCode`; an unparseable 5xx body gets `statusCode` from the HTTP status; a body missing `statusCode` fails the shape check; an unparseable body gets `InvalidAPIResponseShape`; an `errorCode` outside the enum still decodes; 401 handling still works; a request that never resolves rejects after the timeout. Update existing mocks to include `statusCode` in their bodies.
- Follow `ts-libs/.claude/CLAUDE.md` (`pnpm check`, `pnpm test`, `pnpm lint` in the package). Wait ~6 seconds for the change to reach the workout app and the backend.
- In the workout app, `src/services/MockEnvSetupService/MockAPIBackend.ts` and `src/components/Login/Login.stories.svelte` build `APIResponse` objects and need `statusCode` too, plus an `errorCode` on any failure they build.
- With the stricter shape check, a client on this lib version treats a body without `statusCode` as a parse failure, so the backend from step 2 deploys before any client (the workout app or any other consumer of the lib) ships this version.

### 2. `gcloud-backend`: status code and error code on every response

Work in the main `gcloud-backend` checkout on branch `HardenWorkoutAPI`. Files: every controller under `src/routes/`, the guards in `src/common/guards/`, `src/routes/admin/Admin.service.ts`, a new `src/common/exceptions/APIErrorException.ts`, `src/common/filters/ApiException.filter.ts` and its spec, a new global interceptor in `src/common/` registered in `src/routes/App.module.ts` next to `APP_FILTER`, and `test/App.e2e.spec.ts`.

- **Controllers** set `statusCode` on every `APIResponse` they return, using `HttpStatus` from `@nestjs/common`.
  - Success: `HttpStatus.OK`.
  - The manual `success: false` returns in `Auth.controller.ts` get a matching status and `errorCode`: `validateUser` missing credentials 400 `MissingCredentials`, no project access 403 `NoProjectAccess`, caught exception 500 `InternalError`; `refresh` invalid/expired token or missing user 401 `InvalidRefreshToken`; `deleteAccount` caught exception 500 `InternalError`. `validateUser` must not use 401: `GCloudAPIService.#call` treats a 401 as an expired session and would try a refresh and fire `onAuthExpired` on a failed login. `refresh` is called through `#fetchAndDecode`, not `#call`, so its 401 doesn't loop.
- **Interceptor**: a global interceptor that, for any `APIResponse`-shaped controller result, sends the HTTP response with the body's `statusCode`, so the body and the real status can't disagree (and a POST no longer goes out as Nest's default 201). In the interceptor's `map`, call `status()` on the response from `context.switchToHttp().getResponse()`. Nest (`@nestjs/core` 11.2.1, `router/router-execution-context.js`) sets the route's default status before running interceptors and does not set it again when it sends the result, so the interceptor's status is the one sent. The e2e tests below confirm it.
- **`APIErrorException`**: an `HttpException` subclass that carries an `APIErrorCode` next to the status and message, for code that throws a known failure. The guards throw it: `Auth.guard.ts` with `Unauthorized`, `ProjectAccess.guard.ts` with `NoProjectAccess` (the same code `validateUser` returns, since it is the same failure), `SuperAdmin.guard.ts` and `Admin.service.ts` with `Forbidden`.
- **Exception filter**: `ApiExceptionFilter` adds `statusCode: status` and an `errorCode` to the body it already builds. An `APIErrorException` supplies its own code. Any other exception gets one from its status: 401 `Unauthorized`, 403 `Forbidden`, other 4xx `BadRequest`, everything else (including non-`HttpException` errors) `InternalError`.
- Tests: the filter spec expects `statusCode` and `errorCode`, covering an `APIErrorException`, a plain `HttpException`, and a non-`HttpException` error; e2e tests check that the HTTP status equals the body's `statusCode` for a success, a manual auth failure (`refresh` with a bad token, `InvalidRefreshToken`), and a thrown exception (unauthenticated request, `Unauthorized`).

### 3. `gcloud-backend`: safe insert retries

Files: `gcloud-backend/src/routes/project/workout/WorkoutCreation.service.ts`, `WorkoutCreation.service.spec.ts`.

- In `handleInsert`, for each document type, look up the incoming `_id`s with the repository's existing `getList(docIds)` and skip documents that already exist, so a retried insert succeeds instead of failing on a duplicate key. Skipped documents still appear in the output so the response shape is unchanged.
- Repository subscribers don't rerun for documents that already exist: they ran when the document was first inserted.
- Tests: inserting the same documents twice succeeds and leaves one copy of each.
- Run `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` per `gcloud-backend/.claude/CLAUDE.md`. Deploy the backend before the app change ships.

### 4. `LocalData`: drop the current request

File: `src/util/LocalData/LocalData.ts`.

- Remove `storedKeyNames.currentApiRequest`, `getCurrentApiRequest`, `setCurrentApiRequest`, and its entry in `#smallTierKeys`. The leftover stored value is small and is ignored.
- `apiRequestQueue` and `get/setApiRequestQueue` keep their names. Items stored by the old code may contain a `get`; loading routes them through the same split as `queryApi`, so no migration is needed.

### 5. Sync states

Files: `src/services/ApiActivityService/ApiActivity.service.svelte.ts`, `src/components/TopBar/SyncIndicator.svelte`, `SBTopBarExample.svelte`, `TopBar.stories.svelte`.

- Add `ApiActivityState.Offline` and `ApiActivityState.Pending` with `setOffline()` and `setPending()`. Neither times out to Idle: they hold until the queue drains (Success) or an item is dropped (Error).
- `SyncIndicator`: Offline uses `IconCloudOff` in a muted color with aria label "Offline, changes saved on this device". Pending uses `IconCloudPause` with "Changes waiting to sync". Error moves to `IconCloudExclamation` in `text-destructive` so it stays distinct from Offline.
- Add the two states to `SBTopBarExample`'s switch and add "Sync Offline" and "Sync Pending" stories.

### 6. `WorkoutAPIQueueService`

New file: `src/services/WorkoutAPIService/WorkoutAPIQueue.service.ts`, default export of the `WorkoutAPIQueueService` class (not a singleton, not static). It lives in the existing `WorkoutAPIService` folder, like `TimerService/` holds several related services. Being an instance means a reset is a new instance and each test starts from a fresh one.

The constructor takes the callback that applies get output (`(output, input) => void`), so the class never imports the document map services and avoids the cycle noted in `apiResponseHandlingOrder.ts`. It calls `APIService.callWorkoutAPI`, `WebSocketService.getSocketId()`, `LocalData`, and `apiActivityService` directly, like the current code.

Moved from `WorkoutAPIService`, then reworked per **Design**:

- The in-memory queue and its serialized persistence (the existing `#persistChain` pattern, moved as is).
- `#processApiRequests` becomes the public `processApiRequests()`, so triggers can start a retry immediately, cancelling any backoff wait.
- `#callWorkoutAPI`.

New: `enqueue(options)` (the writes/get split), `hydrate()` (loads the stored queue, then calls `processApiRequests()`, which fixes the never-sent queue at startup), `dispose()`, the pending get, classification, backoff timer, paused state, and the `apiActivityService` updates from the table.

### 7. `WorkoutAPIService`

File: `src/services/WorkoutAPIService/WorkoutAPI.service.ts`.

- Replace the queue fields, `#processApiRequests`, `#callWorkoutAPI`, both persist methods, and `#processingRequestQueue` with `static #queue = new WorkoutAPIQueueService(...)`, passing a callback that runs `#handleOutput` and the `PerfMark.HydrationNetworkComplete` mark.
- `queryApi` calls `#queue.enqueue`, `hydrate` calls `#queue.hydrate`, and a new public `processApiRequests()` calls `#queue.processApiRequests()` for the triggers in step 9.
- `reset()` clears its own fields, disposes `#queue`, and creates a new one.
- `getInitialDataIfNeeded` drops the "queue must be empty" check, since the pending get already waits for writes.
- `setApiOutputHandlers` and `#handleOutput` stay. No callers change.

### 8. Auth and login

Files: `src/stores/session/loginState.ts`, `src/services/Auth.service.ts`.

- `onAuthExpired` replaces `userConfig.clear()` with a `userConfig.update` that clears only `accessToken` and `refreshTokenString`, keeping `userId` so a re-login can tell whether it is the same user.
- In `#applyLoginResult`, if the logged-in `user._id` differs from the stored `userId`, call `WorkoutAPIService.reset()` and `LocalData.clearWorkoutMaps()` before fetching. Same user: keep the queue; `getInitialDataForLogin()` starts processing it.

### 9. Triggers

File: `src/routes/+layout.svelte`.

- Add an `online` listener next to the existing `visibilitychange` listener that calls `WorkoutAPIService.processApiRequests()`. Visibility already reaches the queue through `getInitialDataIfNeeded()`, login through `getInitialDataForLogin()`, each write through `queryApi`, and startup through `hydrate()`.

### 10. Tests

New file: `src/services/WorkoutAPIService/WorkoutAPIQueue.service.spec.ts`. Use the global `MockAPIBackend` from `vitest-setup.ts`, `vi.spyOn(APIService, 'callWorkoutAPI')` to script responses (resolve, reject, never resolve, `statusCode` values), Vitest fake timers for backoff, real `LocalData` (fake IndexedDB is already set up), and the real `apiActivityService`. Each test creates its own `WorkoutAPIQueueService` with a spy as the output callback. Add a small helper in the spec for scripting a sequence of responses.

Cases:

- Rejected request mid-queue: state is Offline, not Syncing; the item stays queued and is sent on the next attempt.
- Hung request: times out and is retried.
- Backoff delay grows, is capped, and resets after a success; `processApiRequests()` skips the wait.
- 5xx: state is Pending; retried up to 5 attempts, then dropped, logged, and state is Error.
- 401: queue pauses, state is Pending, no items dropped; resumes on the next `processApiRequests()` after login.
- Other 4xx: item dropped, state is Error, the rest of the queue continues.
- Write queued while a get is outstanding: the snapshot is not applied, the get runs again, and the new document is still in the map.
- Full refresh plus set mutation in the same session: the set map is not reduced to the echoed set (the old doc's Issue 1 test).
- Several writes with `ctoGet`: one get is sent after the last write.
- Stored queue at startup: sent without any user action, then the initial fetch runs.
- `dispose()` while a request is outstanding: its result is ignored, nothing is persisted by it, and a new instance's loop runs normally.
- Item queued just as the loop finishes: still processed.
- After a failed send, a `hydrate()` from `LocalData` still has the item.

Also the lib and backend specs from steps 1 to 3.

### 11. Cleanup and validation

- Delete `docs/planned-fixes/sync-and-save-reliability.md`.
- Run `pnpm lint --fix`, `pnpm check`, `pnpm test` in the app.
