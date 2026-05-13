# Native Timer Notification Plan

## Goal

When the timer is running on a native Capacitor platform, fire the completion alert via the OS notification system so it works when the WebView is backgrounded/suspended. Web behavior is unchanged.

## Approach

Schedule **one** local notification at `endTime - 5s` whose sound is a single ~5s WAV containing the full countdown beep sequence (5,4,3,2,1) followed by the completion tone. On native, fully bypass the existing in-app audio path (the OS sound is the only sound). On web, the existing `TimerAudioService` keeps doing exactly what it does today.

## Scope

- **Platform**: Android only for now. There is no `ios/` folder in the repo. Plan calls out iOS extension points but does not ship iOS support.
- **Out of scope**: Sentry release/source-maps for mobile, web behavior changes, countdown beep delivery via multiple notifications, foreground services / custom native plugins.

## Permission strategy

The user's decision is observable via `LocalNotifications.checkPermissions()` (no prompt) and `LocalNotifications.requestPermissions()` (prompts). The app uses this to choose between two mutually exclusive sound paths:

- **Permission granted** → OS notification only. The in-app web audio effect is skipped.
- **Permission denied or never asked** → Web audio (existing `TimerWebAudioService`) is the sound path. No notification scheduled.

Permission state is held as reactive state in `TimerNotificationService` so the TimerService's web-audio `$effect` re-evaluates automatically when it flips.

Flow:
- On `init()` (called from the root layout same as `TimerService.init()`): call `checkPermissions()` (does not prompt). If `granted`, set `hasPermission = true`. Otherwise leave it `false`.
- On the **first** `schedule()` call where `hasPermission` is still `false` and the user hasn't been asked this session, call `requestPermissions()`, update state with the result.
- Subsequent timers respect the current state: granted → schedule notification; not granted → schedule is a no-op and the web audio effect carries on.

Edge case: on the very first timer with a fresh install, the prompt fires at `start()` time. The web audio effect is still active at that instant (state defaults to `false`), so the user hears beeps. If they tap "Allow," state flips and the effect stops on its next evaluation; the OS notification still fires at the scheduled time. If they tap "Deny," nothing changes — web audio carries on. No surprise prompts at app startup.

---

## Step 1 — Extract a shared synth module, rename & refactor the web service

Today `TimerAudioService` uses WebAudio's imperative API (`AudioContext`, `OscillatorNode`, gain ramps). That can't run in Node, so it's the blocker for code reuse. Fix: pull the synthesis math out into a pure-JS module that both the web service and the Node script consume.

- **New file**: `src/services/TimerService/timerSoundSynth.ts` — framework-agnostic, no WebAudio, no Node-only APIs.
  - Exports the sound design as constants (frequencies, durations, envelope shape, completion-tone schedule). Single source of truth.
  - Exports `synthesizeBeep(sampleRate: number): Float32Array` and `synthesizeCompletionTone(sampleRate: number): Float32Array` — the two sounds the web service currently plays.
  - Exports `synthesizeFullSequence(sampleRate: number): Float32Array` — five beeps at 1s intervals followed by the completion tone, ~5.6s total. This is what the WAV is built from.
  - Internal helper applies the same envelope shape the current code uses (linear ramp-in to peak gain, hold, exponential decay-out). No need to enumerate exact numbers here — they live in the constants block at the top of the file.
- **Rename**: `src/services/TimerService/TimerAudioService.ts` → `TimerWebAudioService.ts`. Rename the class to `TimerWebAudioService`; export default instance as `timerWebAudioService`.
- **Refactor `TimerWebAudioService`** to use the shared synth:
  - On first use, build two `AudioBuffer`s from `synthesizeBeep()` / `synthesizeCompletionTone()` and cache them.
  - `playCountdownBeep` / `playCompletionTone` create an `AudioBufferSourceNode` from the appropriate buffer and `start()` it. Existing autoplay-resume guard stays.
  - The oscillator/gain-ramp code goes away. The service shrinks.
