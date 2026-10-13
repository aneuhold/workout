import type {
  ProjectWorkoutPrimaryEndpointOptions,
  ProjectWorkoutPrimaryOutput
} from '@aneuhold/core-ts-api-lib';
import type { WorkoutUserConfig } from '@aneuhold/core-ts-db-lib';
import type { Updater } from 'svelte/store';
import AbstractDocumentMapStoreService from '$services/DocumentMapStoreService/AbstractDocumentMapStore.service';
import { currentUser } from '$stores/local/currentUser/currentUser';
import LocalData from '$util/LocalData/LocalData';

/**
 * Holds the signed-in user's {@link WorkoutUserConfig}, persisted to local
 * data and refreshed from the API.
 */
class UserConfigService extends AbstractDocumentMapStoreService {
  #config: WorkoutUserConfig | null = $state(null);

  /**
   * The config of the signed-in user, if it has been loaded.
   */
  get currentConfig(): WorkoutUserConfig | undefined {
    const { userId } = currentUser.get();
    return this.#config?.userId === userId ? this.#config : undefined;
  }

  /**
   * The signed-in user's entitlements, each true while it is unexpired.
   */
  get entitlements(): { supporter: boolean } {
    const supporterExpiresAt = this.currentConfig?.entitlements.supporterExpiresAt;
    return { supporter: !!supporterExpiresAt && supporterExpiresAt.getTime() > Date.now() };
  }

  /**
   * Replaces the config and persists it to local data, without sending it to
   * the API.
   *
   * @param config The new config, or null to clear it
   */
  setWithoutApiPersist(config: WorkoutUserConfig | null): void {
    this.#config = config;
    this.persistDocumentMap();
  }

  /**
   * Updates the signed-in user's config and persists it to local data,
   * without sending it to the API. Does nothing when that config has not been
   * loaded.
   *
   * @param updater Returns the updated config
   */
  updateWithoutApiPersist(updater: Updater<WorkoutUserConfig>): void {
    const { currentConfig } = this;
    if (!currentConfig) return;
    this.setWithoutApiPersist(updater(currentConfig));
  }

  public override persistDocumentMap(): void {
    void LocalData.setWorkoutUserConfig(this.#config);
  }

  public override handleApiOutput(
    output: ProjectWorkoutPrimaryOutput,
    input: ProjectWorkoutPrimaryEndpointOptions
  ): void {
    if (output.userConfig && input.get?.userConfig) {
      this.setWithoutApiPersist(output.userConfig);
    }
  }

  public override async hydrate(): Promise<void> {
    const cached = await LocalData.getWorkoutUserConfig();
    if (cached) {
      this.#config = cached;
    }
  }
}

const userConfigService = new UserConfigService();
export default userConfigService;
