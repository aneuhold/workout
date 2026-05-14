import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { createLogger } from '$util/logging/logger';

const logger = createLogger('TimerNotificationService');

/**
 * Bridges the timer to the OS notification system on native platforms so the
 * completion alert fires even when the WebView is backgrounded or suspended.
 *
 * On Android, a single notification is scheduled at `endTime - LEAD_TIME_MS`
 * with a custom sound (`timer_complete.wav`) that contains the full countdown
 * beep sequence followed by the completion tone. The sound is attached to the
 * `timer-complete` channel because Android 8+ ignores per-notification sound.
 *
 * On web (or any non-native platform), every method is a no-op and the
 * in-app TimerWebAudioService remains the sound path. The reactive
 * `hasPermission` getter is what TimerService uses to decide which path
 * is live for a given session.
 *
 * 🔴 Channel immutability / Issue with changing the wav file 🔴:
 * after a channel is created the OS retains its
 * sound/importance. Regenerating `timer_complete.wav` won't be picked up by
 * an existing install — uninstall the app (or rotate the channel id) when
 * iterating on the sound during development.
 */
class TimerNotificationService {
  #hasPermission = $state(false);
  #permissionAsked = false;
  #initialized = false;

  private readonly NOTIFICATION_ID = 1;
  private readonly LEAD_TIME_MS = 5000;
  private readonly TIMER_CHANNEL_ID = 'timer-complete';

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

    try {
      await LocalNotifications.createChannel({
        id: this.TIMER_CHANNEL_ID,
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
    } catch (err) {
      logger.error('Failed to initialize notifications', err);
    }
  }

  /**
   * Schedules the OS notification to fire at `endTimeMs - LEAD_TIME_MS`.
   * On first call this session it prompts for permission if needed; that
   * gesture flips the reactive `hasPermission` and the in-app audio effect
   * stops competing. No-op on web, and a graceful no-op when the timer is
   * shorter than the lead time.
   *
   * @param endTimeMs Wall-clock time the timer should complete, in ms since epoch.
   */
  async schedule(endTimeMs: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const fireAtMs = endTimeMs - this.LEAD_TIME_MS;
    if (fireAtMs <= Date.now()) return;

    if (!this.#hasPermission && !this.#permissionAsked) {
      this.#permissionAsked = true;
      try {
        const status = await LocalNotifications.requestPermissions();
        this.#hasPermission = status.display === 'granted';
      } catch (err) {
        logger.error('Failed to request notification permission', err);
      }
    }

    if (!this.#hasPermission) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.NOTIFICATION_ID,
            title: 'Rest complete',
            body: 'Time for your next set.',
            schedule: { at: new Date(fireAtMs), allowWhileIdle: true },
            channelId: this.TIMER_CHANNEL_ID
          }
        ]
      });
    } catch (err) {
      logger.error('Failed to schedule notification', err);
    }
  }

  /**
   * Cancels the scheduled notification if any. Safe to call even when
   * nothing is scheduled. No-op on web.
   */
  async cancel(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: this.NOTIFICATION_ID }]
      });
    } catch (err) {
      logger.error('Failed to cancel notification', err);
    }
  }
}

export default new TimerNotificationService();