- **Update `TimerService.svelte.ts`**: change the import to `./TimerWebAudioService` and the identifier to `timerWebAudioService`. (Two call sites.)
- `src/services/TimerService/index.ts` is unchanged.
- Confirm no other importers: `grep -r "TimerAudioService" src/` should only hit `TimerService.svelte.ts` before the rename.

## Step 2 — Add the `generate:sounds` script

- **New file**: `scripts/generate-sounds.ts`
  - Imports `synthesizeFullSequence` from `../src/services/TimerService/timerSoundSynth`.
  - Calls it with `sampleRate = 44100`, converts the `Float32Array` to 16-bit signed PCM, prepends a standard 44-byte WAV header (RIFF/WAVE/fmt /data, mono).
  - Creates `android/app/src/main/res/raw/` if missing, writes `timer_complete.wav` there. (Lowercase, underscores — Android raw-resource naming rule.)
  - Prints output path and file size. No `any`. Match `scripts/replaceDevVersion.ts` / `scripts/emitVersionInfo.ts` style.
- **New script entry** in `package.json`, next to `generate:icons`:
  ```
  "generate:sounds": "tsx scripts/generate-sounds.ts"
  ```
- **Validation**: run `pnpm generate:sounds`, sanity-check the file plays (`afplay android/app/src/main/res/raw/timer_complete.wav`), commit the WAV.

## Step 3 — Install `@capacitor/local-notifications` and wire Android manifest

- `pnpm add -D @capacitor/local-notifications@^8` (match the rest of the Capacitor 8.x peer set).
- Run `pnpm cap sync android` once after install so the plugin's native side is wired into the Android project.
- No `capacitor.config.ts` changes are required for default behavior. (Optional: a `LocalNotifications` config block to set `smallIcon`/`iconColor` — defer unless visuals look bad.)
- **AndroidManifest.xml**: add `<uses-permission android:name="android.permission.USE_EXACT_ALARM" />` (Android 14+). For Android 12/13, also `<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />`. Without these, the OS may delay our scheduled fire time by minutes under Doze. The `USE_EXACT_ALARM` permission is the Play-Store-approved option for timer/alarm apps (workout rest timer qualifies). File: `android/app/src/main/AndroidManifest.xml`.
- `POST_NOTIFICATIONS` runtime permission (Android 13+) is requested by the plugin via `requestPermissions()` — no manifest entry needed for it, the plugin declares it.

## Step 4 — Create `TimerNotificationService`

A thin wrapper that isolates the platform gate, the plugin API, and the reactive permission state.

