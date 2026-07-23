# TTLock WebApp — Full API V3 Implementation Plan

## Phase 1: Fix ttlock.ts (lib functions + path corrections)

### 1a. Fix wrong API paths
| Current (WRONG) | Correct (from docs) |
|---|---|
| `/v3/passcode/list` | `/v3/lock/listKeyboardPwd` |
| `/v3/passcode/add` | `/v3/keyboardPwd/add` |
| `/v3/passcode/delete` | `/v3/keyboardPwd/delete` |
| `/v3/passcode/update` | `/v3/keyboardPwd/change` |
| `/v3/record/list` | `/v3/lockRecord/list` |
| `/v3/lock/checkUpgrade` | `/v3/lock/upgradeCheck` |
| `/v3/lock/config` | `/v3/lock/querySetting` |
| `/v3/lock/config/set` | `/v3/lock/updateSetting` |
| `/v3/lock/doorSensor` | `/v3/lock/queryOpenState` |
| `/v3/gateway/config` | `/v3/gateway/detail` |

### 1b. Add apiGet function (for GET endpoints)

### 1c. Add 40+ new lib functions:
**Lock Management:**
- renameLock(accessToken, lockId, lockAlias)
- deleteLock(accessToken, lockId)
- transferLock(accessToken, receiverUsername, lockIdList)
- changeAdminPasscode(accessToken, lockId, password, changeType?)
- adjustLockTime(accessToken, lockId)
- getLockTime(accessToken, lockId)
- setAutoLockTime(accessToken, lockId, seconds, type)
- getLockBattery(accessToken, lockId)
- getLockOpenState(accessToken, lockId)

**Working Mode:**
- getWorkingMode(accessToken, lockId)
- configureWorkingMode(accessToken, lockId, workingMode, type, cyclicConfig?)

**Passage Mode:**
- getPassageMode(accessToken, lockId)
- configurePassageMode(accessToken, lockId, passageMode, type, cyclicConfig?, autoUnlock?)

**Passcode:**
- getPasscode(accessToken, lockId, passcodeId)

**Records:**
- clearRecords(accessToken, lockId)
- deleteRecords(accessToken, lockId, recordIdList)
- uploadRecords(accessToken, lockId, records)

**eKey:**
- listKeysByLock(accessToken, lockId, page?, size?)
- getOneKey(accessToken, lockId)
- changeKeyPeriod(accessToken, keyId, startDate, endDate)
- authorizeKey(accessToken, lockId, keyId)
- unauthorizeKey(accessToken, lockId, keyId)
- getKeyUnlockLink(accessToken, keyId)

**Gateway:**
- getGatewayDetail(accessToken, gatewayId)
- renameGateway(accessToken, gatewayId, gatewayName)
- deleteGateway(accessToken, gatewayId)
- transferGateway(accessToken, receiverUsername, gatewayIdList)
- listLocksByGateway(accessToken, gatewayId)
- listDevicesByGateway(accessToken, gatewayId)
- checkGatewayUpgrade(accessToken, gatewayId)
- setGatewayUpgradeMode(accessToken, gatewayId)

**Firmware:**
- upgradeRecheck(accessToken, lockId, lockData)

**Door Sensor:**
- configureDoorSensorAlert(accessToken, doorSensorId, config)

**User:**
- listUsers(page?, size?, startDate?, endDate?)
- deleteUser(username)

**Battery:**
- uploadLockBattery(accessToken, lockId, electricQuantity)

## Phase 2: Add new API routes

| Route | Methods | Actions |
|---|---|---|
| `/api/locks/rename` | POST | rename lock |
| `/api/locks/delete` | POST | delete lock |
| `/api/locks/transfer` | POST | transfer lock |
| `/api/locks/battery` | GET | get battery |
| `/api/locks/open-state` | GET | get open state |
| `/api/locks/time` | GET | get lock time |
| `/api/locks/adjust-time` | POST | adjust lock time |
| `/api/locks/auto-lock` | POST | set auto lock time |
| `/api/locks/admin-passcode` | POST | change admin passcode |
| `/api/locks/working-mode` | GET, POST | get/set working mode |
| `/api/locks/passage-mode` | GET, POST | get/set passage mode |
| `/api/locks/upgrade-recheck` | POST | upgrade recheck |
| `/api/locks/passcode` | GET | get single passcode |
| `/api/records/clear` | POST | clear all records |
| `/api/records/delete` | POST | delete specific records |
| `/api/keys/list-by-lock` | GET | list ekeys of a lock |
| `/api/keys/[id]` | GET | get one ekey |
| `/api/keys/period` | POST | change key valid period |
| `/api/keys/authorize` | POST | authorize key |
| `/api/keys/unauthorize` | POST | cancel key authorization |
| `/api/keys/unlock-link` | POST | get unlock link |
| `/api/gateways/[id]` | GET | gateway detail |
| `/api/gateways/rename` | POST | rename gateway |
| `/api/gateways/delete` | POST | delete gateway |
| `/api/gateways/transfer` | POST | transfer gateway |
| `/api/gateways/locks` | GET | list locks by gateway |
| `/api/gateways/devices` | GET | list devices by gateway |
| `/api/gateways/upgrade-check` | GET | gateway upgrade check |
| `/api/gateways/upgrade-mode` | POST | set upgrade mode |
| `/api/users` | GET | list users |
| `/api/users/delete` | POST | delete user |

## Phase 3: Update UI

### Lock Detail Page (`/locks/[id]`)
- Add "Rename" button → modal/form for lockAlias
- Add "Delete Lock" button (with confirm)
- Add "Transfer Lock" button → form for receiverUsername
- Add "Change Admin Passcode" section
- Add "Auto Lock Time" setting
- Add "Working Mode" section (get + configure)
- Add "Passage Mode" section (get + configure)
- Add "Lock Time" display + "Adjust" button
- Add "Clear Records" button in records section
- Add "Battery" refresh button
- Add "Open State" display

### Gateways Page
- Add detail view (expandable or click to view)
- Add rename button
- Add delete button
- Add "List Locks" action
- Add "List Devices" action
- Add "Upgrade Check" button
- Add "Set Upgrade Mode" button
- Add "Transfer" button

### Keys Page
- Add "Change Period" action (change valid time)
- Add "Authorize" / "Unauthorize" actions
- Add "Get Unlock Link" button
- Add "List by Lock" filter (enter lockId to see keys for that lock)

### Dashboard
- Add "Refresh Battery" action per lock

## Phase 4: Build & Fix

## Phase 5: Test via TUI (using test account)
- Login with maryjuacalla@slsu.edu.ph / slsu2023
- Test every API endpoint
- Verify all UI features work
