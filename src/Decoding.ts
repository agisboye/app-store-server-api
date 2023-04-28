import { X509Certificate } from "crypto"
import * as jose from "jose"
import { APPLE_ROOT_CA_G3_FINGERPRINT } from "./AppleRootCertificate"
import { CertificateValidationError } from "./Errors"
import {
  DecodedNotificationPayload,
  JWSRenewalInfo,
  JWSRenewalInfoDecodedPayload,
  JWSTransaction,
  JWSTransactionDecodedPayload
} from "./Models"

export async function decodeTransactions(
  signedTransactions: JWSTransaction[],
  rootCertFingerprint?: string
): Promise<JWSTransactionDecodedPayload[]> {
  return Promise.all(signedTransactions.map(transaction => decodeJWS(transaction, rootCertFingerprint)))
}

export async function decodeTransaction(
  transaction: JWSTransaction,
  rootCertFingerprint?: string
): Promise<JWSTransactionDecodedPayload> {
  return decodeJWS(transaction, rootCertFingerprint)
}

export async function decodeRenewalInfo(
  info: JWSRenewalInfo,
  rootCertFingerprint?: string
): Promise<JWSRenewalInfoDecodedPayload> {
  return decodeJWS(info, rootCertFingerprint)
}

export async function decodeNotificationPayload(
  payload: string,
  rootCertFingerprint?: string
): Promise<DecodedNotificationPayload> {
  return decodeJWS(payload, rootCertFingerprint)
}

/**
 * Decodes and verifies an object signed by the App Store according to JWS.
 * See: https://developer.apple.com/documentation/appstoreserverapi/jwstransaction
 * @param token JWS token
 * @param rootCertFingerprint Root certificate to validate against. Defaults to Apple's G3 CA but can be overriden for testing purposes.
 */
async function decodeJWS(token: string, rootCertFingerprint: string = APPLE_ROOT_CA_G3_FINGERPRINT): Promise<any> {
  // Extracts the key used to sign the JWS from the header of the token
  const getKey: jose.CompactVerifyGetKey = async (protectedHeader, _token) => {
    // RC 7515 stipulates that the key used to sign the JWS must be the first in the chain.
    // https://datatracker.ietf.org/doc/html/rfc7515#section-4.1.6

    // jose will not import the certificate unless it is in a proper PKCS8 format.
    const certs = protectedHeader.x5c?.map(c => `-----BEGIN CERTIFICATE-----\n${c}\n-----END CERTIFICATE-----`) ?? []

    validateCertificates(certs, rootCertFingerprint)

    return jose.importX509(certs[0], "ES256")
  }

  const { payload } = await jose.compactVerify(token, getKey)

  const decoded = new TextDecoder().decode(payload)
  const json = JSON.parse(decoded)

  return json
}

/**
 * Validates a certificate chain provided in the x5c field of a decoded header of a JWS.
 * The certificates must be valid and have been signed by the provided
 * @param certificates A chain of certificates
 * @param rootCertFingerprint Expected SHA256 signature of the root certificate
 * @throws {CertificateValidationError} if any of the validation checks fail
 */
function validateCertificates(certificates: string[], rootCertFingerprint: string) {
  if (certificates.length === 0) throw new CertificateValidationError([])

  const x509certs = certificates.map(c => new X509Certificate(c))

  // Check dates
  const now = new Date()
  const datesValid = x509certs.every(c => new Date(c.validFrom) < now && now < new Date(c.validTo))
  if (!datesValid) throw new CertificateValidationError(certificates)

  // Check that each certificate, except for the last, is issued by the subsequent one.
  if (certificates.length >= 2) {
    for (let i = 0; i < x509certs.length - 1; i++) {
      const subject = x509certs[i]
      const issuer = x509certs[i + 1]

      if (subject.checkIssued(issuer) === false || subject.verify(issuer.publicKey) === false) {
        throw new CertificateValidationError(certificates)
      }
    }
  }

  // Ensure that the last certificate in the chain is the expected root CA.
  if (x509certs[x509certs.length - 1].fingerprint256 !== rootCertFingerprint) {
    throw new CertificateValidationError(certificates)
  }
}
