# Payments info

How a MesoPro Supporter purchase moves from the paywall to the unlocked analytics page. Google Play and the web differ only until RevenueCat records the purchase. From there, both follow the same path.

## Google Play (Android app)

```mermaid
sequenceDiagram
  actor User
  participant App as AnalyticsPagePaywall + RevenueCatService
  participant SDK as @revenuecat/purchases-capacitor
  participant Play as Google Play
  participant RC as RevenueCat

  User->>App: Taps Subscribe
  App->>SDK: purchasePackage(supporter_monthly)
  SDK->>Play: Opens Play purchase sheet
  User->>Play: Confirms $3/month
  Play-->>SDK: Purchase token
  SDK->>RC: Sends purchase token
  RC->>Play: Validates purchase
  RC-->>SDK: CustomerInfo (supporter active)
  Note over Play,RC: Renewals and cancellations reach RevenueCat<br/>through Real-time Developer Notifications (Pub/Sub)
```

## Web (Web Billing with Stripe)

```mermaid
sequenceDiagram
  actor User
  participant App as AnalyticsPagePaywall + RevenueCatService
  participant SDK as @revenuecat/purchases-js
  participant RC as RevenueCat Web Billing
  participant Stripe

  User->>App: Taps Subscribe
  App->>SDK: purchase(supporter_monthly)
  SDK->>User: Shows RevenueCat checkout (Stripe payment form)
  User->>SDK: Enters card, confirms $3/month
  SDK->>RC: Submits checkout
  RC->>Stripe: Creates subscription and charges card
  RC-->>SDK: CustomerInfo (supporter active)
  Note over RC,Stripe: Renewals and cancellations are handled by<br/>RevenueCat through the connected Stripe account
```

## Shared: RevenueCat to the app

```mermaid
sequenceDiagram
  participant App as RevenueCatService + UserConfigMapService
  participant RC as RevenueCat
  participant BE as gcloud-backend
  participant DB as WorkoutUserConfig (MongoDB)

  RC-->>App: CustomerInfo from the purchase call
  App->>App: setMap with supporter expirationDate (local only, unlocks immediately)

  RC->>BE: POST project/workout/revenueCat/webhook
  Note over BE: RevenueCatWebhookGuard checks the Authorization header
  BE->>BE: RevenueCatService.handleWebhookEvent collects user IDs
  BE->>RC: GET /v2/projects/{projectId}/customers/{userId}/active_entitlements
  RC-->>BE: supporter expires_at (or absent)
  BE->>DB: WorkoutUserConfigRepository.update(supporterEntitlementExpiresAt)
  BE-->>RC: 200

  App->>BE: POST project/workout (get.userConfigs)
  BE->>DB: WorkoutRetrieval.service reads the user's config
  BE-->>App: userConfigs
  App->>App: UserConfigMapService.handleApiOutput, isSupporter gates the analytics page
```

The dashboard admin panel's Sync action reuses `RevenueCatService.syncSupporterEntitlement`, the same fetch and write as the webhook.
