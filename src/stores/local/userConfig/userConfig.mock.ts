import MockUsers from '$util/MockUsers';
import { type UserConfig, userConfig } from './userConfig';

/**
 * A mock provider for the UserConfig store. This depends on the backend API
 * being mocked already so it doesn't try to contact the server.
 */
export default class UserConfigMock {
  /**
   * Sets the store to a mock user with the current test user's ID, without
   * persisting it.
   */
  reset(): void {
    const mockConfig: UserConfig = {
      userId: MockUsers.currentUserCto._id,
      username: 'Mock User',
      accessToken: null,
      refreshTokenString: null
    };
    userConfig.setWithoutPropagation(mockConfig);
  }
}
