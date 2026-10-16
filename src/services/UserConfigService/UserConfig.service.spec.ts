import { WorkoutEntitlement } from '@aneuhold/core-ts-db-lib';
import { DateService } from '@aneuhold/core-ts-lib';
import { beforeEach, describe, expect, it } from 'vitest';
import mockBackendService from '$services/MockBackendService/MockBackend.service';
import userConfigServiceMock from './UserConfig.service.mock';
import userConfigService from './UserConfig.service.svelte';

describe('Unit Tests', () => {
  beforeEach(() => {
    mockBackendService.setupGlobalMocks();
  });

  describe('entitlements', () => {
    it('has supporter true when the entitlement expires in the future', () => {
      userConfigServiceMock.setEntitlementExpiresAt(
        WorkoutEntitlement.Supporter,
        DateService.addDays(new Date(), 1)
      );

      expect(userConfigService.entitlements[WorkoutEntitlement.Supporter]).toBe(true);
    });

    it('has supporter false when the entitlement has expired', () => {
      userConfigServiceMock.setEntitlementExpiresAt(
        WorkoutEntitlement.Supporter,
        DateService.addDays(new Date(), -1)
      );

      expect(userConfigService.entitlements[WorkoutEntitlement.Supporter]).toBe(false);
    });

    it('has supporter false when the entitlement expiry is null', () => {
      userConfigServiceMock.setEntitlementExpiresAt(WorkoutEntitlement.Supporter, null);

      expect(userConfigService.entitlements[WorkoutEntitlement.Supporter]).toBe(false);
    });

    it('has supporter false when the current user has no config', () => {
      userConfigService.setWithoutApiPersist(null);

      expect(userConfigService.entitlements[WorkoutEntitlement.Supporter]).toBe(false);
    });
  });
});
