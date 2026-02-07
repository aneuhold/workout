import { type ProjectDashboardOutput } from '@aneuhold/core-ts-api-lib';
import type { BaseDocument, UserCTO } from '@aneuhold/core-ts-db-lib';
import taskMapService from '$services/Task/TaskMapService/TaskMapService';
import { translations } from '$stores/local/translations';
import { userConfig } from '$stores/local/userConfig/userConfig';

export default class DashboardAPIResponseHandlingService {
  /**
   * Processes the final output of a series of API requests.
   *
   * @param output The combined output of all API requests
   */
  static processDashboardApiOutput(output: ProjectDashboardOutput) {
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
