// TTLock API client — server-side only (env secrets)
import { createHash } from "node:crypto";

const BASE = "https://api.sciener.com";

interface TokenStore {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

let tokenStore: TokenStore | null = null;

function getClientId() {
  return process.env.TTLOCK_CLIENT_ID!;
}

function getClientSecret() {
  return process.env.TTLOCK_CLIENT_SECRET!;
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
      client_id: getClientId(),
      client_secret: getClientSecret(),
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
      client_id: getClientId(),
      client_secret: getClientSecret(),
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

async function apiPost<T>(
  path: string,
  params: Record<string, string>,
  accessToken: string
): Promise<T> {
  const body: Record<string, string> = {
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

  const data = await res.json();
  if (data.errcode && data.errcode !== 0) {
    throw new Error(`TTLock API error ${data.errcode}: ${data.errmsg || "Unknown"}`);
  }
  return data;
}

// Lock endpoints
export async function listLocks(accessToken: string, page = 1, size = 20) {
  return apiPost<{ list: Record<string, unknown>[]; total: number }>("/v3/lock/list", {
    pageNo: String(page),
    pageSize: String(size),
  }, accessToken);
}

export async function lockDetail(accessToken: string, lockId: number) {
  return apiPost<Record<string, unknown>>("/v3/lock/detail", { lockId: String(lockId) }, accessToken);
}

export async function lockAction(accessToken: string, lockId: number, action: "lock" | "unlock") {
  return apiPost<{ errcode: number; errmsg: string }>(
    `/v3/lock/${action}`,
    { lockId: String(lockId) },
    accessToken
  );
}

// Gateway endpoints
export async function listGateways(accessToken: string) {
  return apiPost<{ list: Record<string, unknown>[] }>("/v3/gateway/list", {
    pageNo: "1",
    pageSize: "10",
  }, accessToken);
}

// EKey endpoints
export async function listKeys(accessToken: string) {
  return apiPost<{ list: Record<string, unknown>[] }>("/v3/key/list", {
    pageNo: "1",
    pageSize: "20",
  }, accessToken);
}

// Gateway — list by lock
export async function listGatewaysByLock(accessToken: string, lockId: number) {
  return apiPost<{ list: Record<string, unknown>[] }>("/v3/gateway/listByLock", {
    lockId: String(lockId),
  }, accessToken);
}

// Passcode APIs
export async function listPasscodes(accessToken: string, lockId: number) {
  return apiPost<{ list: Record<string, unknown>[] }>("/v3/passcode/list", {
    lockId: String(lockId),
    pageNo: "1",
    pageSize: "50",
  }, accessToken);
}

export async function addPasscode(
  accessToken: string,
  lockId: number,
  passcode: string,
  type: number,
  startDate?: number,
  endDate?: number
) {
  const params: Record<string, string> = {
    lockId: String(lockId),
    passcode,
    type: String(type),
    addType: "2",
  };
  if (startDate) params.startDate = String(startDate);
  if (endDate) params.endDate = String(endDate);
  return apiPost<Record<string, unknown>>("/v3/passcode/add", params, accessToken);
}

export async function deletePasscode(accessToken: string, lockId: number, passcodeId: number) {
  return apiPost<Record<string, unknown>>("/v3/passcode/delete", {
    lockId: String(lockId),
    passcodeId: String(passcodeId),
  }, accessToken);
}

// Unlock records
export async function listRecords(accessToken: string, lockId: number, page = 1, size = 50) {
  return apiPost<{ list: Record<string, unknown>[]; total: number }>("/v3/record/list", {
    lockId: String(lockId),
    pageNo: String(page),
    pageSize: String(size),
  }, accessToken);
}

// Firmware upgrade
export async function checkUpgrade(accessToken: string, lockId: number) {
  return apiPost<{ needUpgrade: number; firmwareInfo?: string }>("/v3/lock/checkUpgrade", {
    lockId: String(lockId),
  }, accessToken);
}

export async function upgradeFirmware(accessToken: string, lockId: number) {
  return apiPost<Record<string, unknown>>("/v3/lock/upgrade", {
    lockId: String(lockId),
  }, accessToken);
}

// IC Card APIs
export async function listICCards(accessToken: string, lockId: number) {
  return apiPost<{ list: Record<string, unknown>[] }>("/v3/icCard/list", {
    lockId: String(lockId),
    pageNo: "1",
    pageSize: "50",
  }, accessToken);
}

export async function addICCard(
  accessToken: string,
  lockId: number,
  cardNumber: string,
  cardName: string,
  startDate?: number,
  endDate?: number
) {
  const params: Record<string, string> = {
    lockId: String(lockId),
    cardNumber,
    cardName,
    addType: "2",
  };
  if (startDate) params.startDate = String(startDate);
  if (endDate) params.endDate = String(endDate);
  return apiPost<Record<string, unknown>>("/v3/icCard/add", params, accessToken);
}

export async function deleteICCard(accessToken: string, lockId: number, cardId: number) {
  return apiPost<Record<string, unknown>>("/v3/icCard/delete", {
    lockId: String(lockId),
    cardId: String(cardId),
  }, accessToken);
}

// Fingerprint APIs
export async function listFingerprints(accessToken: string, lockId: number) {
  return apiPost<{ list: Record<string, unknown>[] }>("/v3/fingerprint/list", {
    lockId: String(lockId),
    pageNo: "1",
    pageSize: "50",
  }, accessToken);
}

export async function addFingerprint(
  accessToken: string,
  lockId: number,
  fingerprintNumber: string,
  fingerprintName: string,
  startDate?: number,
  endDate?: number
) {
  const params: Record<string, string> = {
    lockId: String(lockId),
    fingerprintNumber,
    fingerprintName,
    addType: "2",
  };
  if (startDate) params.startDate = String(startDate);
  if (endDate) params.endDate = String(endDate);
  return apiPost<Record<string, unknown>>("/v3/fingerprint/add", params, accessToken);
}

export async function deleteFingerprint(accessToken: string, lockId: number, fingerprintId: number) {
  return apiPost<Record<string, unknown>>("/v3/fingerprint/delete", {
    lockId: String(lockId),
    fingerprintId: String(fingerprintId),
  }, accessToken);
}

// Update passcode (edit existing)
export async function updatePasscode(
  accessToken: string,
  lockId: number,
  passcodeId: number,
  passcode: string,
  type: number,
  startDate?: number,
  endDate?: number
) {
  const params: Record<string, string> = {
    lockId: String(lockId),
    passcodeId: String(passcodeId),
    passcode,
    type: String(type),
  };
  if (startDate) params.startDate = String(startDate);
  if (endDate) params.endDate = String(endDate);
  return apiPost<Record<string, unknown>>("/v3/passcode/update", params, accessToken);
}

// EKey management
export async function deleteKey(accessToken: string, keyId: number) {
  return apiPost<Record<string, unknown>>("/v3/key/delete", {
    keyId: String(keyId),
  }, accessToken);
}

export async function updateKey(
  accessToken: string,
  keyId: number,
  keyName: string,
  startDate: number,
  endDate: number,
  remoteEnable = 1
) {
  return apiPost<Record<string, unknown>>("/v3/key/update", {
    keyId: String(keyId),
    keyName,
    startDate: String(startDate),
    endDate: String(endDate),
    remoteEnable: String(remoteEnable),
  }, accessToken);
}

export async function freezeKey(accessToken: string, keyId: number) {
  return apiPost<Record<string, unknown>>("/v3/key/freeze", {
    keyId: String(keyId),
  }, accessToken);
}

export async function unfreezeKey(accessToken: string, keyId: number) {
  return apiPost<Record<string, unknown>>("/v3/key/unfreeze", {
    keyId: String(keyId),
  }, accessToken);
}

// Lock configuration
export async function getLockConfig(accessToken: string, lockId: number) {
  return apiPost<Record<string, unknown>>("/v3/lock/config", {
    lockId: String(lockId),
  }, accessToken);
}

export async function setLockConfig(accessToken: string, lockId: number, config: Record<string, string>) {
  return apiPost<Record<string, unknown>>("/v3/lock/config/set", {
    lockId: String(lockId),
    ...config,
  }, accessToken);
}

// Door sensor state
export async function getDoorSensorState(accessToken: string, lockId: number) {
  return apiPost<Record<string, unknown>>("/v3/lock/doorSensor", {
    lockId: String(lockId),
  }, accessToken);
}

// Gateway config
export async function getGatewayConfig(accessToken: string, gatewayId: number) {
  return apiPost<Record<string, unknown>>("/v3/gateway/config", {
    gatewayId: String(gatewayId),
  }, accessToken);
}

export async function setGatewayConfig(accessToken: string, gatewayId: number, config: Record<string, string>) {
  return apiPost<Record<string, unknown>>("/v3/gateway/config/set", {
    gatewayId: String(gatewayId),
    ...config,
  }, accessToken);
}

export async function sendKey(
  accessToken: string,
  lockId: number,
  receiverUsername: string,
  keyName: string,
  startDate: number,
  endDate: number
) {
  return apiPost<{ keyId: number }>("/v3/key/send", {
    lockId: String(lockId),
    receiverUsername,
    keyName,
    startDate: String(startDate),
    endDate: String(endDate),
    remoteEnable: "1",
  }, accessToken);
}
