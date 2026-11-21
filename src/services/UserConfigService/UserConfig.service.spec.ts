import {
  WorkoutEntitlement,
  WorkoutMesocyclePlanningSettingsSchema,
  type WorkoutUserConfig,
  WorkoutUserConfigSchema
} from '@aneuhold/core-ts-db-lib';
import { DateService } from '@aneuhold/core-ts-lib';
import { beforeEach, describe, expect, it } from 'vitest';
import mockBackendService from '$services/MockBackendService/MockBackend.service';
import LocalData from '$util/LocalData/LocalData';
import SessionStorageBackend from '$util/LocalData/SessionStorageBackend';
import MockUsers from '$util/MockUsers';
import userConfigServiceMock from './UserConfig.service.mock';
import userConfigService from './UserConfig.service.svelte';

describe('Unit Tests', () => {
  beforeEach(() => {
    mockBackendService.setupGlobalMocks();
  });

  /**
   * Builds a config for the current user that lacks `mesocyclePlanningSettings`, like one stored
   * or sent before that field existed.
   */
  const createConfigWithoutPlanningSettings = (): WorkoutUserConfig => {
    const config = WorkoutUserConfigSchema.parse({ userId: MockUsers.currentUserCto._id });
    Reflect.deleteProperty(config, 'mesocyclePlanningSettings');
    return config;
  };

  const defaultPlanningSettings = WorkoutMesocyclePlanningSettingsSchema.parse({});

  describe('config', () => {
    it('throws when the current user has no config', () => {
      userConfigService.setWithoutApiPersist(null);

      expect(() => userConfigService.config).toThrow();
    });
  });

  describe('hydrate', () => {
    beforeEach(async () => {
      await LocalData.init(new SessionStorageBackend());
    });

    it('fills in a missing mesocyclePlanningSettings', async () => {
      await LocalData.setWorkoutUserConfig(createConfigWithoutPlanningSettings());

      await userConfigService.hydrate();

      expect(userConfigService.config.mesocyclePlanningSettings).toEqual(defaultPlanningSettings);
    });

    it('treats a cached config that fails the schema as a cache miss', async () => {
      const config = WorkoutUserConfigSchema.parse({ userId: MockUsers.currentUserCto._id });
      Reflect.set(config.mesocyclePlanningSettings, 'recoverySessionBehavior', 'NotARealBehavior');
      userConfigService.setWithoutApiPersist(null);
      await LocalData.setWorkoutUserConfig(config);

      expect(await userConfigService.hydrate()).toBe(false);
      expect(() => userConfigService.config).toThrow();
    });
  });

  describe('handleApiOutput', () => {
    it('fills in a missing mesocyclePlanningSettings', () => {
      userConfigService.handleApiOutput(
        { userConfig: createConfigWithoutPlanningSettings() },
        { get: { userConfig: true } }
      );

      expect(userConfigService.config.mesocyclePlanningSettings).toEqual(defaultPlanningSettings);
    });
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
