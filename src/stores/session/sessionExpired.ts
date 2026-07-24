import { writable } from 'svelte/store';

/**
 * Set when the current session ends because the login expired, so the login
 * screen can surface a re-login prompt.
 */
export const sessionExpired = writable<boolean>(false);
