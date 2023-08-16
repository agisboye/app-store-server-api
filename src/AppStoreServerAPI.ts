import fetch from "node-fetch"
import { v4 as uuidv4 } from "uuid"
import * as jose from "jose"
import {
  CheckTestNotificationResponse,
  Environment,
  HistoryResponse,
  NotificationHistoryQuery,
  NotificationHistoryRequest,
  NotificationHistoryResponse,
  OrderLookupResponse,
  SendTestNotificationResponse,
  StatusResponse,
  SubscriptionStatusesQuery,
  TransactionHistoryQuery,
  TransactionInfoResponse,
  ExtendRenewalDateResponse,
  ExtendRenewalDateRequest
} from "./Models"
import { AppStoreError } from "./Errors"

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE"

interface QueryConvertible {
  [key: string]: string | number | boolean | number[]
}

export class AppStoreServerAPI {
  // The maximum age that an authentication token is allowed to have, as decided by Apple.
  static readonly maxTokenAge: number = 3600 // seconds, = 1 hour

  readonly environment: Environment
  private readonly baseUrl: string

  private readonly key: Promise<jose.KeyLike>
  private readonly keyId: string
  private readonly issuerId: string
  private readonly bundleId: string
  private token?: string
  private tokenExpiry: Date = new Date(0)

  /**
   * @param key the key downloaded from App Store Connect in PEM-encoded PKCS8 format.
   * @param keyId the id of the key, retrieved from App Store Connect
   * @param issuerId your issuer ID, retrieved from App Store Connect
   * @param bundleId bundle ID of your app
   */
  constructor(key: string, keyId: string, issuerId: string, bundleId: string, environment = Environment.Production) {
    this.key = jose.importPKCS8(key, "ES256")
    this.keyId = keyId
    this.issuerId = issuerId
    this.bundleId = bundleId
    this.environment = environment

    if (environment === Environment.Sandbox) {
      this.baseUrl = "https://api.storekit-sandbox.itunes.apple.com"
    } else {
      this.baseUrl = "https://api.storekit.itunes.apple.com"
    }
  }

  // API Endpoints

  /**
   * https://developer.apple.com/documentation/appstoreserverapi/get_transaction_history
   */
  async getTransactionHistory(
    transactionId: string,
    query: TransactionHistoryQuery = {}
  ): Promise<HistoryResponse> {
    const path = this.addQuery(`/inApps/v1/history/${transactionId}`, { ...query })
    return this.makeRequest("GET", path)
  }

  /**
   * https://developer.apple.com/documentation/appstoreserverapi/get_transaction_info
   */
  async getTransactionInfo(transactionId: string): Promise<TransactionInfoResponse> {
    return this.makeRequest("GET", `/inApps/v1/transactions/${transactionId}`)
  }

  /**
   * https://developer.apple.com/documentation/appstoreserverapi/get_all_subscription_statuses
   */
  async getSubscriptionStatuses(transactionId: string, query: SubscriptionStatusesQuery = {}): Promise<StatusResponse> {
    const path = this.addQuery(`/inApps/v1/subscriptions/${transactionId}`, { ...query })
    return this.makeRequest("GET", path)
  }

  /**
   * https://developer.apple.com/documentation/appstoreserverapi/look_up_order_id
   */
  async lookupOrder(orderId: string): Promise<OrderLookupResponse> {
    return this.makeRequest("GET", `/inApps/v1/lookup/${orderId}`)
  }

  /**
   * https://developer.apple.com/documentation/appstoreserverapi/request_a_test_notification
   */
  async requestTestNotification(): Promise<SendTestNotificationResponse> {
    return this.makeRequest("POST", "/inApps/v1/notifications/test")
  }

/**
 * https://developer.apple.com/documentation/appstoreserverapi/extend_a_subscription_renewal_date
 */
  async extendSubscriptionRenewalDate(
    transactionId: string,
    request: ExtendRenewalDateRequest): Promise<ExtendRenewalDateResponse> {
    return this.makeRequest('PUT', `/inApps/v1/subscriptions/extend/${transactionId}`, request)
  }
  

  /**
   * https://developer.apple.com/documentation/appstoreserverapi/get_test_notification_status
   */
  async getTestNotificationStatus(id: string): Promise<CheckTestNotificationResponse> {
    return this.makeRequest("GET", `/inApps/v1/notifications/test/${id}`)
  }

  /**
   * https://developer.apple.com/documentation/appstoreserverapi/get_notification_history
   */
  async getNotificationHistory(
    request: NotificationHistoryRequest,
    query: NotificationHistoryQuery = {}
  ): Promise<NotificationHistoryResponse> {
    const path = this.addQuery("/inApps/v1/notifications/history", { ...query })
    return this.makeRequest("POST", path, request)
  }

  /**
   * Performs a network request against the API and handles the result.
   */
  private async makeRequest(method: HTTPMethod, path: string, body?: any): Promise<any> {
    const token = await this.getToken()
    const url = this.baseUrl + path
    const serializedBody = body ? JSON.stringify(body) : undefined

    const result = await fetch(url, {
      method: method,
      body: serializedBody,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })

    if (result.status === 200) {
      return result.json()
    }

    switch (result.status) {
      case 400:
      case 404:
      case 500:
        const body = await result.json()
        throw new AppStoreError(body.errorCode, body.errorMessage)

      case 401:
        this.token = undefined
        throw new Error("The request is unauthorized; the JSON Web Token (JWT) is invalid.")

      default:
        throw new Error("An unknown error occurred")
    }
  }

  /**
   * Returns an existing authentication token (if its still valid) or generates a new one.
   */
  private async getToken(): Promise<string> {
    // Reuse previously created token if it hasn't expired.
    if (this.token && !this.tokenExpired) return this.token

    // Tokens must expire after at most 1 hour.
    const now = new Date()
    const expiry = new Date(now.getTime() + AppStoreServerAPI.maxTokenAge * 1000)
    const expirySeconds = Math.floor(expiry.getTime() / 1000)

    const payload = {
      bid: this.bundleId,
      nonce: uuidv4()
    }

    const privateKey = await this.key

    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "ES256", kid: this.keyId, typ: "JWT" })
      .setIssuer(this.issuerId)
      .setIssuedAt()
      .setExpirationTime(expirySeconds)
      .setAudience("appstoreconnect-v1")
      .sign(privateKey)

    this.token = jwt
    this.tokenExpiry = expiry

    return jwt
  }

  /**
   * Returns whether the previously generated token can still be used.
   */
  private get tokenExpired(): boolean {
    // We consider the token to be expired slightly before it actually is to allow for some networking latency.
    const headroom = 60 // seconds
    const now = new Date()
    const cutoff = new Date(now.getTime() - headroom * 1000)

    return !this.tokenExpiry || this.tokenExpiry < cutoff
  }

  /**
   * Serializes a query object into a query string and appends it
   * the provided path.
   */
  private addQuery(path: string, query: QueryConvertible): string {
    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          params.append(key, item.toString())
        }
      } else {
        params.set(key, value.toString())
      }
    }

    const queryString = params.toString()

    if (queryString === "") {
      return path
    } else {
      return `${path}?${queryString}`
    }
  }
}
