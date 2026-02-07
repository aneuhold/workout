import { type ProjectDashboardOutput } from '@aneuhold/core-ts-api-lib';
import type { BaseDocument, UserCTO } from '@aneuhold/core-ts-db-lib';
import { snackbar } from '$components/singletons/SingletonSnackbar.svelte';
import nonogramKatanaItemMapService from '$services/NonogramKatana/NonogramKatanaItemMapService';
import nonogramKatanaUpgradeMapService from '$services/NonogramKatana/NonogramKatanaUpgradeMapService';
import taskMapService from '$services/Task/TaskMapService/TaskMapService';
import { translations } from '$stores/local/translations';
import { userConfig } from '$stores/local/userConfig/userConfig';
import { createLogger } from '$util/logging/logger';

const log = createLogger('DashboardAPIResponseHandlingService.ts');

export default class DashboardAPIResponseHandlingService {
  /**
   * Processes the final output of a series of API requests.
   *
   * @param output The combined output of all API requests
   * @param isFirstInitData Whether this is the first initial data fetch
   */
  static processDashboardApiOutput(output: ProjectDashboardOutput, isFirstInitData: boolean) {
    if (output.translations) {
      translations.set(output.translations);
    }
    if (output.userConfig) {
      userConfig.setWithoutPropagation({
        config: output.userConfig,
        collaborators: this.getCollaboratorsFromResult(output)
      });
    }
    if (output.tasks) {
      taskMapService.setMap(this.convertDocumentArrayToMap(output.tasks));
    }
    if (output.nonogramKatanaItems) {
      nonogramKatanaItemMapService.setMap(
        this.convertDocumentArrayToMap(output.nonogramKatanaItems)
      );
    }
    if (output.nonogramKatanaUpgrades) {
      nonogramKatanaUpgradeMapService.setMap(
        this.convertDocumentArrayToMap(output.nonogramKatanaUpgrades)
      );
    }
    // Trigger some extra info if this is the first sync
    if (isFirstInitData && Object.keys(output).length > 0) {
      log.info('Successfully got initial data');
      snackbar.success('Successfully synced 🎉');
    } else if (isFirstInitData) {
      // If there wasn't any data that came back from the initial sync, then
      // something went wrong.
      log.error('Error getting initial data', output);
      snackbar.error('Error syncing');
    }
  }

  private static convertDocumentArrayToMap<T extends BaseDocument>(
    documents: T[]
  ): Record<string, T> {
    return documents.reduce<Record<string, T>>((map, document) => {
      map[document._id] = document;
      return map;
    }, {});
  }

  static getCollaboratorsFromResult(data: ProjectDashboardOutput): Record<string, UserCTO> {
    if (data.collaborators) {
      return data.collaborators.reduce<Record<string, UserCTO>>((collaboratorsMap, userCto) => {
        collaboratorsMap[userCto._id] = userCto;
        return collaboratorsMap;
      }, {});
    } else {
      return {};
    }
  }
}
