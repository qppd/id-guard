# API Reference

## Overview

The IDGuard app exposes **17 internal API routes** that proxy requests to the [TTLock Cloud API V3](https://open.ttlock.com/documentation) (`api.sciener.com`). All routes require authentication via the `tt_token` httpOnly cookie.

**Base URL:** `http://localhost:3000` (development)

**Authentication:** httpOnly cookie `tt_token` set by `/api/login`.

---

## Auth

### `POST /api/login`

Authenticates with TTLock Cloud API and sets auth cookies.

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "plaintext_password"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Response (401):**
```json
{
  "ok": false,
  "error": "Login failed: Invalid credentials"
}
```

**Cookies set:** `tt_token` (access token), `tt_refresh` (refresh token) — both httpOnly, path `/`.

**Backend:** Calls `POST /oauth2/token` with MD5-hashed password.

---

### `GET /api/auth`

Checks if the user is authenticated.

**Response (200):**
```json
{
  "ok": true
}
```

**Response (200 — not authenticated):**
```json
{
  "ok": false
}
```

---

### `POST /api/auth`

Logs out by clearing `tt_token` and `tt_refresh` cookies.

**Response (200):**
```json
{
  "ok": true
}
```

---

## Locks

### `GET /api/locks`

Lists all locks for the authenticated user.

**Query Parameters:** none (defaults to page 1, size 20)

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "lockId": 12345,
      "lockName": "Front Door",
      "lockAlias": "Main Entrance",
      "lockMac": "AA:BB:CC:DD:EE:FF",
      "lockKey": "...",
      "aesKeyStr": "...",
      "hasGateway": true,
      "electricQuantity": 85,
      "adminPwd": "123456",
      "noKeyPwd": "654321",
      "specialValue": 0,
      "firmwareRevision": "V4.6.2",
      "hardwareRevision": 3,
      "lockVersion": {
        "protocolVersion": 4,
        "protocolType": 5,
        "orgId": 1001,
        "logoUrl": "https://...",
        "groupId": 1
      },
      "timezoneRawOffset": 28800000
    }
  ],
  "total": 1
}
```

**Backend TTLock:** `POST /v3/lock/list`

---

### `POST /api/locks`

Performs a lock or unlock action.

**Request Body:**
```json
{
  "lockId": 12345,
  "action": "unlock"
}
```
`action` must be `"lock"` or `"unlock"`.

**Response (200):**
```json
{
  "ok": true,
  "data": { "errcode": 0, "errmsg": "success" }
}
```

**Response (400):**
```json
{
  "ok": false,
  "error": "Invalid request"
}
```

**Backend TTLock:** `POST /v3/lock/lock` or `POST /v3/lock/unlock`

---

### `GET /api/locks/[id]`

Gets detailed information about a specific lock.

**Route Parameters:** `id` — lock ID (number)

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "lockId": 12345,
    "lockName": "Front Door",
    "lockAlias": "Main Entrance",
    "lockMac": "AA:BB:CC:DD:EE:FF",
    "lockKey": "...",
    "aesKeyStr": "...",
    "hasGateway": true,
    "electricQuantity": 85,
    "adminPwd": "123456",
    "noKeyPwd": "654321",
    "specialValue": 0,
    "firmwareRevision": "V4.6.2",
    "hardwareRevision": 3,
    "timezoneRawOffset": 28800000
  }
}
```

**Response (400):**
```json
{
  "ok": false,
  "error": "Invalid lock ID"
}
```

**Backend TTLock:** `POST /v3/lock/detail`

---

### `POST /api/locks/upgrade`

Checks or starts a firmware upgrade.

**Request Body:**
```json
{
  "action": "check",
  "lockId": 12345
}
```
- `action: "check"` — checks if upgrade is available
- `action: "start"` — starts the upgrade process

**Response (200) — check:**
```json
{
  "ok": true,
  "data": {
    "needUpgrade": 1,
    "firmwareInfo": "V4.7.0"
  }
}
```

**Response (200) — start:**
```json
{
  "ok": true,
  "data": { "errcode": 0 }
}
```

**Backend TTLock:** `POST /v3/lock/checkUpgrade`, `POST /v3/lock/upgrade`

---

### `GET /api/locks/config`

Gets the configuration of a specific lock.

**Query Parameters:** `lockId` (required)

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "lockId": 12345,
    "audioEnable": 1,
    "passcodeVisible": 1,
    "tamperAlert": 0,
    "lockSound": 1
  }
}
```

**Backend TTLock:** `POST /v3/lock/config`

---

### `POST /api/locks/config`

Sets the configuration of a specific lock.

**Request Body:**
```json
{
  "lockId": 12345,
  "audioEnable": "0",
  "passcodeVisible": "1"
}
```
Any key-value pairs after `lockId` are sent as config parameters.

**Response (200):**
```json
{
  "ok": true,
  "data": { "errcode": 0 }
}
```

**Backend TTLock:** `POST /v3/lock/config/set`

---

### `GET /api/locks/door-sensor`

Gets the current door sensor state (open/closed). Polls every 30 seconds on the frontend.

**Query Parameters:** `lockId` (required)

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "lockId": 12345,
    "doorState": 1,
    "timestamp": 1719888000000
  }
}
```
`doorState`: `0` = closed, `1` = opened.

