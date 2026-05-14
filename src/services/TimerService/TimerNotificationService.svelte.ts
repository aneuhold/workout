import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Bridges the timer to the OS notification system on native platforms so the
 * completion alert fires even when the WebView is backgrounded or suspended.
 *
 * Note that on Android, swiping down on the notification bar while the timer is
 * going off automatically silences the sound. This seems like built-in Android behavior.
 *
 * On web (or any non-native platform), every method is a no-op and the in-app
 * TimerWebAudioService remains the sound path.
 *
 * 🔴 Channel immutability / Issue with changing the wav file 🔴:
 * after a channel is created the OS retains its sound/importance. Regenerating
 * `timer_complete.wav` won't be picked up by an existing install — uninstall the
 * app (or rotate the channel id) when iterating on the sound during development.
 */
class TimerNotificationService {
  #hasPermission = $state(false);
  #permissionAsked = false;
  #initialized = false;

  private readonly NOTIFICATION_ID = 1;
  /**
   * Lead time before the timer end to fire the notification, in ms.
   *
   * 5 seconds for the beeps and 1 for the completion.
   */
  private readonly LEAD_TIME_MS = 6000;
  private readonly CHANNEL_ID = 'timer-complete';

  /**
   * Reactive: `true` once the OS has granted notification permission for
   * this session. TimerService gates its in-app audio effect on this so
   * native + web don't double-play.
   */
  get hasPermission(): boolean {
    return this.#hasPermission;
  }

  /**
   * Sets up the Android notification channel and reads the current
   * permission state without prompting. Call once from the root layout
   * alongside `timerService.init()`. Subsequent calls are no-ops. No-op
   * on web.
   */
  async init(): Promise<void> {
    if (this.#initialized) return;
    this.#initialized = true;
    if (!Capacitor.isNativePlatform()) return;

    await LocalNotifications.createChannel({
      id: this.CHANNEL_ID,
      name: 'Timer complete',
      description: 'Plays the countdown beeps and completion tone when the rest timer ends.',
      sound: 'timer_complete',
      importance: 4,
      visibility: 1
    });

    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      this.#hasPermission = true;
    }
  }

  /**
   * Schedules the alarm to fire at `endTimeMs - LEAD_TIME_MS`. On the very
   * first call this session, prompts for notification permission. No-op
   * on web or if the timer is shorter than the lead time.
   *
   * @param endTimeMs Wall-clock time the timer should complete, in ms since epoch.
   */
  async schedule(endTimeMs: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    await this.ensurePermission();
    if (!this.#hasPermission) return;

    const fireAtMs = endTimeMs - this.LEAD_TIME_MS;
    if (fireAtMs <= Date.now()) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: this.NOTIFICATION_ID,
          title: 'Rest complete',
          body: '💪🟢',
          schedule: { at: new Date(fireAtMs), allowWhileIdle: true },
          channelId: this.CHANNEL_ID
        }
      ]
    });
  }

  /**
   * Cancels the scheduled alarm if any. Safe to call when nothing is
   * scheduled. No-op on web.
   */
  async cancel(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    await LocalNotifications.cancel({
      notifications: [{ id: this.NOTIFICATION_ID }]
    });
  }

  private async ensurePermission(): Promise<void> {
    if (this.#hasPermission || this.#permissionAsked) return;
    this.#permissionAsked = true;
    const status = await LocalNotifications.requestPermissions();
    this.#hasPermission = status.display === 'granted';
  }
}

export default new TimerNotificationService();