- **New file**: `src/services/TimerService/TimerNotificationService.svelte.ts` (uses Svelte runes for reactive permission state — per repo convention, `.svelte.ts` suffix is required when a file uses runes). Internal to the TimerService folder; no barrel export.
- Singleton class exported as default instance, matching the repo's service convention.
- Class shape:
  - Private `#hasPermission = $state(false)` — reactive. Default `false` means the TimerService's web-audio effect runs.
  - Private `#permissionAsked = false` — non-reactive flag tracking whether we've called `requestPermissions()` this session (prevents repeat prompts).
  - Private `#initialized = false` — guards `init()` so it runs once.
  - Private constants `NOTIFICATION_ID = 1`, `LEAD_TIME_MS = 5000`, `TIMER_CHANNEL_ID = 'timer-complete'`.
  - Public getter `hasPermission` returning `#hasPermission` — this is what `TimerService`'s `$effect` reads.
  - Public `async init(): Promise<void>`:
    - Guard with `#initialized`.
    - If `!Capacitor.isNativePlatform()`, set `#initialized = true` and return (state stays `false`, web audio plays — correct for web).
    - On Android, create the notification channel: `LocalNotifications.createChannel({ id: TIMER_CHANNEL_ID, name: 'Timer complete', sound: 'timer_complete', importance: 4, visibility: 1 })`. `importance: 4` is `IMPORTANCE_HIGH` (sound + heads-up). `sound` is the bare filename from `res/raw/` (no extension — Android convention).
    - Call `const { display } = await LocalNotifications.checkPermissions()`. If `display === 'granted'`, set `#hasPermission = true`. (`PermissionState` is `'prompt' | 'prompt-with-rationale' | 'granted' | 'denied'`.)
    - Set `#initialized = true`.
  - Public `async schedule(endTimeMs: number): Promise<void>`:
    - If `!Capacitor.isNativePlatform()`, return.
    - Compute `fireAtMs = endTimeMs - LEAD_TIME_MS`. If `fireAtMs <= Date.now()`, return without scheduling.
    - If `#hasPermission` is `false` and `!#permissionAsked`, call `requestPermissions()` once; set `#permissionAsked = true`; update `#hasPermission` from the result.
    - If still no permission, return (web audio takes over via the reactive gate).
    - Call `LocalNotifications.schedule({ notifications: [{ id: NOTIFICATION_ID, title: 'Rest complete', body: 'Time for your next set.', schedule: { at: new Date(fireAtMs), allowWhileIdle: true }, channelId: TIMER_CHANNEL_ID }] })`. `allowWhileIdle: true` lets the notification fire through Doze so it works when the phone has been idle in a pocket. Sound comes from the channel — do not set `sound` on the notification itself (Android 8+ ignores it).
  - Public `async cancel(): Promise<void>`:
    - If `!Capacitor.isNativePlatform()`, return.
    - Call `LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] })`. Swallow errors (cancel-when-nothing-scheduled is fine).
- **Imports**: `import { Capacitor } from '@capacitor/core'` and `import { LocalNotifications } from '@capacitor/local-notifications'`. Use the project's logger from `$util/logging/logger` for any error reporting (matches the existing pattern in `hooks.client.ts`).

### Why a custom Android channel is needed

Custom notification sounds on Android 8+ must be attached to a notification *channel*, not the individual notification. Setting `sound` on the notification payload alone won't play the custom WAV — the channel's sound wins ([Capacitor docs][capacitor-ln]). So we create a `timer-complete` channel pre-bound to `timer_complete` and route the notification to it via `channelId`. `IMPORTANCE_HIGH` (`importance: 4`) is what lets the sound play with the screen off ([Android docs][android-channels]).

### Channel sound is immutable after creation

Per Android: *"After you create a notification channel, you can't change the notification behaviors."* Calling `createChannel` again with the same `id` but a different `sound` is a no-op — the OS retains the original sound until the channel is deleted or the user clears app data. Practical implications:

- **During development**: if you regenerate `timer_complete.wav` via `pnpm generate:sounds`, an existing install won't pick up the new sound. Either `pnpm cap run android` after `adb uninstall com.tonyneuhold.mesopro`, or call `LocalNotifications.deleteChannel({ id: TIMER_CHANNEL_ID })` once before `createChannel` during development iteration.
- **In production**: if we ever ship a substantively different sound, we'll need to rotate the channel ID (e.g., `timer-complete-v2`) and delete the old one. Document this in the file's JSDoc so future-you doesn't get confused.

### Why a custom Android channel is needed

Custom notification sounds on Android 8+ must be attached to a notification *channel*, not the individual notification. Setting `sound` on the notification payload alone won't play the custom WAV — the channel's sound wins. So we create a channel with `sound: 'timer_complete'` and route the notification to it via `channelId`.

## Step 5 — Wire into `TimerService.svelte.ts`

- **Import**: `import timerNotificationService from './TimerNotificationService.svelte'`.
- **In `init()`**:
  - Call `void timerNotificationService.init();` once. This runs the permission check + channel setup on native; no-op on web.
  - **Gate the web-audio effect reactively** (not on `Capacitor.isNativePlatform()` directly — that would miss the "permission denied" case). Inside the existing `$effect` that plays beeps and the completion tone, add an early-return at the top: `if (timerNotificationService.hasPermission) return;`. Because `hasPermission` is `$state`, the effect re-runs when it flips and stops invoking the audio service the moment OS notifications take over. The wake-lock effect is unchanged.
