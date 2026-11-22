import { writable } from 'svelte/store';

/**
 * Whether the workout document maps, the exercise and muscle group volume
 * CTOs, and the user config hold a complete snapshot, either from the local
 * cache or from the initial API response. The app UI needs to wait for this.
 */
export const workoutDataReady = writable<boolean>(false);
