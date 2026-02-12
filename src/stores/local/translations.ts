import type { Translations } from '@aneuhold/core-ts-api-lib';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import LocalData from '$util/LocalData/LocalData';

function createTranslationsStore() {
  const initialTranslations = (browser ? LocalData.translations : null) ?? {};
  const { subscribe, set } = writable<Translations>(initialTranslations);

  return {
    subscribe,
    set: (newTranslations: Translations) => {
      set(newTranslations);
      LocalData.translations = newTranslations;
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