- **`start(seconds)`**: after setting `#endTime`, call `void timerNotificationService.schedule(this.#endTime);` (fire-and-forget — the method is platform-gated and handles permission internally).
- **`pause()`**: call `void timerNotificationService.cancel();` after clearing the interval.
- **`resume()`**: after recomputing `#endTime`, call `void timerNotificationService.schedule(this.#endTime);`.
- **`stop()` and `reset()`**: call `void timerNotificationService.cancel();` after clearing state.
- **`#tick()` natural completion**: when `remaining <= 0` and the timer self-terminates, the notification has already been delivered (it fires at `endTime - 5s`), so no extra cancel is needed. The OS will deliver the sound between the time we detect completion and a couple of seconds later — this is the whole point.

## Step 6 — Validate

Per `.github/copilot-instructions.md`:

1. `pnpm lint --fix`
2. `pnpm check`
3. `pnpm test`

Plus manual verification (cannot be automated):

- Run `pnpm generate:sounds`, play `android/app/src/main/res/raw/timer_complete.wav` to confirm it matches the in-app sound.
- `pnpm preview:android` on a real device:
  - Start a 30-second timer, lock the phone, wait. Expect to hear the countdown + completion at the right time, with the screen locked.
  - Start a 30-second timer, background the app, expect the same.
  - Start a 30-second timer, pause it before 5s left, expect no notification.
  - Start a 3-second timer (under the 5s lead time), expect no notification scheduled and graceful no-op.
  - Confirm `pnpm dev` in a browser still plays the existing WebAudio beeps.

## Files touched

**New**
- `src/services/TimerService/timerSoundSynth.ts` — pure-JS shared synth + sound design constants.
- `src/services/TimerService/TimerNotificationService.svelte.ts`
- `scripts/generate-sounds.ts`
- `android/app/src/main/res/raw/timer_complete.wav` (generated, committed)

**Renamed + refactored**
- `src/services/TimerService/TimerAudioService.ts` → `TimerWebAudioService.ts` — now plays cached `AudioBuffer`s built from the shared synth, instead of imperative oscillator+gain code.

**Edited**
- `package.json` — add `generate:sounds` script; new `@capacitor/local-notifications` devDependency.
- `src/services/TimerService/TimerService.svelte.ts` — import rename, gate web-audio effect on `timerNotificationService.hasPermission`, add notification schedule/cancel hooks.

**No changes**
- `capacitor.config.ts`, `src/services/TimerService/index.ts`.

## Documentation references

Plan validated against (May 2026):

- [Capacitor `@capacitor/local-notifications` API reference][capacitor-ln] — method signatures, `PermissionStatus.display` shape, `Channel` interface (id/name/sound/importance 0–5/visibility -1/0/1), `LocalNotificationSchema.channelId`, `allowWhileIdle` and exact-alarm guidance.
- [Android notification channels overview][android-channels] — channel immutability ("After you create a notification channel, you can't change the notification behaviors"), `IMPORTANCE_HIGH` (4) for sound + heads-up, importance constants.

[capacitor-ln]: https://capacitorjs.com/docs/apis/local-notifications
[android-channels]: https://developer.android.com/develop/ui/views/notifications/channels

### Notes on what we did NOT find a simpler path for

- **No first-class "sound only, no banner" option.** Confirmed by both docs. The notification will show a heads-up at `IMPORTANCE_HIGH`. Not a problem for the "timer complete" UX, but worth knowing.
- **No way to literally share WebAudio code with Node.** Confirmed — WebAudio APIs are browser-only. The shared-synth refactor (Step 1) is the cleanest reuse possible.
- **`checkExactNotificationSetting()` (Capacitor)** could be called on app startup to verify the user hasn't disabled exact alarms in OS settings. Not blocking; flag as a small follow-up if reliability complaints come in.
