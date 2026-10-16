import { APIService } from '@aneuhold/core-ts-api-lib';
import MockDataService from '$services/MockDataService/MockData.service';
import purchaseService from '$services/PurchaseService/Purchase.service';
import WebSocketService from '$services/WebSocket.service';
import apiResponseHandlingOrder from '$services/WorkoutAPIService/apiResponseHandlingOrder';
import WorkoutAPIService from '$services/WorkoutAPIService/WorkoutAPI.service';
import currentUserMock from '$stores/local/currentUser/currentUser.mock';
import MockAPIBackend from './MockAPIBackend';

/**
 * Cuts the app off from the network so it runs entirely on local data.
 */
class MockBackendService {
  readonly #apiBackend = new MockAPIBackend();

  /**
   * Registers the API output handlers, installs the network-free API and
   * WebSocket, then resets the mock document maps and current user.
   *
   * @param useRealBackend Leaves the API and WebSocket on their real backends
   *   instead of installing the network-free ones
   */
  setupGlobalMocks(useRealBackend = false): void {
    WorkoutAPIService.setApiOutputHandlers(apiResponseHandlingOrder);
    if (!useRealBackend) {
      this.install();
    }
    MockDataService.resetAll();
    currentUserMock.reset();
  }

  /**
   * Routes the API, WebSocket, and purchases away from the network. Resets
   * stay out of this method, because a reset erases what `LocalData` has
   * stored.
   */
  install(): void {
    APIService.setBackend(this.#apiBackend);
    WebSocketService.disable();
    purchaseService.disable();
  }
}

const mockBackendService = new MockBackendService();
export default mockBackendService;
