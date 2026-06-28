// TTLock API types
export interface TTLockResponse {
  errcode: number;
  errmsg: string;
}

export interface LockInfo {
  lockId: number;
  lockName: string;
  lockAlias: string;
  lockMac: string;
  lockKey?: string;
  aesKeyStr?: string;
  hasGateway: boolean;
  electricQuantity: number;
  adminPwd?: string;
  noKeyPwd?: string;
  specialValue?: number;
  firmwareRevision?: string;
  hardwareRevision?: number;
  lockVersion?: LockVersion;
  timezoneRawOffset?: number;
}

export interface LockVersion {
  protocolVersion: number;
  protocolType: number;
  orgId: number;
  logoUrl: string;
  groupId: number;
}

export interface GatewayInfo {
  gatewayId: number;
  gatewayName: string;
  gatewayMac: string;
  gatewayVersion: number;
  isOnline: number;
  lockNum: number;
  rssi?: number;
}

export interface EKeyInfo {
  keyId: number;
  lockId: number;
  lockName?: string;
  userType: number; // 110301=admin, 110302=user
  startDate: number;
  endDate: number;
  remoteEnable: number;
  status?: number;
}

export interface LockRecord {
  recordId: number;
  lockId: number;
  keyId: number;
  unlockTime: number;
  unlockType: number;
  gatewayId?: number;
  success: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  uid: number;
  expires_in: number;
  scope: string;
}

// API response wrappers
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  pageNo: number;
  pageSize: number;
  pages: number;
}
