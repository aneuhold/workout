/**
 * Reactive route state for the Full App Storybook story. Uses a single
 * `SvelteURL` as the source of truth — its `pathname` and `searchParams`
 * are deeply reactive, so any component reading them will update
 * automatically.
 */

import { SvelteURL } from 'svelte/reactivity';

const currentUrl = new SvelteURL('/', 'http://localhost');

const routeState = {
  /** Reactive current pathname (e.g. `/sessions`). */
  get path(): string {
    return currentUrl.pathname;
  },

  /** Reactive search params parsed from the navigated URL. */
  get searchParams(): URLSearchParams {
    return currentUrl.searchParams;
  },

  /**
   * Parses a URL string and updates the internal URL.
   *
   * @param url Absolute or relative URL string (e.g. `/session?sessionId=abc`)
   */
  navigate(url: string): void {
    const parsed = new SvelteURL(url, 'http://localhost');
    currentUrl.pathname = parsed.pathname;
    currentUrl.search = parsed.search;
  },

  /** Resets navigation back to the home page. */
  reset(): void {
    currentUrl.pathname = '/';
    currentUrl.search = '';
  }
};

export default routeState;
