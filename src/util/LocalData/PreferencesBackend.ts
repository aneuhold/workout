import { Preferences } from '@capacitor/preferences';
import type { ILocalDataBackend } from './ILocalDataBackend';

/**
 * Native small-tier backend, wrapping `@capacitor/preferences`. Backed by
 * `UserDefaults` on iOS and `SharedPreferences` on Android. Reserved for
 * payloads that comfortably fit under the platform caps (~100 KB) — anything
 * bigger should route through `SqliteBackend`.
 */
export default class PreferencesBackend implements ILocalDataBackend {
  async get(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  }

  async set(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  async cleanupOldVersions(currentPrefix: string): Promise<void> {
    const { keys } = await Preferences.keys();
    await Promise.all(
      keys.filter((k) => !k.startsWith(currentPrefix)).map((k) => Preferences.remove({ key: k }))
    );
  }
}
