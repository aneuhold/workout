import MockUsers from '$util/MockUsers';
import { type CurrentUser, currentUser } from './currentUser';

/**
 * A mock provider for the CurrentUser store. This depends on the backend API
 * being mocked already so it doesn't try to contact the server.
 */
class CurrentUserMock {
  /**
   * Sets the store to a mock user with the current test user's ID, without
   * persisting it.
   */
  reset(): void {
    const mockUser: CurrentUser = {
      userId: MockUsers.currentUserCto._id,
      username: 'Mock User',
      password: '',
      accessToken: null,
      refreshTokenString: null
    };
    currentUser.setWithoutPropagation(mockUser);
  }
}

const currentUserMock = new CurrentUserMock();
export default currentUserMock;
