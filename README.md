# app-store-server-api
A Node.js client for the [App Store Server API](https://developer.apple.com/documentation/appstoreserverapi).

## Features
- History, subscription status and order lookup endpoints
- Typed responses (i.e. you get auto-complete for the fields in the response)
- Manages authentication tokens for you
- Helpers to decode JWS items
- Performs certificate validation against Apple's CA.
- Types and helpers for [App Store Server Notifications V2](https://developer.apple.com/documentation/appstoreservernotifications)

## Requirements
Node.js 15.6.0 or newer

## Installation
```bash
npm install app-store-server-api
```

## Usage
### Prerequisites
To get started, you must obtain the following:
- An [API key](https://developer.apple.com/documentation/appstoreserverapi/creating_api_keys_to_use_with_the_app_store_server_api)
- The ID of the key
- Your [issuer ID](https://developer.apple.com/documentation/appstoreserverapi/generating_tokens_for_api_requests)

A note on the issuer ID:
Apple's documentation currently has incorrect instructions on how to obtain this.
To get your issuer ID, you must [create an API key for App Store Connect](https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api) (not the App Store Server API). Only after creating your first API key will the issuer ID appear.

### Create a client
```javascript
const { AppStoreServerAPI, Environment } = require("app-store-server-api")
// or
import { AppStoreServerAPI, Environment } from "app-store-server-api"

const KEY = 
`-----BEGIN PRIVATE KEY-----
MHcCAQEEIPWH5lyoG7Wbzv71ntF6jNvFwwJLKYmPWN/KBD4qJfMcoAoGCCqGSM49
AwEHoUQDQgAEMOlUa/hmyAPU/RUBds6xzDO8QNrTFhFwzm8E4wxDnSAx8R9WOMnD
cVGdtnbLFIdLk8g4S7oAfV/gGILKuc+Vqw==
-----END PRIVATE KEY-----`

const KEY_ID = "ABCD123456"
const ISSUER_ID = "91fa5999-7b54-4363-a2a8-265363fa6cbe"
const APP_BUNDLE_ID = "com.yourcompany.app"

const api = new AppStoreServerAPI(
  KEY, KEY_ID, ISSUER_ID, APP_BUNDLE_ID, Environment.Production
)
```

### History
```javascript
const response = await api.getTransactionHistory(originalTransactionId)

// Decoding not only reveals the contents of the transactions but also verifies that they were signed by Apple.
const transactions = await api.decodeTransactions(response.signedTransactions)

for (let transaction of transactions) {
  // Do something with your transactions...
}

// The response contains at most 20 entries. You can check to see if there are more.
if (response.hasMore) {
  const nextResponse = await api.getTransactionHistory(originalTransactionId, response.revision)
  // ...
}
```


### Subscription status
```javascript
const response = await api.getSubscriptionStatuses(originalTransactionId)

// Find the transaction you're looking for
const item = response.data[0].lastTransactions.find(item => item.originalTransactionId === originalTransactionId)

const transactionInfo = await api.decodeTransaction(item.signedTransactionInfo)
const renewalInfo = await api.decodeRenewalInfo(item.signedRenewalInfo)
```

### Order lookup
```javascript
// Import the status type
import { OrderLookupStatus } from "app-store-server-api"

const response = await api.lookupOrder(orderId)

if (response.orderLookupStatus === OrderLookupStatus.Valid) {
    const transactions = await api.decodeTransactions(response.signedTransactions)
    /// ...
}
```

### Server notifications
While not exactly part of the App Store Server API, App Store Server Notifications (version 2) is closely related and uses some of the same types and encoding format as the API. For that reason this package includes a function to help you decode notifications (which will also verify their signature).

```javascript
import { decodeNotificationPayload } from "app-store-server-api"

// signedPayload is the body sent by Apple
const payload = await decodeNotificationPayload(signedPayload)

// You might want to check that the bundle ID matches that of your app
if (payload.data.bundleId === APP_BUNDLE_ID) {
  // Handle the notification...
}
```

## Resources
WWDC videos:
- [Manage in-app purchases on your server](https://developer.apple.com/videos/play/wwdc2021/10174/)
- [Meet StoreKit 2](https://developer.apple.com/videos/play/wwdc2021/10114/)
- [Support customers and handle refunds](https://developer.apple.com/videos/play/wwdc2021/10175/)

## License
MIT