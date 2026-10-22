import type { WorkoutEntitlement } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';

/**
 * Common contract every purchase provider implements. A backend talks to its
 * provider's SDKs and finds each {@link WorkoutEntitlement}'s products and
 * entitlements through `workoutEntitlementDefinitions`; `PurchaseService` owns
 * everything else.
 */
export interface IPurchaseBackend {
  /**
   * Identifies the signed-in user with the provider, so purchases are tied to
   * them.
   *
   * @param userId The signed-in user's ID.
   */
  identify: (userId: UUID) => Promise<void>;

  /**
   * Purchases the given entitlement. Resolves to when it now expires, or
   * `null` when the user cancels.
   *
   * @param entitlement The entitlement to purchase.
   */
  purchaseEntitlement: (
    entitlement: WorkoutEntitlement
  ) => Promise<{ expiresAt: Date | null } | null>;

  /**
   * Resolves to the URL where the user manages their purchases, or `null`
   * when they have none to manage.
   */
  getManagementUrl: () => Promise<string | null>;
}
