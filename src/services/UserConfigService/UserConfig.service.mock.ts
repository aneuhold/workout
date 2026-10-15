import { type WorkoutEntitlement, WorkoutUserConfigSchema } from '@aneuhold/core-ts-db-lib';
import MockUsers from '$util/MockUsers';
import userConfigService from './UserConfig.service.svelte';

class UserConfigServiceMock {
  /**
   * Replaces the config with a default one for the current user, like the one
   * the backend creates for every new user.
   */
  reset(): void {
    userConfigService.setWithoutApiPersist(
      WorkoutUserConfigSchema.parse({ userId: MockUsers.currentUserCto._id })
    );
  }

  /**
   * Sets when one of the current user's entitlements expires.
   *
   * @param entitlement The entitlement to set
   * @param expiresAt The expiry, or null for a user who does not hold it
   */
  setEntitlementExpiresAt(entitlement: WorkoutEntitlement, expiresAt: Date | null): void {
    userConfigService.updateWithoutApiPersist((config) => ({
      ...config,
      entitlements: { ...config.entitlements, [entitlement]: { expiresAt } }
    }));
  }

  /**
   * Gives the current user an entitlement that expires a year from now.
   *
   * @param entitlement The entitlement to grant
   */
  grantEntitlement(entitlement: WorkoutEntitlement): void {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    this.setEntitlementExpiresAt(entitlement, expiresAt);
  }
}

const userConfigServiceMock = new UserConfigServiceMock();
export default userConfigServiceMock;