**Backend TTLock:** `POST /v3/lock/doorSensor`

---

## Passcodes

### `GET /api/passcodes`

Lists all passcodes for a specific lock.

**Query Parameters:** `lockId` (required)

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "passcodeId": 1,
      "passcode": "123456",
      "type": 1,
      "startDate": 1719000000000,
      "endDate": 1750512000000
    }
  ]
}
```

`type`: `1` = Permanent, `2` = Timed, `3` = Cyclic

**Backend TTLock:** `POST /v3/passcode/list`

---

### `POST /api/passcodes`

Adds, updates, or deletes a passcode.

**Request Body — add:**
```json
{
  "action": "add",
  "lockId": 12345,
  "passcode": "456789",
  "type": 1,
  "startDate": 1719000000000,
  "endDate": 1750512000000
}
```

**Request Body — update:**
```json
{
  "action": "update",
  "lockId": 12345,
  "passcodeId": 1,
  "passcode": "654321",
  "type": 2,
  "startDate": 1719000000000,
  "endDate": 1750512000000
}
```

**Request Body — delete:**
```json
{
  "action": "delete",
  "lockId": 12345,
  "passcodeId": 1
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": {}
}
```

**Backend TTLock:** `POST /v3/passcode/add`, `/v3/passcode/update`, `/v3/passcode/delete`

---

## IC Cards

### `GET /api/ic-cards`

Lists all IC cards registered on a lock.

**Query Parameters:** `lockId` (required)

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "cardId": 1,
      "cardNumber": "A1B2C3D4",
      "cardName": "Office Card",
      "lockId": 12345,
      "startDate": 1719000000000,
      "endDate": 1750512000000,
      "status": 1,
      "createDate": 1718000000000
    }
  ]
}
```

**Backend TTLock:** `POST /v3/icCard/list`

---

### `POST /api/ic-cards`

Adds or deletes an IC card.

**Request Body — add:**
```json
{
  "action": "add",
  "lockId": 12345,
  "cardNumber": "A1B2C3D4",
  "cardName": "Office Card",
  "startDate": 1719000000000,
  "endDate": 1750512000000
}
```

**Request Body — delete:**
```json
{
  "action": "delete",
  "lockId": 12345,
  "cardId": 1
}
```

**Backend TTLock:** `POST /v3/icCard/add`, `/v3/icCard/delete`

---

## Fingerprints

### `GET /api/fingerprints`

Lists all fingerprints registered on a lock.

**Query Parameters:** `lockId` (required)

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "fingerprintId": 1,
      "fingerprintNumber": "FP001",
      "fingerprintName": "John's thumb",
      "lockId": 12345,
      "startDate": 1719000000000,
      "endDate": 1750512000000,
      "status": 1,
      "createDate": 1718000000000
    }
  ]
}
```

**Backend TTLock:** `POST /v3/fingerprint/list`

---

### `POST /api/fingerprints`

Adds or deletes a fingerprint.

**Request Body — add:**
```json
{
  "action": "add",
  "lockId": 12345,
  "fingerprintNumber": "FP001",
  "fingerprintName": "John's thumb",
  "startDate": 1719000000000,
  "endDate": 1750512000000
}
```

**Request Body — delete:**
```json
{
  "action": "delete",
  "lockId": 12345,
  "fingerprintId": 1
}
```

**Backend TTLock:** `POST /v3/fingerprint/add`, `/v3/fingerprint/delete`

---

## Unlock Records

### `GET /api/records`

Lists unlock records for a specific lock.

**Query Parameters:**

| Parameter | Type | Required | Default |
|---|---|---|---|
| `lockId` | number | ✅ | — |
| `page` | number | ❌ | 1 |

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "recordId": 1001,
      "lockId": 12345,
      "keyId": 501,
      "unlockTime": 1719888000000,
      "unlockType": 2,
      "gatewayId": 99,
      "success": 1
    }
  ],
  "total": 50
}
```

`unlockType` values: 1=Bluetooth, 2=Passcode, 3=IC Card, 4=Fingerprint, 5=Mechanical Key, 6=Gateway, 7=Face, 8=Remote, 9=QR Code, 10=Palm Vein, 11=Door Sensor

**Backend TTLock:** `POST /v3/record/list`

---

## Gateways

### `GET /api/gateways`

