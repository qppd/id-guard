// TTLock API client — server-side only (env secrets)
import { createHash } from "node:crypto";

const BASE = "https://euapi.ttlock.com";

function getClientId() {
  const id = process.env.TTLOCK_CLIENT_ID;
  if (!id) throw new Error("TTLOCK_CLIENT_ID not configured");
  return id;
}

function getClientSecret() {
  const secret = process.env.TTLOCK_CLIENT_SECRET;
  if (!secret) throw new Error("TTLOCK_CLIENT_SECRET not configured");
  return secret;
}

export async function login(
  username: string,
  password: string
): Promise<{ access_token: string; refresh_token: string; uid: number }> {
  const md5 = md5hash(password);

  const res = await fetch(`${BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      clientId: getClientId(),
      clientSecret: getClientSecret(),
      username,
      password: md5,
    }),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error(data.errmsg || "Login failed");
  return data;
}

export async function refreshToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string }> {
  const res = await fetch(`${BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      clientId: getClientId(),
      clientSecret: getClientSecret(),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error(data.errmsg || "Token refresh failed");
  return data;
}

// MD5 via Node crypto
function md5hash(str: string): string {
  return createHash("md5").update(str).digest("hex");
}

function makeDate(): string {
  return Date.now().toString();
}

// POST helper — most TTLock endpoints use POST
async function apiPost<T>(
  path: string,
  params: { [key: string]: string },
  accessToken: string
): Promise<T> {
  const body: { [key: string]: string } = {
    clientId: getClientId(),
    accessToken,
    date: makeDate(),
    ...params,
  };

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(`TTLock token error (HTTP ${res.status}): token expired or invalid`);
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`TTLock API returned non-JSON response from ${path}: ${text.slice(0, 100)}`);
  }
  if (data.errcode && data.errcode !== 0) {
    throw new Error(`TTLock API error ${data.errcode}: ${data.errmsg || "Unknown"}`);
  }
  return data;
}

// ===== Auth =====

