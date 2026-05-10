import type { Translations } from '@aneuhold/core-ts-api-lib';
import { writable } from 'svelte/store';
import LocalData from '$util/LocalData/LocalData';

function createTranslationsStore() {
  const { subscribe, set } = writable<Translations>({});

  return {
    subscribe,
    set: (newTranslations: Translations) => {
      set(newTranslations);
      void LocalData.setTranslations(newTranslations);
    },
    /**
     * Replaces the in-memory value without writing back to LocalData. Used
     * by `hydrate` so loading the cached value back in doesn't trigger a
     * round-trip write of what we just read.
     *
     * @param value The value to apply.
     */
    setWithoutPropagation: (value: Translations) => {
      set(value);
    },
    /**
     * Loads the cached translations into the store. Called once at app
     * startup after `LocalData.init()` resolves.
     */
    hydrate: async () => {
      const cached = await LocalData.getTranslations();
      if (cached) {
        set(cached);
      }
    }
  };
}

export const translations = createTranslationsStore();

/**
 * A class that can be used to translate keys from the translations store.
 *
 * To use this class, import it into your component and instantiate it with
 * the translations store:
 *
 * ```ts
 * import { translations, TR } from '../stores/translations';
 *
 * $: tr = new TR($translations);
 * ```
 *
 * If you want to use the `key` method in the TypeScript as well, not just in
 * the markup, it needs to be declared first, because Svelte runs reactive
 * declarations last before processing the markup. For example:
 *
 * ```ts
 * let tr = new TR($translations);
 * $: tr = new TR($translations);
 * ```
 */
export class TR {
  constructor(private translations: Translations) {}

  key(keyName: string) {
    try {
      return this.translations[keyName].value;
    } catch {
      return `###${keyName}###`;
    }
  }
}
