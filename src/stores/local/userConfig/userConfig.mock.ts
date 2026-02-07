import { DashboardUserConfigSchema, type UserCTO } from '@aneuhold/core-ts-db-lib';
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
      config: DashboardUserConfigSchema.parse({ userId: this.userId }),
      collaborators: {}
    };
    userConfig.setWithoutPropagation(mockConfig);
  }

  enableConfetti(): void {
    const currentUserConfig = userConfig.get();
    currentUserConfig.config.enabledFeatures.useConfettiForTasks = true;
    userConfig.setWithoutPropagation(currentUserConfig);
  }

  addCollaborator(collaborator: UserCTO): void {
    const currentUserConfig = userConfig.get();
    currentUserConfig.collaborators[collaborator._id] = collaborator;
    userConfig.setWithoutPropagation(currentUserConfig);
  }
}
