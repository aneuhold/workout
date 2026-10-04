// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
//
// This file has no top-level imports or exports, so TypeScript treats it as a
// global script. That lets the declarations below add global types and declare
// new modules, rather than augment existing ones.

declare namespace App {
  // interface Error {}
  // interface Locals {}
  // interface PageData {}
  // interface Platform {}
}

// This has to be done because as of 2/16/2026 it seems that there is a bug in the Svelte
// TypeScript where it says that $state.snapshot returns a map of Snapshot<T> instead of T,
// even though the docs say it should return T. This is a workaround for now.
declare namespace $state {
  function snapshot<T>(state: T): T;
}

// Served by `browserSupportService.polyfillsPlugin()` in `vite.config.ts`.
declare module 'virtual:core-js-polyfills';
