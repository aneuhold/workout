import { APIService } from '@aneuhold/core-ts-api-lib';
import { createLogger } from '$util/logging/logger';

const log = createLogger('localOverride.ts');

/**
 * Overrides various things for local development if set to true.
 */
export default function localOverride() {
  const enableLocalOverride = false;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (enableLocalOverride) {
    // Derive the API host from the page's own hostname so the same code works for web
    // (localhost), the Android emulator, and a physical device — under live-reload all three
    // load the page from the Mac's LAN IP (or localhost for web), and the backend is on :8080
    // of that same host.
    const apiUrl = `http://${window.location.hostname}:8080/`;
    log.debug(`Local override active: Using local API URL ${apiUrl}`);
    APIService.setAPIUrl(apiUrl);
  }
}
