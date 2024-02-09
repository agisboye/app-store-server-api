/**
 * https://developer.apple.com/documentation/appstoreserverapi/environment
 */
export enum Environment {
  Production = "Production",
  Sandbox = "Sandbox"
}

/**
 * UNIX timestamp in milliseconds
 */
export type Timestamp = number

/**
 * ISO 3166-1 Alpha-3 country code
 * https://developer.apple.com/documentation/appstoreservernotifications/storefrontcountrycode
 */
export type StorefrontCountryCode = string

export enum SortParameter {
  Ascending = "ASCENDING",
  Descending = "DESCENDING"
}

export enum ProductTypeParameter {
  AutoRenewable = "AUTO_RENEWABLE",
  NonRenewable = "NON_RENEWABLE",
  Consumable = "CONSUMABLE",
  NonConsumable = "NON_CONSUMABLE"
}

/**
 * The query parameters that can be passed to the history endpoint
 * to filter results and change sort order.
 * https://developer.apple.com/documentation/appstoreserverapi/get_transaction_history
 */
export interface TransactionHistoryQuery {
  revision?: string
  sort?: SortParameter
  startDate?: Timestamp
  endDate?: Timestamp
  productType?: ProductTypeParameter
  productId?: string
  subscriptionGroupIdentifier?: string
  inAppOwnershipType?: OwnershipType
  revoked?: boolean
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/historyresponse
 */
export interface HistoryResponse {
  appAppleId: string
  bundleId: string
  environment: Environment
  hasMore: boolean
  revision: string
  signedTransactions: JWSTransaction[]
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/transactioninforesponse
 */
export interface TransactionInfoResponse {
  signedTransactionInfo: JWSTransaction
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/jwstransaction
 */
export type JWSTransaction = string

/**
 * https://developer.apple.com/documentation/appstoreserverapi/jwsdecodedheader
 */
export interface JWSDecodedHeader {
  alg: string
  kid: string
  x5c: string[]
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload
 */
export interface JWSTransactionDecodedPayload {
  appAccountToken?: string
  bundleId: string
  currency: string
  environment: Environment
  expiresDate?: Timestamp
  inAppOwnershipType: OwnershipType
  isUpgraded?: boolean
  offerDiscountType?: OfferDiscountType
  offerIdentifier?: string
  offerType?: OfferType
  originalPurchaseDate: Timestamp
  originalTransactionId: string
  price: number
  productId: string
  purchaseDate: Timestamp
  quantity: number
  revocationDate?: Timestamp
  revocationReason?: number
  signedDate: Timestamp
  storefront: StorefrontCountryCode
  storefrontId: string
  subscriptionGroupIdentifier?: string
  transactionId: string
  transactionReason: TransactionReason
  type: TransactionType
  webOrderLineItemId: string
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/offerdiscounttype
 */
export enum OfferDiscountType {
  FreeTrial = "FREE_TRIAL",
  PayAsYouGo = "PAY_AS_YOU_GO",
  PayUpFront = "PAY_UP_FRONT"
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/inappownershiptype
 */
export enum OwnershipType {
  Purchased = "PURCHASED",
  FamilyShared = "FAMILY_SHARED"
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/type
 */
export enum TransactionType {
  AutoRenewableSubscription = "Auto-Renewable Subscription",
  NonConsumable = "Non-Consumable",
  Consumable = "Consumable",
  NonRenewingSubscription = "Non-Renewing Subscription"
}

/**
 * https://developer.apple.com/documentation/appstoreservernotifications/transactionreason
 */
export enum TransactionReason {
  Purchase = "PURCHASE",
  Renewal = "RENEWAL"
}

export interface SubscriptionStatusesQuery {
  status?: SubscriptionStatus[]
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/statusresponse
 */
export interface StatusResponse {
  data: SubscriptionGroupIdentifierItem[]
  environment: Environment
  appAppleId: string
  bundleId: string
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/subscriptiongroupidentifieritem
 */
export interface SubscriptionGroupIdentifierItem {
  subscriptionGroupIdentifier: string
  lastTransactions: LastTransactionsItem[]
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/lasttransactionsitem
 */
export interface LastTransactionsItem {
  originalTransactionId: string
  status: SubscriptionStatus
  signedRenewalInfo: JWSRenewalInfo
  signedTransactionInfo: JWSTransaction
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfo
 */
export type JWSRenewalInfo = string

/**
 * https://developer.apple.com/documentation/appstoreserverapi/status
 */
export enum SubscriptionStatus {
  Active = 1,
  Expired = 2,
  InBillingRetry = 3,
  InBillingGracePeriod = 4,
  Revoked = 5
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload
 */
export interface JWSRenewalInfoDecodedPayload {
  autoRenewProductId: string
  autoRenewStatus: AutoRenewStatus
  environment: Environment
  expirationIntent?: ExpirationIntent
  gracePeriodExpiresDate?: Timestamp
  isInBillingRetryPeriod?: boolean
  offerIdentifier?: string
  offerType?: OfferType
  originalTransactionId: string
  priceIncreaseStatus?: PriceIncreaseStatus
  productId: string
  recentSubscriptionStartDate: Timestamp
  renewalDate: Timestamp
  signedDate: Timestamp
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/autorenewstatus
 */
export enum AutoRenewStatus {
  Off = 0,
  On = 1
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/expirationintent
 */
export enum ExpirationIntent {
  Canceled = 1,
  BillingError = 2,
  RejectedPriceIncrease = 3,
  ProductUnavailable = 4
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/offertype
 */
export enum OfferType {
  Introductory = 1,
  Promotional = 2,
  SubscriptionOfferCode = 3
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/priceincreasestatus
 */
export enum PriceIncreaseStatus {
  NoResponse = 0,
  Consented = 1
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/orderlookupresponse
 */
export interface OrderLookupResponse {
  status: OrderLookupStatus
  signedTransactions: JWSTransaction[]
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/orderlookupstatus
 */
export enum OrderLookupStatus {
  Valid = 0,
  Invalid = 1
}

/**
 * https://developer.apple.com/documentation/appstoreservernotifications/responsebodyv2decodedpayload
 */
interface DecodedNotificationBasePayload {
  notificationType: NotificationType
  subtype?: NotificationSubtype
  notificationUUID: string
  version: string
  signedDate: Timestamp
}

export interface DecodedNotificationDataPayload extends DecodedNotificationBasePayload {
  data: NotificationData
  summary?: never
}

export interface DecodedNotificationSummaryPayload extends DecodedNotificationBasePayload {
  data?: never
  summary: NotificationSummary
}

export type DecodedNotificationPayload = DecodedNotificationDataPayload | DecodedNotificationSummaryPayload

export function isDecodedNotificationDataPayload(
  decodedNotificationPayload: DecodedNotificationPayload
): decodedNotificationPayload is DecodedNotificationDataPayload {
  return "data" in decodedNotificationPayload
}

export function isDecodedNotificationSummaryPayload(
  decodedNotificationPayload: DecodedNotificationPayload
): decodedNotificationPayload is DecodedNotificationSummaryPayload {
  return "summary" in decodedNotificationPayload
}

/**
 * https://developer.apple.com/documentation/appstoreservernotifications/data
 */
export interface NotificationData {
  appAppleId: number
  bundleId: string
  bundleVersion: string
  environment: Environment
  signedRenewalInfo?: JWSRenewalInfo
  signedTransactionInfo: JWSTransaction
  status?: SubscriptionStatus
}

/**
 * https://developer.apple.com/documentation/appstoreservernotifications/summary
 */
export interface NotificationSummary {
  requestIdentifier: string
  environment: Environment
  appAppleId: string
  bundleId: string
  productId: string
  storefrontCountryCodes?: StorefrontCountryCode[]
  failedCount: number
  succeededCount: number
}

/**
 * https://developer.apple.com/documentation/appstoreservernotifications/notificationtype
 */
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
  Subscribed = "SUBSCRIBED",
  RenewalExtension = "RENEWAL_EXTENSION",
  RefundReversed = "REFUND_REVERSED"
}

/**
 * https://developer.apple.com/documentation/appstoreservernotifications/subtype
 */
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
  ProductNotForSale = "PRODUCT_NOT_FOR_SALE",
  GracePeriod = "GRACE_PERIOD",
  BillingRecovery = "BILLING_RECOVERY",
  Pending = "PENDING",
  Accepted = "ACCEPTED",
  Summary = "SUMMARY",
  Failure = "FAILURE"
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/sendtestnotificationresponse
 */
export interface SendTestNotificationResponse {
  testNotificationToken: string
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/checktestnotificationresponse
 */
export interface CheckTestNotificationResponse {
  sendAttempts: SendAttempt[]
  signedPayload: string
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/sendattemptitem
 */
export interface SendAttempt {
  attemptDate: Timestamp
  sendAttemptResult: SendAttemptResult
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/sendattemptresult
 */
export enum SendAttemptResult {
  Success = "SUCCESS",
  TimedOut = "TIMED_OUT",
  TlsIssue = "TLS_ISSUE",
  CircularRedirect = "CIRCULAR_REDIRECT",
  NoResponse = "NO_RESPONSE",
  SocketIssue = "SOCKET_ISSUE",
  UnsupportedCharset = "UNSUPPORTED_CHARSET",
  InvalidResponse = "INVALID_RESPONSE",
  PrematureClose = "PREMATURE_CLOSE",
  Other = "OTHER"
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/get_notification_history
 */
export interface NotificationHistoryQuery {
  paginationToken?: string
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/notificationhistoryrequest
 */
export interface NotificationHistoryRequest {
  startDate: Timestamp
  endDate: Timestamp
  notificationType?: NotificationType
  notificationSubtype?: NotificationSubtype
  onlyFailures?: boolean
  transactionId?: string
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/notificationhistoryresponse
 */
export interface NotificationHistoryResponse {
  notificationHistory: NotificationHistoryResponseItem[]
  hasMore: boolean
  paginationToken: string
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/notificationhistoryresponseitem
 */
export interface NotificationHistoryResponseItem {
  sendAttempts: SendAttempt[]
  signedPayload: string
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/extendreasoncode
 */
export enum ExtendReasonCode {
  UNDECLARED = 0,
  CUSTOMER_SATISFACTION = 1,
  OTHER_REASON = 2,
  SERVICE_ISSUE = 3
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/extendrenewaldaterequest
 */
export interface ExtendRenewalDateRequest {
  extendByDays: number
  extendReasonCode: ExtendReasonCode
  requestIdentifier: string
}

/**
 * https://developer.apple.com/documentation/appstoreserverapi/extendrenewaldateresponse
 */
export interface ExtendRenewalDateResponse {
  effectiveDate: Timestamp
  originalTransactionId: string
  success: boolean
  webOrderLineItemId: string
}
