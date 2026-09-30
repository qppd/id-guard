// Client-side passcode registry — stores metadata for Custom/Recurring passcodes
// Independent from TTLock API; used only for UI labeling

const STORAGE_KEY_CUSTOM = "idguard_passcodes_custom";
const STORAGE_KEY_RECURRING = "idguard_passcodes_recurring";

interface CustomPasscodeEntry {
  lockId: number;
  keyboardPwdId: number;
  name: string;
  passcode: string;
  note?: string;
}

type RecurringPasscodeType = "daily" | "weekend" | "workday";

interface RecurringPasscodeEntry {
  lockId: number;
  keyboardPwdId: number;
  name: string;
  passcode: string;
  recurringType: RecurringPasscodeType;
  note?: string;
}

function readStore<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeStore<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export function getCustomPasscodes(lockId: number): CustomPasscodeEntry[] {
  return readStore<CustomPasscodeEntry>(STORAGE_KEY_CUSTOM).filter(
    (e) => e.lockId === lockId
  );
}

export function getRecurringPasscodes(lockId: number): RecurringPasscodeEntry[] {
  return readStore<RecurringPasscodeEntry>(STORAGE_KEY_RECURRING).filter(
    (e) => e.lockId === lockId
  );
}

export function storeCustomPasscode(entry: CustomPasscodeEntry): void {
  const items = readStore<CustomPasscodeEntry>(STORAGE_KEY_CUSTOM);
  // A passcode (digits) is unique per lock — update the entry if it already exists,
  // otherwise append. TTLock returns the real keyboardPwdId only after creation.
  const idx = items.findIndex(
    (e) => e.lockId === entry.lockId && e.passcode === entry.passcode
  );
  if (idx >= 0) items[idx] = entry;
  else items.push(entry);
  writeStore(STORAGE_KEY_CUSTOM, items);
}

export function storeRecurringPasscode(entry: RecurringPasscodeEntry): void {
  const items = readStore<RecurringPasscodeEntry>(STORAGE_KEY_RECURRING);
  // A passcode (digits) is unique per lock — update the entry if it already exists,
  // otherwise append. TTLock returns the real keyboardPwdId only after creation.
  const idx = items.findIndex(
    (e) => e.lockId === entry.lockId && e.passcode === entry.passcode
  );
  if (idx >= 0) items[idx] = entry;
  else items.push(entry);
  writeStore(STORAGE_KEY_RECURRING, items);
}

export function removeCustomPasscode(lockId: number, keyboardPwdId: number): void {
  const items = readStore<CustomPasscodeEntry>(STORAGE_KEY_CUSTOM).filter(
    (e) => !(e.lockId === lockId && e.keyboardPwdId === keyboardPwdId)
  );
  writeStore(STORAGE_KEY_CUSTOM, items);
}

export function removeRecurringPasscode(lockId: number, keyboardPwdId: number): void {
  const items = readStore<RecurringPasscodeEntry>(STORAGE_KEY_RECURRING).filter(
    (e) => !(e.lockId === lockId && e.keyboardPwdId === keyboardPwdId)
  );
  writeStore(STORAGE_KEY_RECURRING, items);
}
