import { select } from '@inquirer/prompts';
import { spawn } from 'child_process';

/**
 * Hard-coded list of devices/emulators we develop against. Keep in sync with
 * the AVD names registered locally (run `adb devices -l` to confirm).
 */
const DEVICES = ['Pixel 10 Pro XL', 'OnePlus IN2025', 'Pixel 6'];

const target = await select({
  message: 'Select Android device/emulator for live-reload',
  choices: DEVICES.map((name) => ({ name, value: name }))
});

const child = spawn(
  'pnpm',
  [
    'exec',
    'concurrently',
    '--kill-others',
    '--names',
    'vite,android',
    'vite dev --host',
    `pnpm cap run android --live-reload --port 5173 --target-name "${target}"`
  ],
  { stdio: 'inherit' }
);

child.on('exit', (code) => process.exit(code ?? 0));
