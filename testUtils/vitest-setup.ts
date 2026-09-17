import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/svelte';
import { afterEach, beforeEach, vi } from 'vitest';
import mockEnvSetupService from '$services/MockEnvSetupService/MockEnvSetup.service';

// Run global setup before each test
beforeEach(() => {
  mockEnvSetupService.setupGlobalMocks(vi.spyOn);

  // Prevent requestAnimationFrame-driven UI libraries from scheduling callbacks that can fire
  // after component teardown in JSDOM and surface as unhandled errors.
  globalThis.requestAnimationFrame = () => 0;
  globalThis.cancelAnimationFrame = () => undefined;
});

afterEach(() => {
  cleanup();
});

// --- Global Mocks that have to be at Global Scope should be put below ---
