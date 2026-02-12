import type { UUID } from 'crypto';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import LocalData from '$util/LocalData/LocalData';

function createApiKeyStore() {
  const initialApiKey = browser && LocalData.apiKey !== '' ? (LocalData.apiKey as UUID) : null;
  const { subscribe, set } = writable<UUID | null>(initialApiKey);

  let apiKey: UUID | null = initialApiKey;

  return {
    subscribe,
    set: (newApiKey: UUID | null) => {
      set(newApiKey);
      LocalData.apiKey = newApiKey ?? '';
      apiKey = newApiKey;
    },
    get: () => apiKey
  };
}

export const apiKey = createApiKeyStore();
