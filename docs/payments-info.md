# Payments info

How a purchase of a `WorkoutEntitlement` moves from a subscribe button to the unlocked feature. Google Play and the web differ only until RevenueCat records the purchase. From there, both follow the same path.

## Google Play (Android app)

```mermaid
sequenceDiagram
  actor User
  participant App as PurchaseService
  participant SDK as @revenuecat/purchases-capacitor
  participant Play as Google Play
  participant RC as RevenueCat

  User->>App: purchaseEntitlement(entitlement)
  App->>SDK: purchasePackage(packageId)
  SDK->>Play: Opens Play purchase sheet
  User->>Play: Confirms purchase
  Play-->>SDK: Purchase token
  SDK->>RC: Sends purchase token
  RC->>Play: Validates purchase
  RC-->>SDK: CustomerInfo (entitlementLookupKey active)
  Note over Play,RC: Renewals and cancellations reach RevenueCat<br/>through Real-time Developer Notifications (Pub/Sub)
```

## Web (Web Billing with Stripe)

```mermaid
sequenceDiagram
  actor User
  participant App as PurchaseService
  participant SDK as @revenuecat/purchases-js
  participant RC as RevenueCat Web Billing
  participant Stripe

  User->>App: purchaseEntitlement(entitlement)
  App->>SDK: purchase(packageId)
  SDK->>User: Shows RevenueCat checkout (Stripe payment form)
  User->>SDK: Enters card, confirms purchase
  SDK->>RC: Submits checkout
  RC->>Stripe: Creates subscription and charges card
  RC-->>SDK: CustomerInfo (entitlementLookupKey active)
  Note over RC,Stripe: Renewals and cancellations are handled by<br/>RevenueCat through the connected Stripe account
```

## Shared: RevenueCat to the app

```mermaid
sequenceDiagram
  participant App as PurchaseService + UserConfigService
  participant RC as RevenueCat
  participant BE as gcloud-backend
  participant DB as WorkoutUserConfig (MongoDB)

  RC-->>App: CustomerInfo from the purchase call
  App->>App: updateWithoutApiPersist(expiresAt)<br/>local only, unlocks immediately

  RC->>BE: POST project/workout/entitlement<br/>/revenueCat/webhook
  Note over BE: RevenueCatWebhookGuard<br/>checks the Authorization header
  BE->>BE: WorkoutEntitlementService<br/>.handleRevenueCatWebhookEvent<br/>collects the user IDs
  BE->>RC: GET /v2/projects/{projectId}/customers<br/>/{userId}/active_entitlements
  RC-->>BE: expires_at for each active entitlementId
  BE->>DB: WorkoutUserConfigRepository.update<br/>expiresAt per entitlement, null if not active
  BE-->>RC: 200

  App->>BE: POST project/workout (get.userConfig)
  BE->>DB: WorkoutRetrieval.service reads the user's config
  BE-->>App: userConfig
  App->>App: UserConfigService.handleApiOutput<br/>entitlements[entitlement] gates the feature
```

Both the webhook and the dashboard admin panel's Sync action use `WorkoutEntitlementService.syncEntitlements` to fetch and write. The webhook syncs every entitlement, and Sync syncs only the entitlements it lists.