// User registration (creates a TTLock account programmatically)
export async function registerUser(
  username: string,
  password: string
): Promise<{ username: string }> {
  const md5 = md5hash(password);
  const res = await fetch(`${BASE}/v3/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      clientId: getClientId(),
      clientSecret: getClientSecret(),
      username,
      password: md5,
      date: makeDate(),
    }),
  });

  const data = await res.json();
  if (!data.username) throw new Error(data.errmsg || "User registration failed");
  return { username: data.username };
}

// Reset password — only works for accounts registered via /v3/user/register
export async function resetPassword(
  username: string,
  newPassword: string
): Promise<void> {
  const md5 = md5hash(newPassword);
  const res = await fetch(`${BASE}/v3/user/resetPassword`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      clientId: getClientId(),
      clientSecret: getClientSecret(),
      username,
      password: md5,
      date: makeDate(),
    }),
  });

  const data = await res.json();
  if (data.errcode !== 0) {
    throw new Error(data.errmsg || "Password reset failed");
  }
}

// ===== Lock Endpoints =====

export async function listLocks(accessToken: string, page = 1, size = 20) {
  return apiPost<{ list: { [key: string]: unknown }[]; total: number; pages?: number; pageNo?: number; pageSize?: number }>(
    "/v3/lock/list",
    { pageNo: String(page), pageSize: String(size) },
    accessToken
  );
}

export async function lockDetail(accessToken: string, lockId: number) {
  return apiPost<{ [key: string]: unknown }>(
    "/v3/lock/detail",
    { lockId: String(lockId) },
    accessToken
  );
}

export async function lockAction(accessToken: string, lockId: number, action: "lock" | "unlock") {
  return apiPost<{ errcode: number; errmsg: string }>(
    `/v3/lock/${action}`,
    { lockId: String(lockId) },
    accessToken
  );
}

// Rename lock
export async function renameLock(accessToken: string, lockId: number, lockAlias: string) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/lock/rename",
    { lockId: String(lockId), lockAlias },
    accessToken
  );
}

// Delete lock
export async function deleteLock(accessToken: string, lockId: number) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/lock/delete",
    { lockId: String(lockId) },
    accessToken
  );
}

// Transfer lock
export async function transferLock(accessToken: string, receiverUsername: string, lockIdList: string) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/lock/transfer",
    { receiverUsername, lockIdList },
    accessToken
  );
}

// Initialize lock (requires lockData from APP SDK)
export async function initLock(accessToken: string, lockData: string, lockAlias?: string) {
  const params: { [key: string]: string } = { lockData };
  if (lockAlias) params.lockAlias = lockAlias;
  return apiPost<{ lockId: number }>(
    "/v3/lock/initialize",
    params,
    accessToken
  );
}

// Update lock data (reset ekey/reset passcode)
export async function updateLockData(accessToken: string, lockId: number, lockData: string) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/lock/updateLockData",
    { lockId: String(lockId), lockData },
    accessToken
  );
}

// Get lock battery
export async function getLockBattery(accessToken: string, lockId: number) {
  return apiPost<{ electricQuantity: number }>(
    "/v3/lock/queryElectricQuantity",
    { lockId: String(lockId) },
    accessToken
  );
}

// Upload lock battery
export async function uploadLockBattery(accessToken: string, lockId: number, electricQuantity: number) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/lock/updateElectricQuantity",
    { lockId: String(lockId), electricQuantity: String(electricQuantity) },
    accessToken
  );
}

// Get open state of a lock
export async function getLockOpenState(accessToken: string, lockId: number) {
  return apiPost<{ state: number }>(
    "/v3/lock/queryOpenState",
    { lockId: String(lockId) },
    accessToken
  );
}

// Get lock time
export async function getLockTime(accessToken: string, lockId: number) {
  return apiPost<{ date: number }>(
    "/v3/lock/queryDate",
    { lockId: String(lockId) },
    accessToken
  );
}

// Adjust lock time
export async function adjustLockTime(accessToken: string, lockId: number) {
  return apiPost<{ date: number }>(
    "/v3/lock/updateDate",
    { lockId: String(lockId) },
    accessToken
  );
}

// Set auto lock time
export async function setAutoLockTime(accessToken: string, lockId: number, seconds: number, type = 2) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/lock/setAutoLockTime",
    { lockId: String(lockId), seconds: String(seconds), type: String(type) },
    accessToken
  );
}

// Change admin/super passcode
export async function changeAdminPasscode(accessToken: string, lockId: number, password: string, changeType = 2) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/lock/changeAdminKeyboardPwd",
    { lockId: String(lockId), password, changeType: String(changeType) },
    accessToken
  );
}

// ===== Lock Config (Query/Update Settings) =====

export async function getLockConfig(accessToken: string, lockId: number) {
  return apiPost<{ [key: string]: unknown }>(
    "/v3/lock/querySetting",
    { lockId: String(lockId) },
    accessToken
  );
}

export async function setLockConfig(accessToken: string, lockId: number, config: { [key: string]: string }) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/lock/updateSetting",
    { lockId: String(lockId), ...config },
    accessToken
  );
}

// ===== Door Sensor =====

export async function getDoorSensorState(accessToken: string, lockId: number) {
  return apiPost<{ state: number; electricQuantity?: number }>(
    "/v3/lock/queryOpenState",
    { lockId: String(lockId) },
    accessToken
  );
}

// Configure door sensor alert
export async function configureDoorSensorAlert(
  accessToken: string,
  doorSensorId: number,
  config: {
    notCloseAlertFlag: number;
    notCloseAlertSecondNum?: number;
    longTimeNotOpenAlertFlag: number;
    longTimeNotOpenDayNum?: number;
  }
) {
  const params: { [key: string]: string } = {
    doorSensorId: String(doorSensorId),
    notCloseAlertFlag: String(config.notCloseAlertFlag),
    longTimeNotOpenAlertFlag: String(config.longTimeNotOpenAlertFlag),
  };
  if (config.notCloseAlertSecondNum != null) params.notCloseAlertSecondNum = String(config.notCloseAlertSecondNum);
  if (config.longTimeNotOpenDayNum != null) params.longTimeNotOpenDayNum = String(config.longTimeNotOpenDayNum);
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/standaloneDoorSensor/configAlertFlag",
    params,
    accessToken
  );
}

// ===== Working Mode =====

export async function getWorkingMode(accessToken: string, lockId: number) {
  return apiPost<{ workingMode: number; cyclicConfig?: string }>(
    "/v3/lock/getWorkingMode",
    { lockId: String(lockId) },
    accessToken
  );
}

export async function configureWorkingMode(
  accessToken: string,
  lockId: number,
  workingMode: number,
  type: number,
  cyclicConfig?: string
) {
  const params: { [key: string]: string } = {
    lockId: String(lockId),
    workingMode: String(workingMode),
    type: String(type),
  };
  if (cyclicConfig) params.cyclicConfig = cyclicConfig;
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/lock/configWorkingMode",
    params,
    accessToken
  );
}

// ===== Passage Mode =====

export async function getPassageMode(accessToken: string, lockId: number) {
  return apiPost<{ passageMode: number; cyclicConfig?: string; autoUnlock?: number }>(
    "/v3/lock/getPassageModeConfiguration",
    { lockId: String(lockId) },
    accessToken
  );
}

export async function configurePassageMode(
  accessToken: string,
  lockId: number,
  passageMode: number,
  type: number,
  cyclicConfig?: string,
  autoUnlock?: number
) {
  const params: { [key: string]: string } = {
    lockId: String(lockId),
    passageMode: String(passageMode),
    type: String(type),
  };
  if (cyclicConfig) params.cyclicConfig = cyclicConfig;
  if (autoUnlock != null) params.autoUnlock = String(autoUnlock);
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/lock/configurePassageMode",
    params,
    accessToken
  );
}

// ===== Passcode Endpoints =====

export async function listPasscodes(accessToken: string, lockId: number, page = 1, size = 50) {
  return apiPost<{ list: { [key: string]: unknown }[]; pageNo: number; pageSize: number; total: number; pages: number }>(
    "/v3/lock/listKeyboardPwd",
    { lockId: String(lockId), pageNo: String(page), pageSize: String(size) },
    accessToken
  );
}

export async function getPasscode(accessToken: string, lockId: number, passcodeId: number) {
  return apiPost<{ [key: string]: unknown }>(
    "/v3/keyboardPwd/get",
    { lockId: String(lockId), passcodeId: String(passcodeId) },
    accessToken
  );
}

export async function addPasscode(
  accessToken: string,
  lockId: number,
  passcode: string,
  type: number,
  startDate?: number,
  endDate?: number
) {
  const params: { [key: string]: string } = {
    lockId: String(lockId),
    keyboardPwd: passcode,
    keyboardPwdType: String(type),
    addType: "2",
  };
  if (startDate) params.startDate = String(startDate);
  if (endDate) params.endDate = String(endDate);
  return apiPost<{ [key: string]: unknown }>(
    "/v3/keyboardPwd/add",
    params,
    accessToken
  );
}

export async function deletePasscode(accessToken: string, lockId: number, passcodeId: number, deleteType = 2) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/keyboardPwd/delete",
    { lockId: String(lockId), passcodeId: String(passcodeId), deleteType: String(deleteType) },
    accessToken
  );
}

export async function updatePasscode(
  accessToken: string,
  lockId: number,
  passcodeId: number,
  passcode: string,
  type: number,
  startDate?: number,
  endDate?: number
) {
  const params: { [key: string]: string } = {
    lockId: String(lockId),
    passcodeId: String(passcodeId),
    keyboardPwd: passcode,
    keyboardPwdType: String(type),
    changeType: "2",
  };
  if (startDate) params.startDate = String(startDate);
  if (endDate) params.endDate = String(endDate);
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/keyboardPwd/change",
    params,
    accessToken
  );
}

// ===== Unlock Records =====

export async function listRecords(
  accessToken: string,
  lockId: number,
  page = 1,
  size = 50,
  startDate?: number,
  endDate?: number
) {
  const params: { [key: string]: string } = {
    lockId: String(lockId),
    pageNo: String(page),
    pageSize: String(size),
  };
  if (startDate) params.startDate = String(startDate);
  if (endDate) params.endDate = String(endDate);
  return apiPost<{ list: { [key: string]: unknown }[]; pageNo: number; pageSize: number; total: number; pages: number }>(
    "/v3/lockRecord/list",
    params,
    accessToken
  );
}

// Clear all records
export async function clearRecords(accessToken: string, lockId: number) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/lockRecord/clear",
    { lockId: String(lockId) },
    accessToken
  );
}

// Delete specific records
export async function deleteRecords(accessToken: string, lockId: number, recordIdList: string) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/lockRecord/delete",
    { lockId: String(lockId), recordIdList },
    accessToken
  );
}

// Upload records
export async function uploadRecords(accessToken: string, lockId: number, records: string) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/lockRecord/upload",
    { lockId: String(lockId), records },
    accessToken
  );
}

// ===== IC Card Endpoints =====

export async function listICCards(accessToken: string, lockId: number, page = 1, size = 50) {
  const params: { [key: string]: string } = {
    lockId: String(lockId),
    pageNo: String(page),
    pageSize: String(size),
  };
  return apiPost<{ list: { [key: string]: unknown }[] }>(
    "/v3/icCard/list",
    params,
    accessToken
  );
}

export async function addICCard(
  accessToken: string,
  lockId: number,
  cardNumber: string,
  cardName: string,
  startDate?: number,
  endDate?: number
) {
  const params: { [key: string]: string } = {
    lockId: String(lockId),
    cardNumber,
    cardName,
    addType: "2",
  };
  if (startDate) params.startDate = String(startDate);
  if (endDate) params.endDate = String(endDate);
  return apiPost<{ [key: string]: unknown }>(
    "/v3/icCard/add",
    params,
    accessToken
  );
}

export async function deleteICCard(accessToken: string, lockId: number, cardId: number, deleteType = 2) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/icCard/delete",
    { lockId: String(lockId), cardId: String(cardId), deleteType: String(deleteType) },
    accessToken
  );
}

// ===== Fingerprint Endpoints =====

export async function listFingerprints(accessToken: string, lockId: number, page = 1, size = 50) {
  const params: { [key: string]: string } = {
    lockId: String(lockId),
    pageNo: String(page),
    pageSize: String(size),
  };
  return apiPost<{ list: { [key: string]: unknown }[] }>(
    "/v3/fingerprint/list",
    params,
    accessToken
  );
}

export async function addFingerprint(
  accessToken: string,
  lockId: number,
  fingerprintNumber: string,
  fingerprintName: string,
  startDate?: number,
  endDate?: number
) {
  const params: { [key: string]: string } = {
    lockId: String(lockId),
    fingerprintNumber,
    fingerprintName,
    addType: "2",
  };
  if (startDate) params.startDate = String(startDate);
  if (endDate) params.endDate = String(endDate);
  return apiPost<{ [key: string]: unknown }>(
    "/v3/fingerprint/add",
    params,
    accessToken
  );
}

export async function deleteFingerprint(accessToken: string, lockId: number, fingerprintId: number, deleteType = 2) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/fingerprint/delete",
    { lockId: String(lockId), fingerprintId: String(fingerprintId), deleteType: String(deleteType) },
    accessToken
  );
}

// ===== Firmware Upgrade =====

export async function checkUpgrade(accessToken: string, lockId: number) {
  return apiPost<{ needUpgrade: number; firmwareInfo?: string; version?: string }>(
    "/v3/lock/upgradeCheck",
    { lockId: String(lockId) },
    accessToken
  );
}

export async function upgradeFirmware(accessToken: string, lockId: number, firmwareInfo: string) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/lock/upgrade",
    { lockId: String(lockId), firmwareInfo },
    accessToken
  );
}

// Upgrade recheck (requires lockData from APP SDK)
export async function upgradeRecheck(accessToken: string, lockId: number, lockData: string) {
  return apiPost<{ needUpgrade: number; firmwareInfo?: string; firmwarePackage?: string; version?: string }>(
    "/v3/lock/upgradeRecheck",
    { lockId: String(lockId), lockData },
    accessToken
  );
}

// ===== eKey Endpoints =====

export async function listKeys(accessToken: string, page = 1, size = 100) {
  return apiPost<{ list: { [key: string]: unknown }[]; total: number; pages?: number }>(
    "/v3/key/list",
    { pageNo: String(page), pageSize: String(size) },
    accessToken
  );
}

// List eKeys of a specific lock
export async function listKeysByLock(accessToken: string, lockId: number, page = 1, size = 100) {
  return apiPost<{ list: { [key: string]: unknown }[]; total: number; pages?: number }>(
    "/v3/lock/listKey",
    { lockId: String(lockId), pageNo: String(page), pageSize: String(size) },
    accessToken
  );
}

// Get one eKey
export async function getOneKey(accessToken: string, lockId: number) {
  return apiPost<{ keyId: number; lockData: string; lockId: number; userType: string; keyStatus: string; lockName: string; lockAlias: string; lockMac: string }>(
    "/v3/key/get",
    { lockId: String(lockId) },
    accessToken
  );
}

export async function sendKey(
  accessToken: string,
  lockId: number,
  receiverUsername: string,
  keyName: string,
  startDate: number,
  endDate: number
) {
  return apiPost<{ keyId: number }>(
    "/v3/key/send",
    {
      lockId: String(lockId),
      receiverUsername,
      keyName,
      startDate: String(startDate),
      endDate: String(endDate),
      remoteEnable: "1",
    },
    accessToken
  );
}

export async function deleteKey(accessToken: string, keyId: number) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/key/delete",
    { keyId: String(keyId) },
    accessToken
  );
}

export async function updateKey(
  accessToken: string,
  keyId: number,
  keyName: string,
  startDate: number,
  endDate: number,
  remoteEnable = 1
) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/key/update",
    {
      keyId: String(keyId),
      keyName,
      startDate: String(startDate),
      endDate: String(endDate),
      remoteEnable: String(remoteEnable),
    },
    accessToken
  );
}

export async function freezeKey(accessToken: string, keyId: number) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/key/freeze",
    { keyId: String(keyId) },
    accessToken
  );
}

export async function unfreezeKey(accessToken: string, keyId: number) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/key/unfreeze",
    { keyId: String(keyId) },
    accessToken
  );
}

// Change valid time of eKey
export async function changeKeyPeriod(accessToken: string, keyId: number, startDate: number, endDate: number) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/key/changePeriod",
    { keyId: String(keyId), startDate: String(startDate), endDate: String(endDate) },
    accessToken
  );
}

// Authorize eKey
export async function authorizeKey(accessToken: string, lockId: number, keyId: number) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/key/authorize",
    { lockId: String(lockId), keyId: String(keyId) },
    accessToken
  );
}

// Cancel eKey authorization
export async function unauthorizeKey(accessToken: string, lockId: number, keyId: number) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/key/unauthorize",
    { lockId: String(lockId), keyId: String(keyId) },
    accessToken
  );
}

// Get eKey unlock link
export async function getKeyUnlockLink(accessToken: string, keyId: number) {
  return apiPost<{ link: string }>(
    "/v3/key/getUnlockLink",
    { keyId: String(keyId) },
    accessToken
  );
}

// ===== Gateway Endpoints =====

export async function listGateways(accessToken: string, page = 1, size = 100) {
  return apiPost<{ list: { [key: string]: unknown }[]; pageNo: number; pageSize: number; total: number; pages: number }>(
    "/v3/gateway/list",
    { pageNo: String(page), pageSize: String(size) },
    accessToken
  );
}

export async function listGatewaysByLock(accessToken: string, lockId: number) {
  return apiPost<{ list: { [key: string]: unknown }[] }>(
    "/v3/gateway/listByLock",
    { lockId: String(lockId) },
    accessToken
  );
}

// Get gateway detail
export async function getGatewayDetail(accessToken: string, gatewayId: number) {
  return apiPost<{ [key: string]: unknown }>(
    "/v3/gateway/detail",
    { gatewayId: String(gatewayId) },
    accessToken
  );
}

// Get gateway config (alias for detail)
export async function getGatewayConfig(accessToken: string, gatewayId: number) {
  return getGatewayDetail(accessToken, gatewayId);
}

// Rename gateway
export async function renameGateway(accessToken: string, gatewayId: number, gatewayName: string) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/gateway/rename",
    { gatewayId: String(gatewayId), gatewayName },
    accessToken
  );
}

// Delete gateway
export async function deleteGateway(accessToken: string, gatewayId: number) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/gateway/delete",
    { gatewayId: String(gatewayId) },
    accessToken
  );
}

// Transfer gateway
export async function transferGateway(accessToken: string, receiverUsername: string, gatewayIdList: string) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/gateway/transfer",
    { receiverUsername, gatewayIdList },
    accessToken
  );
}

// List locks by gateway
export async function listLocksByGateway(accessToken: string, gatewayId: number) {
  return apiPost<{ list: { [key: string]: unknown }[] }>(
    "/v3/gateway/listLock",
    { gatewayId: String(gatewayId) },
    accessToken
  );
}

// List devices by gateway
export async function listDevicesByGateway(accessToken: string, gatewayId: number) {
  return apiPost<{ list: { [key: string]: unknown }[] }>(
    "/v3/gateway/listDevice",
    { gatewayId: String(gatewayId) },
    accessToken
  );
}

// Query init status of gateway
export async function checkGatewayInitStatus(accessToken: string, gatewayNetMac: string) {
  return apiPost<{ gatewayId: number }>(
    "/v3/gateway/isInitSuccess",
    { gatewayNetMac },
    accessToken
  );
}

// Gateway upgrade check
export async function checkGatewayUpgrade(accessToken: string, gatewayId: number) {
  return apiPost<{ needUpgrade: number; firmwareInfo?: string; version?: string }>(
    "/v3/gateway/upgradeCheck",
    { gatewayId: String(gatewayId) },
    accessToken
  );
}

// Set gateway into upgrade mode
export async function setGatewayUpgradeMode(accessToken: string, gatewayId: number) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/gateway/setUpgradeMode",
    { gatewayId: String(gatewayId) },
    accessToken
  );
}

// Upload gateway detail info
export async function uploadGatewayDetail(accessToken: string, gatewayId: number, detail: string) {
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/gateway/uploadDetail",
    { gatewayId: String(gatewayId), detail },
    accessToken
  );
}

// Set gateway config (alias for rename — TTLock doesn't have a separate config/set endpoint)
export async function setGatewayConfig(accessToken: string, gatewayId: number, config: { [key: string]: string }) {
  const params: { [key: string]: string } = { gatewayId: String(gatewayId), ...config };
  return apiPost<{ errcode: number; errmsg: string }>(
    "/v3/gateway/rename",
    params,
    accessToken
  );
}

// ===== User Management =====

export async function listUsers(page = 1, size = 20, startDate?: number, endDate?: number) {
  const params: { [key: string]: string } = {
    clientId: getClientId(),
    clientSecret: getClientSecret(),
    pageNo: String(page),
    pageSize: String(size),
    date: makeDate(),
  };
  if (startDate) params.startDate = String(startDate);
  if (endDate) params.endDate = String(endDate);
  const res = await fetch(`${BASE}/v3/user/list?${new URLSearchParams(params)}`, {
    method: "GET",
  });
  const data = await res.json();
  if (data.errcode && data.errcode !== 0) {
    throw new Error(`TTLock API error ${data.errcode}: ${data.errmsg || "Unknown"}`);
  }
  return data as { list: { [key: string]: unknown }[]; pageNo: number; pageSize: number; total: number; pages: number };
}

export async function deleteUser(username: string) {
  const res = await fetch(`${BASE}/v3/user/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      clientId: getClientId(),
      clientSecret: getClientSecret(),
      username,
      date: makeDate(),
    }),
  });
  const data = await res.json();
  if (data.errcode !== 0) {
    throw new Error(data.errmsg || "User deletion failed");
  }
  return data;
}
