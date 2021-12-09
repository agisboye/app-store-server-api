import { X509Certificate } from "crypto"
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
import { APPLE_ROOT_CA_G3_FINGERPRINT } from "./AppleRootCertificate"
import { AppStoreError, CertificateValidationError } from "./Errors"

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
    return Promise.all(signedTransactions.map(this.decodeJWS))
  }

  async decodeTransaction(transaction: JWSTransaction): Promise<JWSTransactionDecodedPayload> {
    return this.decodeJWS(transaction)
  }

  async decodeRenewalInfo(info: JWSRenewalInfo): Promise<JWSRenewalInfoDecodedPayload> {
    return this.decodeJWS(info)
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

  /**
   * Decodes and verifies an object signed by the App Store according to JWS.
   * See: https://developer.apple.com/documentation/appstoreserverapi/jwstransaction
   */
  private async decodeJWS(token: string): Promise<any> {
    // Extracts the key used to sign the JWS from the header of the token
    const getKey: jose.CompactVerifyGetKey = async (protectedHeader, _token) => {
      // RC 7515 stipulates that the key used to sign the JWS must be the first in the chain.
      // https://datatracker.ietf.org/doc/html/rfc7515#section-4.1.6

      // jose will not import the certificate unless it is in a proper PKCS8 format.
      const certs = protectedHeader.x5c?.map(c => `-----BEGIN CERTIFICATE-----\n${c}\n-----END CERTIFICATE-----`) ?? []

      this.validateCertificates(certs)

      return jose.importX509(certs[0], "ES256")
    }

    const { payload } = await jose.compactVerify(token, getKey)

    const decoded = new TextDecoder().decode(payload)
    const json = JSON.parse(decoded)

    return json
  }

  /**
   * Validates a certificate chain provided in the x5c field of a decoded header of a JWS.
   * The certificates must be valid and have come from Apple.
   * @throws {CertificateValidationError} if any of the validation checks fail
   */
  private validateCertificates(certificates: string[]) {
    if (certificates.length === 0) throw new CertificateValidationError([])

    const x509certs = certificates.map(c => new X509Certificate(c))

    // Check dates
    const now = new Date()
    const datesValid = x509certs.every(c => new Date(c.validFrom) < now && now < new Date(c.validTo))
    if (!datesValid) throw new CertificateValidationError(certificates)

    // Check that each certificate, except for the last, is issued by the subsequent one.
    if (certificates.length >= 2) {
      for (let i = 0; i < x509certs.length - 1; i++) {
        if (x509certs[i].checkIssued(x509certs[i + 1]) === false) {
          throw new CertificateValidationError(certificates)
        }
      }
    }

    // Ensure that the last certificate in the chain is the expected Apple root CA.
    if (x509certs[x509certs.length - 1].fingerprint256 !== APPLE_ROOT_CA_G3_FINGERPRINT) {
      throw new CertificateValidationError(certificates)
    }
  }
}
