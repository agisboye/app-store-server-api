import fetch from "node-fetch"
import { v4 as uuidv4 } from "uuid"
import * as jose from "jose"
import {
  Environment,
  HistoryResponse,
  JWSRenewalInfo,
  JWSRenewalInfoDecodedPayload,
  JWSTransaction,
  JWSTransactionDecodedPayload,
  OrderLookupResponse,
  StatusResponse
} from "./Models"

import { AppStoreError } from "./Errors"
import { decodeJWS } from "./Decoding"

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
  async getTransactionHistory(originalTransactionId: string, revision?: string): Promise<HistoryResponse> {
    const query = revision ? `?query=${revision}` : ""
    return this.makeRequest(`${this.baseUrl}/inApps/v1/history/${originalTransactionId}${query}`)
  }

  /**
   * https://developer.apple.com/documentation/appstoreserverapi/get_all_subscription_statuses
   */
  async getSubscriptionStatuses(originalTransactionId: string): Promise<StatusResponse> {
    return this.makeRequest(`${this.baseUrl}/inApps/v1/subscriptions/${originalTransactionId}`)
  }

  /**
   * https://developer.apple.com/documentation/appstoreserverapi/look_up_order_id
   */
  async lookupOrder(orderId: string): Promise<OrderLookupResponse> {
    return this.makeRequest(`${this.baseUrl}/inApps/v1/lookup/${orderId}`)
  }

  // Decoding helpers

  async decodeTransactions(signedTransactions: JWSTransaction[]): Promise<JWSTransactionDecodedPayload[]> {
    return Promise.all(signedTransactions.map(decodeJWS))
  }

  async decodeTransaction(transaction: JWSTransaction): Promise<JWSTransactionDecodedPayload> {
    return decodeJWS(transaction)
  }

  async decodeRenewalInfo(info: JWSRenewalInfo): Promise<JWSRenewalInfoDecodedPayload> {
    return decodeJWS(info)
  }

  /**
   * Performs a network request against the API and handles the result.
   */
  private async makeRequest(url: string): Promise<any> {
    const token = await this.getToken()

    const result = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (result.status === 200) {
      return result.json()
    }

    switch (result.status) {
      case 400:
      case 404:
      case 500:
        const body = (await result.json()) as AppStoreError
        throw body

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
}
