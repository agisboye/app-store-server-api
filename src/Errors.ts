export interface AppStoreError extends Error {
  errorCode: number
  errorMessage: string
}

export class CertificateValidationError extends Error {
  certificates: string[]

  constructor(certificates: string[]) {
    super("Certificate validation failed")
    this.certificates = certificates
  }
}