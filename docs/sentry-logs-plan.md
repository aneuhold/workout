# Sentry Logs Plan

Goal: upgrade the Sentry packages as far as they can go without splitting `@sentry/core` into two runtime copies, then forward every level from `createLogger` to Sentry Logs as structured records, while errors keep producing error events exactly as they do today.

Today the sink in [`src/hooks.client.ts`](../src/hooks.client.ts) drops everything below `LogLevel.Error` on the first line and converts the rest into `captureException` / `captureMessage`. There are no `Sentry.logger.*` calls anywhere in `src/`, so `enableLogs` on its own changes nothing. The sink rewrite in Step 3 is what actually turns logging on.

---

## Step 1 - Upgrade to the highest matching versions

`@sentry/capacitor` declares `@sentry/core` as an **exact runtime dependency**, not a peer. That pin, not the latest published version, sets the ceiling.

| Package | Installed | Latest | Target | Core pin at target |
|---|---|---|---|---|
| `@sentry/sveltekit` | 10.60.0 | 10.75.0 | **10.69.0** | 10.69.0 |
| `@sentry/capacitor` | 4.2.0 | 4.4.0 | **4.4.0** | 10.69.0 |

Going to sveltekit 10.75.0 would leave capacitor holding its own core 10.69.0, so the Android path in `hooks.client.ts:39` (`SentryCapacitor.init(sentryOptions, Sentry.init)`) would read `getGlobalScope()` / `getIsolationScope()` from a different module instance than the one `Sentry.init` configures. 10.69.0 on both sides keeps one copy.

Changes in `package.json`:

- `@sentry/sveltekit`: `10.60.0` to `10.69.0`.
- `@sentry/capacitor`: `^4.2.0` to `4.4.0`, pinned exact. The caret is what would let capacitor drift onto a new core pin later and silently desync the two trees again.

What comes along with this, verified against the changelogs:

- No breaking changes in the JS SDK between [10.61.0 and 10.69.0](https://github.com/getsentry/sentry-javascript/blob/10.69.0/CHANGELOG.md). `sendDefaultPii` is deprecated in favour of `dataCollection` (removal is v11), and it is not set in this repo.
- [`@sentry/capacitor` 4.4.0](https://github.com/getsentry/sentry-capacitor/blob/main/CHANGELOG.md) removes `SentryCapacitor.podspec` and drops CocoaPods. There is no `ios/` folder in this repo, so it does not apply.
- `@sentry/capacitor` 4.3.0 bumps the Android native SDK from 8.41.0 to 8.50.1, which is what backs `enableLogs` on the native side.

Verify afterwards that exactly one runtime core resolves:

```
ls -d node_modules/.pnpm/@sentry+core@*
```

One `@sentry+core@10.69.0` is the expected result. `@sentry/vite-plugin` pulls `@sentry/bundler-plugins`, which also depends on core, but that is build-time only and after this upgrade it lands on 10.69.0 too.

---

## Step 2 - Enable logs in the init options

One line added to `sentryOptions` in `src/hooks.client.ts`:

- `enableLogs: true`

Required because 10.69.0 sits below 10.71.0, where [the default flipped to `true`](https://github.com/getsentry/sentry-javascript/releases/tag/10.71.0). Keep it explicit even after capacitor eventually crosses that line, so the web and Android paths cannot disagree about it.

`@sentry/capacitor` forwards this option into the Android native SDK (`nativeOptions.js`, `LogParameters`). It is a no-op on iOS, which does not matter here.

Do **not** add `consoleLoggingIntegration`. Every log in the app already routes through `createLogger`, and the only two raw `console.*` calls left are in a Storybook example file and `SingletonDeloadDialog.svelte`.

Do **not** add `beforeSendLog`. It runs after the sink has already built the record, so it would be a second place doing the same clamping that Step 3 does at the source. Keep the size handling in one place.

---

## Step 3 - Rewrite the sink in `src/hooks.client.ts`

This is the whole feature. The sink stays where it is; no new file.

1. Drop the `if (entry.level !== LogLevel.Error) return;` guard so all four levels arrive.
2. Emit a structured log for every entry via `Sentry.logger`. The `LogLevel` enum values (`debug`, `info`, `warn`, `error`) are already exactly the `Sentry.logger` method names, so this is a direct indexed call rather than a switch. If the union type on the `logger` export makes an indexed call awkward to type, fall back to a switch on `entry.level` rather than reaching for `as`.
3. Build the attributes object from the entry:
   - `logger_tag: entry.tag`, reusing the existing attribute name so current Sentry filters on `logger_tag` keep working against both events and logs.
   - `arg0`, `arg1`, and so on from `entry.args`, matching the naming the error path already uses for extras.
4. Serialize each arg to a primitive, because Sentry attributes only accept `string | number | boolean` or arrays of those. Strings, numbers and booleans pass through; an `Error` contributes its `message`; anything else goes through `JSON.stringify` in a `try`/`catch` for cycles. Truncate the result at a module-level max-length constant.
5. Leave the error branch untouched: still `withScope` plus `setTag` / `setExtras`, still `captureException` when an arg is an `Error` and `captureMessage` otherwise. An error therefore produces both an event and a log, which is what puts it on the trace timeline next to the surrounding info lines.

The truncation in point 4 is what handles the oversized payloads. The call sites that pass whole documents are `WorkoutAPI.service.ts:243` and `:252`, plus `loginState.ts:95`, and a clamp in the sink covers those plus anything added later, with no further call-site churn.

`tracesSampleRate` is already `1.0`, so these logs attach to traces that are being collected regardless.

---

## Step 4 - Trim the duplicate payload arg

`WorkoutAPI.service.ts:243` logs `'Processing API request', input` before the call and `:249` logs `'Successfully processed API request', input` after it succeeds. Both copies of `input` are the same object, and once logs are on, both lines sit on the same trace.

Drop the `input` arg from the success line at `:249` only. The request line at `:243` keeps it, and the error line at `:252` keeps both `input` and `result`.

---

## Step 5 - Convert the namespace imports (optional)

`src/hooks.client.ts` uses `import * as Sentry` and `import * as SentryCapacitor`, which the TypeScript conventions rule out. Since the file is being edited anyway, switching to named imports (`init`, `withScope`, `captureException`, `captureMessage`, `logger`, `handleErrorWithSentry`, and `init as capacitorInit`) brings it in line.

Separable from the rest of the plan. Drop this step if the diff noise is not worth it.

---

## Decisions

- **`loginState.ts:95` stays as it is.** It keeps logging the whole WebSocket payload at info on every server push, and no call-site change is made. The sink's truncation in Step 3 is enough to keep it cheap in Sentry.
- **The duplicate `input` on the success line is trimmed.** Step 4.
- **Errors produce both an event and a log.** The two products overlap on errors by design, so an error appears in the log timeline alongside the info lines that led to it.

---

## Validation

1. `pnpm lint --fix`
2. `pnpm check`
3. `pnpm test`
4. `ls -d node_modules/.pnpm/@sentry+core@*` shows a single version.
5. Set `debugSentry = true` in `src/hooks.client.ts` temporarily, run `pnpm dev`, exercise a workout page, and confirm records land under Logs in the `workout` project in the `anton-neuhold` org, tagged with `logger_tag` and correlated to a trace. Revert the flag afterwards.
6. `pnpm dev:android` against a device, then confirm logs arrive from the native path as well, since that is the one that depends on the core versions matching.
