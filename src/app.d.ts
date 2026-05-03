// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }

  interface ViewTransition {
    finished: Promise<void>;
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
  }

  interface Document {
    startViewTransition?(callback: () => Promise<void> | void): ViewTransition;
  }

  // This has to be done because as of 2/16/2026 it seems that there is a bug in the Svelte
  // TypeScript where it says that $state.snapshot returns a map of Snapshot<T> instead of T,
  // even though the docs say it should return T. This is a workaround for now.
  namespace $state {
    function snapshot<T>(state: T): T;
  }
}

export {};
