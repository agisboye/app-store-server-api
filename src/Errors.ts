export class AppStoreError extends Error {
  errorCode: number

  constructor(errorCode: number, errorMessage: string) {
    super(errorMessage)
    this.errorCode = errorCode
  }
}

export class CertificateValidationError extends Error {
  certificates: string[]

  constructor(certificates: string[]) {
    super("Certificate validation failed")
    this.certificates = certificates
  }
}