import type {
  ProjectWorkoutPrimaryEndpointOptions,
  ProjectWorkoutPrimaryOutput
} from '@aneuhold/core-ts-api-lib';
import {
  WorkoutEntitlement,
  type WorkoutUserConfig,
  WorkoutUserConfigSchema
} from '@aneuhold/core-ts-db-lib';
import type { Updater } from 'svelte/store';
import AbstractDocumentMapStoreService from '$services/DocumentMapStoreService/AbstractDocumentMapStore.service';
import WorkoutAPIService from '$services/WorkoutAPIService/WorkoutAPI.service';
import { currentUser } from '$stores/local/currentUser/currentUser';
import LocalData from '$util/LocalData/LocalData';

/**
 * Holds the signed-in user's {@link WorkoutUserConfig}, persisted to local
 * data and refreshed from the API.
 */
class UserConfigService extends AbstractDocumentMapStoreService {
  #config: WorkoutUserConfig | null = $state(null);

  /**
   * The config of the signed-in user. Throws when it has not been loaded.
   */
  get config(): WorkoutUserConfig {
    const config = this.#getCurrentConfig();
    if (!config) {
      throw new Error('The signed-in user has no loaded config.');
    }
    return config;
  }

  /**
   * Whether the signed-in user's config has been loaded.
   */
  get isLoaded(): boolean {
    return this.#getCurrentConfig() !== undefined;
  }

  /**
   * The signed-in user's entitlements, each true while it is unexpired. This is helpful for quick
   * true/false checks. To get full info, use `config`.
   */
  get entitlements(): Record<WorkoutEntitlement, boolean> {
    return { [WorkoutEntitlement.Supporter]: this.#holds(WorkoutEntitlement.Supporter) };
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
   * Updates the signed-in user's config, persists it to local data, and sends
   * it to the API. Does nothing when that config has not been loaded.
   *
   * @param updater Returns the updated config
   */
  update(updater: Updater<WorkoutUserConfig>): void {
    this.updateWithoutApiPersist(updater);
    const config = this.#getCurrentConfig();
    if (!config) return;
    WorkoutAPIService.queryApi({ update: { userConfig: config } });
  }

  /**
   * Updates the signed-in user's config and persists it to local data,
   * without sending it to the API. Does nothing when that config has not been
   * loaded.
   *
   * @param updater Returns the updated config
   */
  updateWithoutApiPersist(updater: Updater<WorkoutUserConfig>): void {
    const config = this.#getCurrentConfig();
    if (!config) return;
    this.setWithoutApiPersist(updater(config));
  }

  public override persistDocumentMap(): void {
    void LocalData.setWorkoutUserConfig(this.#config);
  }

  public override handleApiOutput(
    output: ProjectWorkoutPrimaryOutput,
    input: ProjectWorkoutPrimaryEndpointOptions
  ): void {
    if (output.userConfig && input.get?.userConfig) {
      this.setWithoutApiPersist(WorkoutUserConfigSchema.parse(output.userConfig));
    }
  }

  public override async hydrate(): Promise<void> {
    const cached = await LocalData.getWorkoutUserConfig();
    if (cached) {
      this.#config = WorkoutUserConfigSchema.parse(cached);
    }
  }

  /**
   * The config of the signed-in user, or undefined when it has not been loaded.
   */
  #getCurrentConfig(): WorkoutUserConfig | undefined {
    const { userId } = currentUser.get();
    return this.#config?.userId === userId ? this.#config : undefined;
  }

  /**
   * Whether the signed-in user's config has the entitlement unexpired.
   *
   * @param entitlement The entitlement to check.
   */
  #holds(entitlement: WorkoutEntitlement): boolean {
    const expiresAt = this.#getCurrentConfig()?.entitlements[entitlement]?.expiresAt;
    return !!expiresAt && expiresAt.getTime() > Date.now();
  }
}

const userConfigService = new UserConfigService();
export default userConfigService;
