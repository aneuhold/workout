import { APIService } from '@aneuhold/core-ts-api-lib';
import { Capacitor } from '@capacitor/core';
import { createLogger } from '$util/logging/logger';

const log = createLogger('localOverride.ts');

/**
 * Overrides various things for local development if set to true.
 */
export default function localOverride() {
  const enableLocalOverride = false;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (enableLocalOverride) {
    const apiUrl = Capacitor.isNativePlatform()
      ? // What the android emulator uses to access localhost of the host machine
        'http://10.0.2.2:8080/'
      : // Normal localhost for web
        'http://localhost:8080/';
    log.debug(`Local override active: Using local API URL ${apiUrl}`);
    APIService.setAPIUrl(apiUrl);
  }
}
