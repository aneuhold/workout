import UserConfigMock from '$stores/local/userConfig/userConfig.mock';
import TestUsers from './TestUsers';

/**
 * Global mock data for tests.
 */
export default class MockData {
  // TODO: Add workout-specific mocks here when needed
  static userSettingsMock = new UserConfigMock(TestUsers.currentUserCto._id);
}
