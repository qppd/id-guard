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
