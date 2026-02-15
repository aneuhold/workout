import { DocumentService } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { type UserConfig, userConfig } from './userConfig';

/**
 * A mock provider for the UserConfig store. This depends on the backend API
 * being mocked already so it doesn't try to contact the server.
 */
export default class UserConfigMock {
  constructor(private userId: UUID) {
    this.reset();
  }

  reset(): void {
    const mockConfig: UserConfig = {
      userId: this.userId,
      username: 'Mock User',
      apiKey: DocumentService.generateID()
    };
    userConfig.setWithoutPropagation(mockConfig);
  }
}
