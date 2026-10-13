import { WorkoutUserConfigSchema } from '@aneuhold/core-ts-db-lib';
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
   * Sets when the current user's supporter entitlement expires.
   *
   * @param supporterExpiresAt The expiry, or null for a user who is
   *   not a supporter
   */
  setSupporterExpiresAt(supporterExpiresAt: Date | null): void {
    userConfigService.updateWithoutApiPersist((config) => ({
      ...config,
      entitlements: { ...config.entitlements, supporterExpiresAt }
    }));
  }

  /**
   * Gives the current user a supporter entitlement that expires a year from
   * now.
   */
  grantSupporter(): void {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    this.setSupporterExpiresAt(expiresAt);
  }
}

const userConfigServiceMock = new UserConfigServiceMock();
export default userConfigServiceMock;
