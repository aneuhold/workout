import { readable } from 'svelte/store';

/**
 * A performant time store that updates every minute. Only starts updating
 * when subscribed to.
 */
export const timeMinute = readable(new Date(), function start(set) {
  const interval = setInterval(() => {
    set(new Date());
  }, 1000 * 60);

  return function stop() {
    clearInterval(interval);
  };
});
