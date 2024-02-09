/**
 * See https://developer.apple.com/documentation/appstoreserverapi/error_codes
 * for a list of all errors.
 */
export class AppStoreError extends Error {
  // The following errors indicate that the request can be tried again.
  static readonly RETRYABLE_ERRORS = [
    4040002, // AccountNotFoundRetryableError
    4040004, // AppNotFoundRetryableError
    5000001, // GeneralInternalRetryableError
    4040006 // OriginalTransactionIdNotFoundRetryableError
  ]

  errorCode: number
  isRetryable: boolean

  // https://developer.apple.com/documentation/appstoreserverapi/ratelimitexceedederror
  isRateLimitExceeded: boolean

  constructor(errorCode: number, errorMessage: string) {
    super(errorMessage)
    this.errorCode = errorCode
    this.isRetryable = AppStoreError.RETRYABLE_ERRORS.includes(errorCode)
    this.isRateLimitExceeded = errorCode === 4290000
  }
}

export class CertificateValidationError extends Error {
  certificates: string[]

  constructor(certificates: string[]) {
    super("Certificate validation failed")
    this.certificates = certificates
  }
}
