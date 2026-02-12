import { APIService, type WorkoutWebSocketServerToClientEvents } from '@aneuhold/core-ts-api-lib';
import { DateService } from '@aneuhold/core-ts-lib';
import { io, Socket } from 'socket.io-client';
import { apiKey } from '$stores/local/apiKey';
import { createLogger } from '$util/logging/logger';

const log = createLogger('WebSocketService.ts');

/**
 * A service for handling WebSocket connections used in the application.
 */
export default class WebSocketService {
  static #socket?: Socket<WorkoutWebSocketServerToClientEvents, never>;
  static #unsubs: (() => void)[] = [];

  static connect() {
    if (this.#socket) {
      return;
    } else {
      // Use the namespace `/workout` to ensure that we only connect to the workout parts
      this.#socket = io(`${APIService.getCurrentAPIUrl()}workout`, {
        auth: {
          apiKey: apiKey.get()
        }
      });

      this.#socket.on('connect', () => {
        log.info('Connected to WebSocket server');
      });

      this.#socket.on('disconnect', () => {
        log.info('Disconnected from WebSocket server');
      });
    }
  }

  /**
   * Gets the current socket ID. Helpful to pass along in requests to the server.
   */
  static getSocketId() {
    if (!this.#socket) {
      return;
    }
    return this.#socket.id;
  }

  /**
   * Subscribes to the `rootPostResult` event.
   *
   * @param callback the callback function to call when the event is emitted
   * @returns a function to unsubscribe from the event
   */
  static subscribeToRootPostResult(
    callback: WorkoutWebSocketServerToClientEvents['rootPostResult']
  ) {
    if (!this.#socket) {
      this.connect();
    }
    this.#socket?.on('rootPostResult', (data) => {
      this.reviveDates(data);
      callback(data);
    });
    const unsub = () => {
      this.#socket?.off('rootPostResult', callback);
    };
    this.#unsubs.push(unsub);
    return unsub;
  }

  /**
   * Disconnects the current socket and clears it so a future `connect()` will
   * create a fresh connection (useful after logout or API key changes).
   *
   * Also clears all current subscriptions.
   */
  static disconnect() {
    if (!this.#socket) return;
    try {
      this.#unsubs.forEach((unsub) => {
        unsub();
      });
      this.#unsubs = [];
      this.#socket.disconnect();
    } catch (_err) {
      // Ignore disconnect errors; we'll clear the socket reference regardless.
      // Logging is omitted as this is a non-critical cleanup operation.
    }
    this.#socket = undefined;
  }

  /**
   * This really needs to be refactored into something else. Maybe Zod. It is used and exactly
   * the same on the server as well.
   *
   * @param body the body to revive
   */
  private static reviveDates(body: unknown) {
    if (body === null || typeof body !== 'object') {
      return;
    }

    const keys = Object.keys(body);
    if (keys.length === 0) {
      return;
    }
    const bodyAsRecord = body as Record<string, unknown>;
    for (const key of Object.keys(bodyAsRecord)) {
      const value = bodyAsRecord[key];
      const revivedValue = DateService.dateReviver(key, value);
      if (revivedValue !== value) {
        bodyAsRecord[key] = revivedValue;
      } else if (typeof value === 'object') {
        this.reviveDates(value);
      }
    }
  }
}
