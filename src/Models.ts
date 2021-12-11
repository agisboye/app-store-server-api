export enum Environment {
  Production = "production",
  Sandbox = "sandbox"
}

// https://developer.apple.com/documentation/appstoreserverapi/historyresponse
export interface HistoryResponse {
  appAppleId: string
  bundleId: string
  environment: Environment
  hasMore: boolean
  revision: string
  signedTransactions: JWSTransaction[]
}

// https://developer.apple.com/documentation/appstoreserverapi/jwstransaction
export type JWSTransaction = string

// https://developer.apple.com/documentation/appstoreserverapi/jwsdecodedheader
export interface JWSDecodedHeader {
  alg: string
  kid: string
  x5c: string[]
}

// https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload
export interface JWSTransactionDecodedPayload {
  appAccountToken?: string
  bundleId: string
  expiresDate?: number // UNIX timestamp in ms
  inAppOwnershipType: OwnershipType
  isUpgraded?: boolean
  offerIdentifier?: string
  offerType?: OfferType
  originalPurchaseDate: number // UNIX timestamp in ms
  originalTransactionId: string
  productId: string
  purchaseDate: number // UNIX timestamp in ms
  quantity: number
  revocationDate?: number // UNIX timestamp in ms
  revocationReason?: number
  signedDate: number // UNIX timestamp in ms
  subscriptionGroupIdentifier?: string
  transactionId: string
  type: TransactionType
  webOrderLineItemId: string
}

// https://developer.apple.com/documentation/appstoreserverapi/inappownershiptype
export enum OwnershipType {
  Purchased = "PURCHASED",
  FamilyShared = "FAMILY_SHARED"
}

// https://developer.apple.com/documentation/appstoreserverapi/type
export enum TransactionType {
  AutoRenewableSubscription = "Auto-Renewable Subscription",
  NonConsumable = "Non-Consumable",
  Consumable = "Consumable",
  NonRenewingSubscription = "Non-Renewing Subscription"
}

// https://developer.apple.com/documentation/appstoreserverapi/statusresponse
export interface StatusResponse {
  data: SubscriptionGroupIdentifierItem[]
  environment: Environment
  appAppleId: string
  bundleId: string
}

// https://developer.apple.com/documentation/appstoreserverapi/subscriptiongroupidentifieritem
export interface SubscriptionGroupIdentifierItem {
  subscriptionGroupIdentifier: string
  lastTransactions: LastTransactionsItem[]
}

// https://developer.apple.com/documentation/appstoreserverapi/lasttransactionsitem
export interface LastTransactionsItem {
  originalTransactionId: string
  status: SubscriptionStatus
  signedRenewalInfo: JWSRenewalInfo
  signedTransactionInfo: JWSTransaction
}

// https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfo
export type JWSRenewalInfo = string

// https://developer.apple.com/documentation/appstoreserverapi/status
export enum SubscriptionStatus {
  Active = 1,
  Expired = 2,
  InBillingRetry = 3,
  InBillingGracePeriod = 4,
  Revoked = 5
}

// https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload
export interface JWSRenewalInfoDecodedPayload {
  autoRenewProductId: string
  autoRenewStatus: AutoRenewStatus
  expirationIntent?: ExpirationIntent
  gracePeriodExpiresDate?: number
  isInBillingRetryPeriod?: boolean
  offerIdentifier?: string
  offerType?: OfferType
  originalTransactionId: string
  priceIncreaseStatus?: PriceIncreaseStatus
  productId: string
  signedDate: number // UNIX timestamp in ms
}

// https://developer.apple.com/documentation/appstoreserverapi/autorenewstatus
export enum AutoRenewStatus {
  Off = 0,
  On = 1
}

// https://developer.apple.com/documentation/appstoreserverapi/expirationintent
export enum ExpirationIntent {
  Canceled = 1,
  BillingError = 2,
  RejectedPriceIncrease = 3,
  ProductUnavailable = 4
}

// https://developer.apple.com/documentation/appstoreserverapi/offertype
export enum OfferType {
  Introductory = 1,
  Promotional = 2,
  SubscriptionOfferCode = 3
}

// https://developer.apple.com/documentation/appstoreserverapi/priceincreasestatus
export enum PriceIncreaseStatus {
  NoResponse = 0,
  Consented = 1
}

// https://developer.apple.com/documentation/appstoreserverapi/orderlookupresponse
export interface OrderLookupResponse {
  orderLookupStatus: OrderLookupStatus
  signedTransactions: JWSTransaction[]
}

// https://developer.apple.com/documentation/appstoreserverapi/orderlookupstatus
export enum OrderLookupStatus {
  Valid = 0,
  Invalid = 1
}

// https://developer.apple.com/documentation/appstoreservernotifications/responsebodyv2decodedpayload
export interface DecodedNotificationPayload {
  notificationType: NotificationType
  subtype?: NotificationSubtype
  notificationUUID: string
  version: string // Apple incorrectly calls this `notificationVersion` in their documentation.
  data: NotificationData
}

// https://developer.apple.com/documentation/appstoreservernotifications/data
export interface NotificationData {
  appAppleId: string
  bundleId: string
  bundleVersion: number
  environment: Environment
  signedRenewalInfo: JWSRenewalInfo
  signedTransactionInfo: JWSTransaction
}

// https://developer.apple.com/documentation/appstoreservernotifications/notificationtype
export enum NotificationType {
  ConsumptionRequest = "CONSUMPTION_REQUEST",
  DidChangeRenewalPref = "DID_CHANGE_RENEWAL_PREF",
  DidChangeRenewalStatus = "DID_CHANGE_RENEWAL_STATUS",
  DidFailToRenew = "DID_FAIL_TO_RENEW",
  DidRenew = "DID_RENEW",
  Expired = "EXPIRED",
  GracePeriodExpired = "GRACE_PERIOD_EXPIRED",
  OfferRedeemed = "OFFER_REDEEMED",
  PriceIncrease = "PRICE_INCREASE",
  Refund = "REFUND",
  RefundDeclined = "REFUND_DECLINED",
  RenewalExtended = "RENEWAL_EXTENDED",
  Revoke = "REVOKE",
  Subscribed = "SUBSCRIBED"
}

// https://developer.apple.com/documentation/appstoreservernotifications/subtype
export enum NotificationSubtype {
  InitialBuy = "INITIAL_BUY",
  Resubscribe = "RESUBSCRIBE",
  Downgrade = "DOWNGRADE",
  Upgrade = "UPGRADE",
  AutoRenewEnabled = "AUTO_RENEW_ENABLED",
  AutoRenewDisabled = "AUTO_RENEW_DISABLED",
  Voluntary = "VOLUNTARY",
  BillingRetry = "BILLING_RETRY",
  PriceIncrease = "PRICE_INCREASE",
  GracePeriod = "GRACE_PERIOD",
  BillingRecovery = "BILLING_RECOVERY",
  Pending = "PENDING",
  Accepted = "ACCEPTED"
}