Lists all gateways.

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "gatewayId": 99,
      "gatewayName": "Office Gateway",
      "gatewayMac": "11:22:33:44:55:66",
      "gatewayVersion": 2,
      "isOnline": 1,
      "lockNum": 3,
      "rssi": -65
    }
  ]
}
```

**Backend TTLock:** `POST /v3/gateway/list`

---

### `POST /api/gateways/[action]`

Performs gateway-specific actions.

**Route:** `/api/gateways/listByLock`

**Request Body:**
```json
{
  "lockId": 12345
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "gatewayId": 99,
      "gatewayName": "Office Gateway",
      "gatewayMac": "11:22:33:44:55:66",
      "isOnline": 1,
      "lockNum": 1,
      "gatewayVersion": 2
    }
  ]
}
```

**Backend TTLock:** `POST /v3/gateway/listByLock`

---

### `GET /api/gateways/config`

Gets the configuration of a specific gateway.

**Query Parameters:** `gatewayId` (required)

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "gatewayId": 99,
    "gatewayName": "Office Gateway",
    "timezoneRawOffset": 28800000,
    "isOnline": 1,
    "firmwareVersion": "1.2.3"
  }
}
```

**Backend TTLock:** `POST /v3/gateway/config`

---

### `POST /api/gateways/config`

Sets the configuration of a specific gateway.

**Request Body:**
```json
{
  "gatewayId": 99,
  "timezoneRawOffset": "28800000"
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": {}
}
```

**Backend TTLock:** `POST /v3/gateway/config/set`

---

## eKeys

### `GET /api/keys`

Lists all digital keys.

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "keyId": 501,
      "lockId": 12345,
      "lockName": "Front Door",
      "userType": 110301,
      "startDate": 1719000000000,
      "endDate": 1750512000000,
      "remoteEnable": 1,
      "status": 1
    }
  ]
}
```

`userType`: `110301` = Admin, `110302` = User

**Backend TTLock:** `POST /v3/key/list`

---

### `POST /api/keys`

Performs key management actions.

**Request Body — send:**
```json
{
  "action": "send",
  "lockId": 12345,
  "receiverUsername": "user@example.com",
  "keyName": "Shared Key",
  "startDate": 1719000000000,
  "endDate": 1750512000000
}
```

**Request Body — delete:**
```json
{
  "action": "delete",
  "keyId": 501
}
```

**Request Body — update:**
```json
{
  "action": "update",
  "keyId": 501,
  "keyName": "Updated Key",
  "startDate": 1719000000000,
  "endDate": 1750512000000,
  "remoteEnable": 1
}
```

**Request Body — freeze:**
```json
{
  "action": "freeze",
  "keyId": 501
}
```

**Request Body — unfreeze:**
```json
{
  "action": "unfreeze",
  "keyId": 501
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": {}
}
```

**Backend TTLock:** `POST /v3/key/send`, `/v3/key/delete`, `/v3/key/update`, `/v3/key/freeze`, `/v3/key/unfreeze`

---

## Webhook

### `POST /api/webhook`

Receives unlock event callbacks from TTLock.

**Headers:** `x-ttlock-signature` (optional, for verification)

**Request Body:**
```json
{
  "lockId": 12345,
  "recordId": 1001,
  "unlockTime": 1719888000000,
  "unlockType": 2,
  "keyId": 501,
  "success": 1
}
```

**Response (200):**
```json
{
  "errcode": 0,
  "errmsg": "ok"
}
```

**Response (403):**
```json
{
  "errcode": 1,
  "errmsg": "Invalid signature"
}
```

---

## Response Format

All internal routes follow this response convention:

**Success:**
```json
{
  "ok": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "ok": false,
  "error": "Descriptive error message"
}
```
HTTP status codes: `400` (bad request), `401` (not authenticated), `502` (TTLock API error).

**Note:** The webhook endpoint uses TTLock's native response format (`errcode`/`errmsg`) instead of the `ok`/`error` wrapper.

---

## Design System

All UI pages use the IDGuard brand palette:

| Element | Color | Hex |
|---|---|---|
| Navbar | Deep Navy | `#183B6B` |
| Active menu / focus | Royal Blue | `#3B82F6` |
| Hover state | Soft Sky Blue | `#DCEEFF` |
| Page background | Pure White | `#FFFFFF` |
| Alt section / form bg | Warm Cream | `#F8F6F2` |
| Primary / heading text | Charcoal Gray | `#1F2937` |
| Secondary / captions | Slate Gray | `#6B7280` |
| Borders | Light Gray | `#E5E7EB` |
| Success badges | Green | `#22C55E` |
| Warning badges | Amber | `#F59E0B` |
| Error badges | Red | `#EF4444` |

**Typography:** Poppins (headings) · Inter (body) · CSS variables via runtime theme system (see `globals.css`)
