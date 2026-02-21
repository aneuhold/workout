/**
 * Reactive route state for the Full App Storybook story. Uses a single
 * `SvelteURL` as the source of truth — its `pathname` and `searchParams`
 * are deeply reactive, so any component reading them will update
 * automatically.
 *
 * Maintains a simple history stack so `history.back()` can be intercepted
 * and navigate within the story instead of leaving it.
 */

import { SvelteURL } from 'svelte/reactivity';

const currentUrl = new SvelteURL('/', 'http://localhost');
const historyStack: string[] = [];

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
   * Pushes the current URL onto the history stack, then navigates to a
   * new URL.
   *
   * @param url Absolute or relative URL string (e.g. `/session?sessionId=abc`)
   */
  navigate(url: string): void {
    historyStack.push(`${currentUrl.pathname}${currentUrl.search}`);
    const parsed = new SvelteURL(url, 'http://localhost');
    currentUrl.pathname = parsed.pathname;
    currentUrl.search = parsed.search;
  },

  /**
   * Pops the most recent entry from the history stack and navigates to it.
   * Falls back to `/` if the stack is empty.
   */
  back(): void {
    const previous = historyStack.pop() ?? '/';
    const parsed = new SvelteURL(previous, 'http://localhost');
    currentUrl.pathname = parsed.pathname;
    currentUrl.search = parsed.search;
  },

  /** Resets navigation and history back to the home page. */
  reset(): void {
    currentUrl.pathname = '/';
    currentUrl.search = '';
    historyStack.length = 0;
  }
};

export default routeState;
