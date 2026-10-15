import type { WorkoutEntitlement } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import LoggingService from '$services/LoggingService/Logging.service';
import userConfigService from '$services/UserConfigService/UserConfig.service.svelte';
import type { IPurchaseBackend } from './IPurchaseBackend';
import revenueCatService from './RevenueCat.service';

/**
 * Handles in-app purchases through a swappable {@link IPurchaseBackend}.
 * Purchased entitlements are written to the local config right away, until
 * the next initial data fetch replaces them with the server's values.
 */
class PurchaseService {
  readonly #log = LoggingService.createLogger('PurchaseService');
  readonly #backend: IPurchaseBackend = revenueCatService;
  #disabled = false;
  #userId: UUID | null = null;
  #identifyPromise: Promise<void> | null = null;

  /**
   * Makes every method a no-op, so the app runs without a purchase provider.
   */
  disable(): void {
    this.#disabled = true;
  }

  /**
   * Sets the signed-in user and identifies them with the purchase provider.
   * Errors are logged rather than thrown, and the next purchase call retries.
   *
   * @param userId The signed-in user's ID.
   */
  async init(userId: UUID): Promise<void> {
    if (this.#disabled) return;
    this.#userId = userId;
    this.#identifyPromise = null;
    try {
      await this.#ensureIdentified();
    } catch (e) {
      this.#log.error('Failed to identify the user with the purchase provider', e);
    }
  }

  /**
   * Purchases the given entitlement and unlocks it locally. A purchase the
   * user cancels is a no-op.
   *
   * @param entitlement The entitlement to purchase.
   */
  async purchaseEntitlement(entitlement: WorkoutEntitlement): Promise<void> {
    if (this.#disabled) return;
    await this.#ensureIdentified();
    const result = await this.#backend.purchaseEntitlement(entitlement);
    if (!result) return;

    // Without persist because it will come back on the next API call that is fresh.
    userConfigService.updateWithoutApiPersist((config) => ({
      ...config,
      entitlements: { ...config.entitlements, [entitlement]: { expiresAt: result.expiresAt } }
    }));
  }

  /**
   * Gets the URL where the user manages their purchases, or null when they
   * have none to manage.
   */
  async getManagementUrl(): Promise<string | null> {
    if (this.#disabled) return null;
    await this.#ensureIdentified();
    return this.#backend.getManagementUrl();
  }

  /**
   * Identifies the current user with the purchase provider once. A failed
   * attempt is cleared, so the next call retries it.
   */
  async #ensureIdentified(): Promise<void> {
    const userId = this.#userId;
    if (!userId) throw new Error('No signed-in user to identify with the purchase provider');
    if (!this.#identifyPromise) {
      const attempt = this.#backend.identify(userId);
      this.#identifyPromise = attempt;

      // Make sure to clear the attempt if it fails. It checks to see if it is the same in case
      // one starts and before it finishes, another one is started and then the first one fails.
      // So it doesn't clear the current one if it isn't the same.
      attempt.catch(() => {
        if (this.#identifyPromise === attempt) this.#identifyPromise = null;
      });
    }

    // Return the promise to be awaited.
    return this.#identifyPromise;
  }
}

const purchaseService = new PurchaseService();
export default purchaseService;
