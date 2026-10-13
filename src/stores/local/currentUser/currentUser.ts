import type { UUID } from 'crypto';
import { type Updater, writable } from 'svelte/store';
import LocalData from '$util/LocalData/LocalData';

export type CurrentUser = {
  userId: UUID;
  username: string;
  /** Password from the last password login, used to prefill the login form. */
  password: string;
  /** JWT access token for authenticating API requests. */
  accessToken: string | null;
  /** Raw refresh token string for automatic token refresh. */
  refreshTokenString: string | null;
};

function createCurrentUserStore() {
  const ANONYMOUS_USER_ID: UUID = '00000000-0000-0000-0000-000000000000';
  let currentUser: CurrentUser = {
    userId: ANONYMOUS_USER_ID,
    username: '',
    password: '',
    accessToken: null,
    refreshTokenString: null
  };
  const { subscribe, set } = writable<CurrentUser>(currentUser);

  const updateCurrentUser = (updater: Updater<CurrentUser>) => {
    currentUser = updater(currentUser);
    set(currentUser);
    void LocalData.setCurrentUser(currentUser);
  };

  return {
    subscribe,
    set: (newUser: CurrentUser) => {
      updateCurrentUser(() => newUser);
    },
    update: (updater: Updater<CurrentUser>) => {
      updateCurrentUser(updater);
    },
    /**
     * Replaces the in-memory user without writing back to LocalData.
     *
     * @param newUser Current user to apply locally.
     */
    setWithoutPropagation: (newUser: CurrentUser) => {
      currentUser = newUser;
      set(currentUser);
    },
    /**
     * Signs the user out locally. Resets the user ID and tokens, and keeps the
     * username and password so the login form stays prefilled.
     */
    clear: () => {
      updateCurrentUser((user) => ({
        ...user,
        userId: ANONYMOUS_USER_ID,
        accessToken: null,
        refreshTokenString: null
      }));
    },
    /**
     * Simply gets the current user.
     */
    get: () => currentUser,
    /**
     * Loads the cached user into the store. Called once at app startup after
     * `LocalData.init()` resolves.
     */
    hydrate: async () => {
      const cached = await LocalData.getCurrentUser();
      if (cached) {
        currentUser = cached;
        set(currentUser);
      }
    }
  };
}

export const currentUser = createCurrentUserStore();
