# app-store-server-api
A Node.js client for the [App Store Server API](https://developer.apple.com/documentation/appstoreserverapi).

## Features
- Transaction history, subscription status and order lookup endpoints
- Notification test and history endpoints
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
const { AppStoreServerAPI, Environment, decodeRenewalInfo, decodeTransaction, decodeTransactions } = require("app-store-server-api")
// or
import { AppStoreServerAPI, Environment, decodeRenewalInfo, decodeTransaction, decodeTransactions } from "app-store-server-api"

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
const transactions = await decodeTransactions(response.signedTransactions)

for (let transaction of transactions) {
  // Do something with your transactions...
}

// The response contains at most 20 entries. You can check to see if there are more.
if (response.hasMore) {
  const nextResponse = await api.getTransactionHistory(originalTransactionId, { revision: response.revision })
  // ...
}
```

The library supports the filter and sort options introduced at WWDC 2022.
See [Get Transaction History](https://developer.apple.com/documentation/appstoreserverapi/get_transaction_history) for a list of available options.
```javascript
// Import parameter types
import { ProductTypeParameter, SortParameter } from "app-store-server-api"

const response = await api.getTransactionHistory(originalTransactionId, {
  productType: ProductTypeParameter.AutoRenewable,
  sort: SortParameter.Descending,
})
```


### Subscription status
```javascript
const response = await api.getSubscriptionStatuses(originalTransactionId)

// Find the transaction you're looking for
const item = response.data[0].lastTransactions.find(item => item.originalTransactionId === originalTransactionId)

const transactionInfo = await decodeTransaction(item.signedTransactionInfo)
const renewalInfo = await decodeRenewalInfo(item.signedRenewalInfo)
```

### Order lookup
```javascript
// Import the status type
import { OrderLookupStatus } from "app-store-server-api"

const response = await api.lookupOrder(orderId)

if (response.status === OrderLookupStatus.Valid) {
    const transactions = await decodeTransactions(response.signedTransactions)
    /// ...
}
```

### Request test notification
```javascript
const response = await api.requestTestNotification()
// response.testNotificationToken identifies the notification that will be sent.
```

### Get test notification status
```javascript
const response = await api.getTestNotificationStatus("ae0e2185-a3c6-47e4-b41a-6ef4bc86314e_1656062546521")
```

### Notification history
```javascript
// Start and end date are required. 
// The earliest supported start date is June 6th (the start of WWDC 2022).
const response = await api.getNotificationHistory({
  startDate: 1654466400000, // June 6th 2022
  endDate: new Date().getTime()
})

// Check if there are more items.
if (response.hasMore) {
  // Use history.paginationToken to fetch additional items.
}
```

### Decoding server notifications
The App Store Server API and App Store Server Notifications (version 2) are closely related and use some of the same types and encoding formats. This library includes a function to help you decode notifications (which will also verify their signature).

```javascript
import { decodeNotificationPayload, isDecodedNotificationDataPayload, isDecodedNotificationSummaryPayload } from "app-store-server-api"

// signedPayload is the body sent by Apple
const payload = await decodeNotificationPayload(signedPayload)

// You might want to check that the bundle ID matches that of your app
if (payload.data.bundleId === APP_BUNDLE_ID) {
  // Handle the notification...
}

// Notifications can contain either a data field or a summary field but never both.
// Use the provided type guards to determine which is present.
if (isDecodedNotificationDataPayload(payload)) {
  // payload is of type DecodedNotificationDataPayload
}

if (isdecodedNotificationSummaryPayload(payload)) {
  // payload is of type DecodedNotificationSummaryPayload
}
```

### Verifying transactions signed by Xcode
When using [StoreKit testing in Xcode](https://developer.apple.com/documentation/xcode/setting-up-storekit-testing-in-xcode), transactions will be signed by a local certificate authority (CA) instead of Apple's.
To verify these you must [export the root certificate generated by Xcode](https://developer.apple.com/documentation/xcode/setting-up-storekit-testing-in-xcode#Prepare-to-validate-receipts-in-the-test-environment) and obtains its SHA256 fingerprint.
This can be passed in to the various decoding functions:
```javascript
import { decodeTransactions, APPLE_ROOT_CA_G3_FINGERPRINT } from "app-store-server-api"

const LOCAL_ROOT_FINGERPRINT = "AA:BB:CC:DD:..."
const fingerprint = (process.env.NODE_ENV === "production") ? APPLE_ROOT_CA_G3_FINGERPRINT : LOCAL_ROOT_FINGERPRINT
const transactions = await decodeTransactions(response.signedTransactions, fingerprint)
```

## Resources
- [App Store Server API changelog](https://developer.apple.com/documentation/appstoreserverapi/app_store_server_api_changelog)
- [App Store Server Notifications changelog](https://developer.apple.com/documentation/appstoreservernotifications/app_store_server_notifications_changelog/)
- [Apple App Store Server Node.js Library](https://github.com/apple/app-store-server-library-node)

WWDC videos:
- [Manage in-app purchases on your server](https://developer.apple.com/videos/play/wwdc2021/10174/)
- [Meet StoreKit 2](https://developer.apple.com/videos/play/wwdc2021/10114/)
- [Support customers and handle refunds](https://developer.apple.com/videos/play/wwdc2021/10175/)
- [What's new with in-app purchase](https://developer.apple.com/videos/play/wwdc2022/10007/)
- [What's new in App Store server APIs](https://developer.apple.com/videos/play/wwdc2023/10141/)

## License
MIT
