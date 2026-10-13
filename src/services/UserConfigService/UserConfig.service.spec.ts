import { DateService } from '@aneuhold/core-ts-lib';
import { beforeEach, describe, expect, it } from 'vitest';
import mockEnvSetupService from '$services/MockEnvSetupService/MockEnvSetup.service';
import userConfigServiceMock from './UserConfig.service.mock';
import userConfigService from './UserConfig.service.svelte';

describe('Unit Tests', () => {
  beforeEach(() => {
    mockEnvSetupService.setupGlobalMocks();
  });

  describe('entitlements', () => {
    it('has supporter true when the entitlement expires in the future', () => {
      userConfigServiceMock.setSupporterExpiresAt(DateService.addDays(new Date(), 1));

      expect(userConfigService.entitlements.supporter).toBe(true);
    });

    it('has supporter false when the entitlement has expired', () => {
      userConfigServiceMock.setSupporterExpiresAt(DateService.addDays(new Date(), -1));

      expect(userConfigService.entitlements.supporter).toBe(false);
    });

    it('has supporter false when the entitlement expiry is null', () => {
      userConfigServiceMock.setSupporterExpiresAt(null);

      expect(userConfigService.entitlements.supporter).toBe(false);
    });

    it('has supporter false when the current user has no config', () => {
      userConfigService.setWithoutApiPersist(null);

      expect(userConfigService.entitlements.supporter).toBe(false);
    });
  });
});
