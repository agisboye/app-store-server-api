import { decodeJWS } from "./Decoding"
import { DecodedNotificationPayload } from "./Models"

export async function decodeNotificationPayload(payload: string): Promise<DecodedNotificationPayload> {
  return decodeJWS(payload)
}
