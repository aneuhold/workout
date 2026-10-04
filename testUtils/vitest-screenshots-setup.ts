import { afterEach } from 'vitest';
import { commands } from 'vitest/browser';
import animationsSettled from './animationsSettled';

declare module 'vitest/browser' {
  interface BrowserCommands {
    writePlayStoreScreenshot: (name: string) => Promise<void>;
  }
}

// Runs after each story's play function, so the capture shows its final state. A failed
// story is skipped so it can't overwrite the committed screenshot with the wrong screen.
afterEach(async ({ task }) => {
  if (task.result?.state === 'fail') {
    return;
  }
  await document.fonts.ready;
  await animationsSettled();
  // Test names are story export names, such as `ActiveSession`
  await commands.writePlayStoreScreenshot(
    task.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  );
});
