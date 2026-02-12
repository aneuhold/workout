import { cleanup } from '@testing-library/svelte';
import { afterEach, beforeEach, vi } from 'vitest';
import TestSetup from './TestSetup';

// Run global setup before each test
beforeEach(() => {
  TestSetup.setupGlobalMocks(vi.spyOn);

  // Prevent requestAnimationFrame-driven UI libraries from scheduling callbacks that can fire
  // after component teardown in JSDOM and surface as unhandled errors.
  globalThis.requestAnimationFrame = () => 0;
  globalThis.cancelAnimationFrame = () => undefined;
});

afterEach(() => {
  cleanup();
});

// --- Global Mocks that have to be at Global Scope ---

// SingletonConfirmationDialog
vi.mock('$components/singletons/dialogs/SingletonConfirmationDialog.svelte', () => {
  return {
    confirmationDialog: {
      open: vi.fn()
    }
  };
});
