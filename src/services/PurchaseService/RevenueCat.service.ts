import { type WorkoutEntitlement, workoutEntitlementDefinitions } from '@aneuhold/core-ts-db-lib';
import { Capacitor } from '@capacitor/core';
import {
  Purchases as NativePurchases,
  PURCHASES_ERROR_CODE
} from '@revenuecat/purchases-capacitor';
import { ErrorCode, Purchases as WebPurchases, PurchasesError } from '@revenuecat/purchases-js';
import type { UUID } from 'crypto';
import appConfigService from '$services/AppConfigService/AppConfig.service';
import type { IPurchaseBackend } from './IPurchaseBackend';

/**
 * The RevenueCat {@link IPurchaseBackend}. Wraps `@revenuecat/purchases-capacitor`
 * (Google Play Billing) on native and `@revenuecat/purchases-js` (RevenueCat Web
 * Billing) on web. The RevenueCat app user ID is always the signed-in user's ID.
 */
class RevenueCatService implements IPurchaseBackend {
  static readonly #playStoreApiKey = 'goog_MBlwtwazXAphuqLnFTuPhquiPpB';
  static readonly #webApiKey = 'rcb_eBhpqqdAPcFtQyMGxlpcsSjbBiZk';
  static readonly #webSandboxApiKey = 'rcb_sb_jUpWrhhvYOdUjRIUyTwqmJSyb';

  /**
   * Configures the platform's SDK for the user, or switches to the user if it
   * is already configured. Never logs out, since that would create an
   * anonymous RevenueCat user. Web uses the sandbox key outside production.
   *
   * @param userId The user to identify as.
   */
  async identify(userId: UUID): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const { isConfigured } = await NativePurchases.isConfigured();
      if (isConfigured) {
        await NativePurchases.logIn({ appUserID: userId });
      } else {
        await NativePurchases.configure({
          apiKey: RevenueCatService.#playStoreApiKey,
          appUserID: userId
        });
      }
    } else if (WebPurchases.isConfigured()) {
      await WebPurchases.getSharedInstance().changeUser(userId);
    } else {
      WebPurchases.configure({
        apiKey: appConfigService.isProduction
          ? RevenueCatService.#webApiKey
          : RevenueCatService.#webSandboxApiKey,
        appUserId: userId
      });
    }
  }

  /**
   * Purchases the package that grants the entitlement and returns when the
   * entitlement now expires, or null when the user cancels.
   *
   * @param entitlement The entitlement to purchase.
   */
  async purchaseEntitlement(
    entitlement: WorkoutEntitlement
  ): Promise<{ expiresAt: Date | null } | null> {
    const { packageId, entitlementLookupKey } =
      workoutEntitlementDefinitions[entitlement].revenueCat;
    try {
      const expiresAt = Capacitor.isNativePlatform()
        ? await this.#purchaseNative(packageId, entitlementLookupKey)
        : await this.#purchaseWeb(packageId, entitlementLookupKey);
      return { expiresAt };
    } catch (e) {
      if (this.#isCancellation(e)) return null;
      throw e;
    }
  }

  /**
   * Gets the URL where the user manages their subscription, or null when they
   * have no RevenueCat purchase to manage.
   */
  async getManagementUrl(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const { customerInfo } = await NativePurchases.getCustomerInfo();
      return customerInfo.managementURL;
    }
    const customerInfo = await WebPurchases.getSharedInstance().getCustomerInfo();
    return customerInfo.managementURL;
  }

  /**
   * Purchases a package through Google Play and returns when the entitlement
   * now expires.
   *
   * @param packageId The package to purchase.
   * @param entitlementLookupKey The lookup key of the RevenueCat entitlement
   *   the package grants.
   */
  async #purchaseNative(packageId: string, entitlementLookupKey: string): Promise<Date | null> {
    const { current } = await NativePurchases.getOfferings();
    const { customerInfo } = await NativePurchases.purchasePackage({
      aPackage: this.#findPackage(current, packageId)
    });
    const expirationDate = customerInfo.entitlements.active[entitlementLookupKey]?.expirationDate;
    return expirationDate ? new Date(expirationDate) : null;
  }

  /**
   * Purchases a package through RevenueCat Web Billing and returns when the
   * entitlement now expires.
   *
   * @param packageId The package to purchase.
   * @param entitlementLookupKey The lookup key of the RevenueCat entitlement
   *   the package grants.
   */
  async #purchaseWeb(packageId: string, entitlementLookupKey: string): Promise<Date | null> {
    const purchases = WebPurchases.getSharedInstance();
    const { current } = await purchases.getOfferings();
    const { customerInfo } = await purchases.purchase({
      rcPackage: this.#findPackage(current, packageId)
    });
    return customerInfo.entitlements.active[entitlementLookupKey]?.expirationDate ?? null;
  }

  /**
   * Finds a package in the current offering of either SDK.
   *
   * @param offering The current offering.
   * @param packageId The package to find.
   */
  #findPackage<TPackage extends { identifier: string }>(
    offering: { availablePackages: TPackage[] } | null,
    packageId: string
  ): TPackage {
    const foundPackage = offering?.availablePackages.find(
      ({ identifier }) => identifier === packageId
    );
    if (!foundPackage) {
      throw new Error(`RevenueCat package ${packageId} is not in the current offering`);
    }
    return foundPackage;
  }

  /**
   * Whether an error thrown by either SDK is the user cancelling the purchase.
   * The native SDK throws plain objects with a `code`, so they are checked
   * structurally.
   *
   * @param e The thrown error.
   */
  #isCancellation(e: unknown): boolean {
    if (e instanceof PurchasesError) {
      return e.errorCode === ErrorCode.UserCancelledError;
    }
    return (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      e.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
    );
  }
}

const revenueCatService = new RevenueCatService();
export default revenueCatService;
