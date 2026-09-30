"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { storeCustomPasscode, storeRecurringPasscode, removeCustomPasscode, removeRecurringPasscode, getCustomPasscodes, getRecurringPasscodes } from "@/lib/passcodeRegistry";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface LockDetail {
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
  timezoneRawOffset?: number;
}

interface Passcode {
  keyboardPwdId: number;
  keyboardPwd: string;
  keyboardPwdType: number;
  startDate?: number;
  endDate?: number;
  nickName?: string;
  status?: number;
  [key: string]: unknown;
}

interface LockRecord {
  recordId: number;
  lockId: number;
  keyId?: number;
  lockDate: number;
  recordType: number;
  serverDate?: number;
  gatewayId?: number;
  success: number;
  username?: string;
  keyboardPwd?: string;
  [key: string]: unknown;
}

export default function LockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lockId = Number(params.id);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { settings } = useTheme();

  // Data fetching
  const { data: detailRes, mutate: refreshDetail } = useSWR<{ ok: boolean; data: LockDetail }>(
    isAuthenticated ? `/api/locks/${lockId}` : null,
    fetcher
  );

  const { data: passRes, mutate: refreshPass } = useSWR<{ ok: boolean; data: Passcode[] }>(
    isAuthenticated ? `/api/passcodes?lockId=${lockId}` : null,
    fetcher
  );

  const { data: recRes, mutate: refreshRec } = useSWR<{ ok: boolean; data: LockRecord[]; total: number }>(
    // fetches ALL pages server-side; UI paginates locally below
    isAuthenticated ? `/api/records?lockId=${lockId}` : null,
    fetcher
  );

  const { data: gwRes } = useSWR<{ ok: boolean; data: Array<{ [key: string]: unknown }> }>(
    isAuthenticated ? `/api/gateways` : null,
    fetcher,
    { refreshInterval: settings.refreshInterval > 0 ? settings.refreshInterval * 1000 : undefined }
  );

  const { data: gwByLockRes } = useSWR<{ ok: boolean; data: Array<{ [key: string]: unknown }> }>(
    isAuthenticated ? `/api/gateways-listByLock-${lockId}` : null,
    async () => {
      const res = await fetch("/api/gateways/listByLock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockId }),
      });
      return res.json();
    }
  );

  const { data: icRes, mutate: refreshIc } = useSWR<{ ok: boolean; data: { [key: string]: unknown }[] }>(
    isAuthenticated ? `/api/ic-cards?lockId=${lockId}` : null,
    fetcher
  );

  const { data: fpRes, mutate: refreshFp } = useSWR<{ ok: boolean; data: { [key: string]: unknown }[] }>(
    isAuthenticated ? `/api/fingerprints?lockId=${lockId}` : null,
    fetcher
  );

  const { data: doorRes } = useSWR<{ ok: boolean; data: { doorState: number; timestamp: number } }>(
    isAuthenticated ? `/api/locks/door-sensor?lockId=${lockId}` : null,
    fetcher,
    { refreshInterval: settings.refreshInterval > 0 ? settings.refreshInterval * 1000 : 30000 }
  );

  const { data: openStateRes } = useSWR<{ ok: boolean; data: { state: number } }>(
    isAuthenticated ? `/api/locks/open-state?lockId=${lockId}` : null,
    fetcher
  );

  const { data: lockTimeRes, mutate: refreshLockTime } = useSWR<{ ok: boolean; data: { date: number } }>(
    isAuthenticated ? `/api/locks/time?lockId=${lockId}` : null,
    fetcher
  );

  const { data: batteryRes, mutate: refreshBattery } = useSWR<{ ok: boolean; data: { electricQuantity: number } }>(
    isAuthenticated ? `/api/locks/battery?lockId=${lockId}` : null,
    fetcher
  );

  // UI state
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [upgradeInfo, setUpgradeInfo] = useState("");
  const [recordsExpanded, setRecordsExpanded] = useState(false);
  const [icExpanded, setIcExpanded] = useState(false);
  const [fpExpanded, setFpExpanded] = useState(false);
  const [lockTimeExpanded, setLockTimeExpanded] = useState(false);

  // Passcode form
  const [passForm, setPassForm] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [passType, setPassType] = useState(2);
  const [passCustomName, setPassCustomName] = useState("");
  const [passRecurringType, setPassRecurringType] = useState<"daily" | "weekend" | "workday">("daily");
  // Custom passcode validity window (datetime-local strings; empty = defaults)
  const [passStartDate, setPassStartDate] = useState("");
  const [passEndDate, setPassEndDate] = useState("");
  // Recurring passcode daily active hours (time strings HH:mm; empty = defaults)
  const [passActiveFrom, setPassActiveFrom] = useState("09:00");
  const [passActiveUntil, setPassActiveUntil] = useState("18:00");
  // IC card & Fingerprint add forms removed — requires Bluetooth APP SDK, not cloud API

  // Passcode edit form state
  const [editPassId, setEditPassId] = useState<number | null>(null);
  const [editPass, setEditPass] = useState("");
  const [editPassName, setEditPassName] = useState("");
  const [editPassStartDate, setEditPassStartDate] = useState("");
  const [editPassEndDate, setEditPassEndDate] = useState("");

  // Batch delete records state
  const [selectedSuccessRecords, setSelectedSuccessRecords] = useState<Set<number>>(new Set());
  const [selectedFailedRecords, setSelectedFailedRecords] = useState<Set<number>>(new Set());
  const [successRecordsPage, setSuccessRecordsPage] = useState(1);
  const [failedRecordsPage, setFailedRecordsPage] = useState(1);

  // Rename form
  const [renameForm, setRenameForm] = useState(false);
  const [renameAlias, setRenameAlias] = useState("");

  // Transfer form
  const [transferForm, setTransferForm] = useState(false);
  const [transferReceiver, setTransferReceiver] = useState("");

  // Admin passcode
  const [adminPassForm, setAdminPassForm] = useState(false);
  const [adminPass, setAdminPass] = useState("");

  // Auto lock time
  const [autoLockForm, setAutoLockForm] = useState(false);
  const [autoLockSeconds, setAutoLockSeconds] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) return <div className="min-h-[80vh] flex items-center justify-center"><p className="text-text-muted">Loading...</p></div>;
  if (!isAuthenticated) return null;

  const detail = detailRes?.data;
  const passcodes = passRes?.data ?? [];
  // Merge isOnline from main gateway list into by-lock list (listByLock doesn't return isOnline)
  const gwByLock = gwByLockRes?.data ?? [];
  const gwAll = gwRes?.data ?? [];
  const gwOnlineMap = new Map(gwAll.map((g: { [key: string]: unknown }) => [g.gatewayId, g.isOnline]));
  const gateways = gwByLock.length > 0
    ? gwByLock.map((g: { [key: string]: unknown }) => ({ ...g, isOnline: gwOnlineMap.get(g.gatewayId) ?? g.isOnline }))
    : gwAll;
  const records = recRes?.data ?? [];
  const icCards = icRes?.data ?? [];
  const fingerprints = fpRes?.data ?? [];
  const battery = batteryRes?.data?.electricQuantity ?? detail?.electricQuantity;
  const openState = openStateRes?.data?.state;
  const lockTime = lockTimeRes?.data?.date;

  // Handlers
  const handleAddPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      const now = Date.now();
      // TTLock keyboardPwd/add requires BOTH startDate and endDate for all types
      let startDate = now;
      let endDate = now + 5 * 365 * 24 * 60 * 60 * 1000; // Permanent: +5y (TTLock app convention)
      if (passType === 1) endDate = now + 6 * 60 * 60 * 1000; // One-time: valid 6h
      if (passType === 3) endDate = now + 365 * 24 * 60 * 60 * 1000; // Period: 1y default
      let apiType = passType;
      let displayName = "";

      // Custom and Recurring are special UI types that map to TTLock types
      if (passType === 5) {
        // Custom: Period passcode with user-chosen validity window + friendly name
        apiType = 3;
        startDate = passStartDate ? new Date(passStartDate).getTime() : now;
        endDate = passEndDate ? new Date(passEndDate).getTime() : now + 365 * 24 * 60 * 60 * 1000;
        if (endDate <= startDate) throw new Error("Valid until must be after valid from");
        displayName = passCustomName || "Custom";
      } else if (passType === 6) {
        // Recurring maps to TTLock cyclic types: Daily=6, Workday=7, Weekend=5
        apiType = passRecurringType === "daily" ? 6 : passRecurringType === "workday" ? 7 : 5;
        // Cyclic passcodes encode the daily active window in the time-of-day of
        // startDate/endDate; the date part of endDate sets expiry.
        const [fh, fm] = (passActiveFrom || "09:00").split(":").map(Number);
        const [th, tm] = (passActiveUntil || "18:00").split(":").map(Number);
        const dayStart = new Date();
        dayStart.setHours(fh || 0, fm || 0, 0, 0);
        startDate = dayStart.getTime();
        const dayEnd = new Date();
        dayEnd.setHours(th || 0, tm || 0, 0, 0);
        if (dayEnd.getTime() <= startDate) throw new Error("Active until must be after active from");
        endDate = dayEnd.getTime() + 365 * 24 * 60 * 60 * 1000; // expire 1 year out
        displayName = passCustomName || (passRecurringType === "daily" ? "Daily Recurring" : passRecurringType === "workday" ? "Workday Recurring" : "Weekend Recurring");
      }

      const res = await fetch("/api/passcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", lockId, passcode: newPass, type: apiType, startDate, endDate, name: displayName || undefined }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      const newPwdId = Number(data.data?.keyboardPwdId) || 0;

      // Record Custom/Recurring labels locally (TTLock list only returns numeric types)
      if (passType === 5) {
        storeCustomPasscode({ lockId, keyboardPwdId: newPwdId, name: displayName, passcode: newPass, note: passCustomName });
      } else if (passType === 6) {
        storeRecurringPasscode({ lockId, keyboardPwdId: newPwdId, name: displayName, passcode: newPass, recurringType: passRecurringType, note: passCustomName });
      }

      setMsg("Passcode added!");
      setNewPass("");
      setPassCustomName("");
      setPassStartDate("");
      setPassEndDate("");
      setPassActiveFrom("09:00");
      setPassActiveUntil("18:00");
      setPassRecurringType("daily");
      setPassForm(false);
      refreshPass();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDelPass = async (passcodeId: number) => {
    try {
      const res = await fetch("/api/passcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", lockId, passcodeId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      removeCustomPasscode(lockId, passcodeId);
      removeRecurringPasscode(lockId, passcodeId);
      refreshPass();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleUpdatePass = async (e: React.FormEvent, passcodeId: number) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      const body: { [key: string]: unknown } = { action: "update", lockId, passcodeId };
      if (editPass) body.passcode = editPass;
      if (editPassName) body.passcodeName = editPassName;
      if (editPassStartDate) body.startDate = new Date(editPassStartDate).getTime();
      if (editPassEndDate) body.endDate = new Date(editPassEndDate).getTime();
      const res = await fetch("/api/passcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg("Passcode updated!");
      setEditPassId(null);
      setEditPass("");
      setEditPassName("");
      setEditPassStartDate("");
      setEditPassEndDate("");
      refreshPass();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleStartEdit = (p: Passcode) => {
    setEditPassId(p.keyboardPwdId);
    setEditPass("");
    setEditPassName(p.nickName || "");
    setEditPassStartDate(p.startDate ? new Date(p.startDate).toISOString().slice(0, 16) : "");
    setEditPassEndDate(p.endDate ? new Date(p.endDate).toISOString().slice(0, 16) : "");
  };

  const handleDeleteSelectedRecords = async (type: "success" | "failed") => {
    const selectedRecords = type === "success" ? selectedSuccessRecords : selectedFailedRecords;
    if (selectedRecords.size === 0) return;
    if (!confirm(`Delete ${selectedRecords.size} selected record(s)?`)) return;
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/records/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockId, recordIdList: JSON.stringify([...selectedRecords]) }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg("Records deleted!");
      if (type === "success") setSelectedSuccessRecords(new Set());
      else setSelectedFailedRecords(new Set());
      refreshRec();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const toggleRecordSelection = (recordId: number, isSuccessful: boolean) => {
    if (isSuccessful) {
      setSelectedSuccessRecords((prev) => {
        const next = new Set(prev);
        if (next.has(recordId)) next.delete(recordId);
        else next.add(recordId);
        return next;
      });
    } else {
      setSelectedFailedRecords((prev) => {
        const next = new Set(prev);
        if (next.has(recordId)) next.delete(recordId);
        else next.add(recordId);
        return next;
      });
    }
  };

  const renderRecordsList = (
    recordsList: LockRecord[],
    isSelected: Set<number>,
    toggleSelection: (id: number) => void,
    currentPage: number,
    setPage: React.Dispatch<React.SetStateAction<number>>,
    isSuccessful: boolean
  ) => {
    const totalPages = Math.ceil(recordsList.length / 50) || 1;
    const paginatedRecords = recordsList.slice((currentPage - 1) * 50, currentPage * 50);
    return (
      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-heading font-semibold text-accent">
            {isSuccessful ? "Successful Unlocks" : "Failed Attempts"} ({recordsList.length})
          </h3>
          {isSelected.size > 0 && (
            <button
              onClick={() => handleDeleteSelectedRecords(isSuccessful ? "success" : "failed")}
              className="text-error hover:text-error text-xs font-body"
            >
              Delete {isSelected.size} selected
            </button>
          )}
        </div>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {paginatedRecords.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-4 font-body">No records</p>
          ) : (
            paginatedRecords.map((r) => (
              <div key={r.recordId} className="flex items-center justify-between bg-alt rounded px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected.has(r.recordId)}
                    onChange={() => toggleSelection(r.recordId)}
                    className="shrink-0 accent-accent"
                  />
                  <span className={`shrink-0 ${r.success ? "text-success" : "text-error"}`}>
                    {r.success ? "Success" : "Failed"}
                  </span>
                  <span className="text-text-secondary font-body truncate">
                    {recordTypeLabel[r.recordType] || `Type ${r.recordType}`}
                  </span>
                  {r.username && (
                    <span className="text-text-muted text-xs font-body truncate">{r.username}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-text-muted text-xs font-body">
                    {r.lockDate ? new Date(r.lockDate).toLocaleString() : "—"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-border-card">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1 rounded bg-alt text-text-secondary text-xs border border-border-card hover:text-foreground disabled:opacity-50 font-body"
            >
              Previous
            </button>
            <span className="text-xs text-text-muted font-body">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 rounded bg-alt text-text-secondary text-xs border border-border-card hover:text-foreground disabled:opacity-50 font-body"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleCheckUpgrade = async () => {
    try {
      const res = await fetch("/api/locks/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", lockId }),
      });
      const data = await res.json();
      if (data.ok) {
        setUpgradeInfo(data.data.needUpgrade ? `Upgrade available: ${data.data.firmwareInfo || "New version"}` : "Firmware is up to date");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Check failed");
    }
  };

  // IC card & Fingerprint add handlers removed — requires Bluetooth APP SDK

  const handleDelIc = async (cardId: number) => {
    try {
      const res = await fetch("/api/ic-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", lockId, cardId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      refreshIc();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDelFp = async (fingerprintId: number) => {
    try {
      const res = await fetch("/api/fingerprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", lockId, fingerprintId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      refreshFp();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  // --- New handlers ---
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/locks/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockId, lockAlias: renameAlias }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg("Lock renamed!");
      setRenameAlias("");
      setRenameForm(false);
      refreshDetail();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDeleteLock = async () => {
    if (!confirm("Are you sure? This will delete all ekeys, passcodes, cards, and records.")) return;
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/locks/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      router.push("/dashboard");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/locks/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverUsername: transferReceiver, lockIdList: `[${lockId}]` }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg("Lock transferred!");
      setTransferReceiver("");
      setTransferForm(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleChangeAdminPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/locks/admin-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockId, password: adminPass }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg("Admin passcode changed!");
      setAdminPass("");
      setAdminPassForm(false);
      refreshDetail();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleSetAutoLock = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/locks/auto-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockId, seconds: parseInt(autoLockSeconds), type: 2 }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg("Auto lock time set!");
      setAutoLockSeconds("");
      setAutoLockForm(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleAdjustTime = async () => {
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/locks/adjust-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg("Lock time adjusted!");
      refreshLockTime();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleClearRecords = async () => {
    if (!confirm("Clear all unlock records?")) return;
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/records/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg("Records cleared!");
      refreshRec();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleUploadBattery = async () => {
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/locks/battery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockId, electricQuantity: battery }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg("Battery level uploaded!");
      refreshBattery();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const customEntries = getCustomPasscodes(lockId);
  const recurringEntries = getRecurringPasscodes(lockId);

  const passTypeLabel = (p: Passcode): string => {
    const custom = customEntries.find((e) => e.keyboardPwdId === p.keyboardPwdId || e.passcode === p.keyboardPwd);
    const recurring = recurringEntries.find((e) => e.keyboardPwdId === p.keyboardPwdId || e.passcode === p.keyboardPwd);
    if (custom) return `Custom · ${custom.name}`;
    if (recurring) return `Recurring · ${recurring.recurringType === "daily" ? "Daily" : recurring.recurringType === "workday" ? "Mon–Fri" : "Weekend"}`;
    switch (p.keyboardPwdType) {
      case 1: return "One-time";
      case 2: return "Permanent";
      case 3: return "Period";
      case 4: return "Delete";
      case 5: return "Weekend Cyclic";
      case 6: return "Daily Cyclic";
      case 7: return "Workday Cyclic";
      default: return `Type ${p.keyboardPwdType}`;
    }
  };

  const batteryColor = battery != null
    ? battery > 50 ? "text-success" : battery > 20 ? "text-warning" : "text-error"
    : "text-text-muted";

  const batteryBg = battery != null
    ? battery > 50 ? "bg-success-soft" : battery > 20 ? "bg-warning-soft" : "bg-error-soft"
    : "";

  // Per TTLock v3 lockRecord/list docs
  const recordTypeLabel: { [key: number]: string } = {
    1: "App Unlock",
    2: "Parking Lock Touch",
    3: "Gateway Unlock",
    4: "Passcode Unlock",
    5: "Parking Lock Raise",
    6: "Parking Lock Lower",
    7: "IC Card Unlock",
    8: "Fingerprint Unlock",
    9: "Wristband Unlock",
    10: "Mechanical Key Unlock",
    11: "Bluetooth Lock",
    12: "Gateway Unlock",
    29: "Unexpected Unlock",
    30: "Door Magnet Close",
    31: "Door Magnet Open",
    32: "Open From Inside",
    33: "Lock by Fingerprint",
    34: "Lock by Passcode",
    35: "Lock by IC Card",
    36: "Lock by Mechanical Key",
    37: "Remote Control",
    44: "Tamper Alert",
    45: "Auto Lock",
    46: "Unlock Key",
    47: "Lock Key",
    48: "Invalid Passcode",
  };

  return (
    <div className="container-page py-4 sm:py-8">
      <button onClick={() => router.back()} className="text-link hover:text-accent text-sm mb-3 sm:mb-4 font-body">&larr; Back</button>

      {/* Lock Header */}
      <div className="card-compact bg-card border border-border-card rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-accent font-heading truncate">{detail?.lockAlias || detail?.lockName || `Lock #${lockId}`}</h1>
            {detail?.lockAlias && detail?.lockAlias !== (detail?.lockName) && <p className="text-text-secondary text-sm mt-1 font-body truncate">{detail.lockName || "—"}</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Door Sensor */}
            {(doorRes?.data != null || openState != null) && (
              <span className={`text-xs px-2 py-1 rounded-full font-body ${
                (openState === 1 || doorRes?.data?.doorState)
                  ? "bg-success-soft text-success border border-green-200"
                  : "bg-alt text-text-secondary border border-border-card"
              }`}>
                {(openState === 1 || doorRes?.data?.doorState) ? "Open" : "Closed"}
              </span>
            )}
            <span className={`text-base sm:text-lg font-bold ${batteryColor} ${batteryBg} px-2 py-1 rounded`}>
              {battery != null ? `${battery}%` : "..."}
            </span>
            <button onClick={() => refreshBattery()} className="text-text-muted hover:text-accent text-xs font-body">Refresh</button>
            <button onClick={handleUploadBattery} className="text-text-muted hover:text-accent text-xs font-body">Upload</button>
          </div>
        </div>
        <div className="grid-detail-info mt-4 sm:mt-6 text-sm">
          <div><span className="text-text-muted">ID</span><p className="text-foreground font-body break-all">{detail?.lockId}</p></div>
          <div className="sm:col-span-1"><span className="text-text-muted">MAC</span><p className="text-foreground font-mono text-xs break-all">{detail?.lockMac || "—"}</p></div>
          <div><span className="text-text-muted">Gateway</span><p className="text-foreground font-body">{detail?.hasGateway ? "Connected" : "None"}</p></div>
          <div><span className="text-text-muted">Firmware</span><p className="text-foreground font-body">{detail?.firmwareRevision || "—"}</p></div>
          <div><span className="text-text-muted">Hardware</span><p className="text-foreground font-body">{detail?.hardwareRevision != null ? `v${detail.hardwareRevision}` : "—"}</p></div>
          <div className="sm:col-span-1"><span className="text-text-muted">Admin Code</span><p className="text-foreground font-mono text-xs break-all">{detail?.adminPwd || "—"}</p></div>
        </div>

        {/* Lock management actions */}
        <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
          <button onClick={handleCheckUpgrade} className="px-3 py-1.5 rounded bg-card border border-border-card text-text-secondary text-sm hover:bg-sky hover:text-accent transition-colors font-body">
            Check Upgrade
          </button>
          <button onClick={() => setRenameForm(!renameForm)} className="px-3 py-1.5 rounded bg-card border border-border-card text-text-secondary text-sm hover:bg-sky hover:text-accent transition-colors font-body">
            Rename
          </button>
          <button onClick={() => setTransferForm(!transferForm)} className="px-3 py-1.5 rounded bg-card border border-border-card text-text-secondary text-sm hover:bg-sky hover:text-accent transition-colors font-body">
            Transfer
          </button>
          <button onClick={() => setAdminPassForm(!adminPassForm)} className="px-3 py-1.5 rounded bg-card border border-border-card text-text-secondary text-sm hover:bg-sky hover:text-accent transition-colors font-body">
            Change Admin Passcode
          </button>
          <button onClick={() => setAutoLockForm(!autoLockForm)} className="px-3 py-1.5 rounded bg-card border border-border-card text-text-secondary text-sm hover:bg-sky hover:text-accent transition-colors font-body">
            Auto Lock Time
          </button>
          <button onClick={handleDeleteLock} className="px-3 py-1.5 rounded bg-error-soft border border-red-200 text-error text-sm hover:bg-red-100 transition-colors font-body">
            Delete Lock
          </button>
          {upgradeInfo && <p className="text-xs text-text-secondary self-start sm:self-center font-body">{upgradeInfo}</p>}
        </div>

        {/* Rename form */}
        {renameForm && (
          <form onSubmit={handleRename} className="mt-3 p-3 bg-alt rounded space-y-2">
            <input type="text" placeholder="New lock alias" value={renameAlias} onChange={(e) => setRenameAlias(e.target.value)} required className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
            <button type="submit" className="px-4 py-1.5 rounded bg-accent text-white text-sm hover:bg-accent-hover font-body">Save</button>
          </form>
        )}

        {/* Transfer form */}
        {transferForm && (
          <form onSubmit={handleTransfer} className="mt-3 p-3 bg-alt rounded space-y-2">
            <input type="text" placeholder="Receiver username (email or phone)" value={transferReceiver} onChange={(e) => setTransferReceiver(e.target.value)} required className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
            <button type="submit" className="px-4 py-1.5 rounded bg-accent text-white text-sm hover:bg-accent-hover font-body">Transfer Lock</button>
          </form>
        )}

        {/* Admin passcode form */}
        {adminPassForm && (
          <form onSubmit={handleChangeAdminPass} className="mt-3 p-3 bg-alt rounded space-y-2">
            <input type="text" placeholder="New admin passcode" value={adminPass} onChange={(e) => setAdminPass(e.target.value.replace(/\D/g, ""))} maxLength={9} minLength={4} required className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
            <button type="submit" className="px-4 py-1.5 rounded bg-accent text-white text-sm hover:bg-accent-hover font-body">Change Passcode</button>
          </form>
        )}

        {/* Auto lock time form */}
        {autoLockForm && (
          <form onSubmit={handleSetAutoLock} className="mt-3 p-3 bg-alt rounded space-y-2">
            <input type="number" placeholder="Auto lock seconds (0 = off)" value={autoLockSeconds} onChange={(e) => setAutoLockSeconds(e.target.value)} required className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
            <button type="submit" className="px-4 py-1.5 rounded bg-accent text-white text-sm hover:bg-accent-hover font-body">Set Auto Lock</button>
          </form>
        )}
      </div>

      {/* Error/success banner */}
      {err && <p className="text-error text-xs bg-error-soft border border-red-200 rounded-lg p-3 mb-4">{err}</p>}
      {msg && <p className="text-success text-xs bg-success-soft border border-green-200 rounded-lg p-3 mb-4">{msg}</p>}

      <div className="grid-2col-responsive">
        {/* Passcodes */}
        <div className="card-compact bg-card border border-border-card rounded-lg p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-heading font-semibold text-accent">Passcodes</h2>
            <button onClick={() => { setPassForm(!passForm); }} className="px-3 py-1 rounded bg-accent text-white text-sm hover:bg-accent-hover transition-colors font-body">
              {passForm ? "Cancel" : "+ Add"}
            </button>
          </div>

          {passForm && (
            <form onSubmit={handleAddPass} className="mb-4 p-3 bg-alt rounded space-y-2">
              <input type="text" placeholder="Passcode (4-9 digits)" value={newPass} onChange={(e) => setNewPass(e.target.value.replace(/\D/g, ""))} maxLength={9} minLength={4} required className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
              <select value={passType} onChange={(e) => setPassType(Number(e.target.value))} className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring">
                <option value={2}>Permanent</option>
                <option value={3}>Period (Timed)</option>
                <option value={1}>One-time</option>
                <option value={5}>Custom</option>
                <option value={6}>Recurring</option>
              </select>
              {(passType === 5 || passType === 6) && (
                <input
                  type="text"
                  placeholder="Name (e.g., 'Weekend Access', 'Cleaner')"
                  value={passCustomName}
                  onChange={(e) => setPassCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring"
                />
              )}
              {passType === 5 && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-text-secondary font-body">
                    Valid from
                    <input
                      type="datetime-local"
                      value={passStartDate}
                      onChange={(e) => setPassStartDate(e.target.value)}
                      className="mt-1 w-full px-2 py-1.5 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring"
                    />
                  </label>
                  <label className="text-xs text-text-secondary font-body">
                    Valid until
                    <input
                      type="datetime-local"
                      value={passEndDate}
                      onChange={(e) => setPassEndDate(e.target.value)}
                      className="mt-1 w-full px-2 py-1.5 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring"
                    />
                  </label>
                </div>
              )}
              {passType === 5 && (
                <p className="text-xs text-text-muted font-body">Leave empty for: now → 1 year from now</p>
              )}
              {passType === 6 && (
                <select
                  value={passRecurringType}
                  onChange={(e) => setPassRecurringType(e.target.value as "daily" | "weekend")}
                  className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring"
                >
                  <option value="daily">Every day (Daily Cyclic)</option>
                  <option value="workday">Mon–Fri (Workday Cyclic)</option>
                  <option value="weekend">Sat–Sun (Weekend Cyclic)</option>
                </select>
              )}
              {passType === 6 && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-text-secondary font-body">
                    Active from
                    <input
                      type="time"
                      value={passActiveFrom}
                      onChange={(e) => setPassActiveFrom(e.target.value)}
                      className="mt-1 w-full px-2 py-1.5 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring"
                    />
                  </label>
                  <label className="text-xs text-text-secondary font-body">
                    Active until
                    <input
                      type="time"
                      value={passActiveUntil}
                      onChange={(e) => setPassActiveUntil(e.target.value)}
                      className="mt-1 w-full px-2 py-1.5 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring"
                    />
                  </label>
                </div>
              )}
              {passType === 6 && (
                <p className="text-xs text-text-muted font-body">Works every {passRecurringType === "daily" ? "day" : passRecurringType === "workday" ? "workday" : "weekend day"} between these hours</p>
              )}
              <button type="submit" className="w-full py-1.5 rounded bg-accent text-white text-sm hover:bg-accent-hover font-body">Add Passcode</button>
            </form>
          )}

          {passcodes.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-4 font-body">No passcodes</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {passcodes.map((p) => (
                <div key={p.keyboardPwdId}>
                  <div className="flex items-center justify-between bg-alt rounded px-3 py-2">
                    <div>
                      <span className="text-foreground font-mono text-sm">{p.keyboardPwd}</span>
                      <span className="text-text-muted text-xs ml-2 font-body">
                        {passTypeLabel(p)}{p.nickName ? ` · ${p.nickName}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleStartEdit(p)} className="text-accent hover:text-accent text-xs font-body">Edit</button>
                      <button onClick={() => handleDelPass(p.keyboardPwdId)} className="text-error hover:text-error text-xs font-body">Delete</button>
                    </div>
                  </div>
                  {editPassId === p.keyboardPwdId && (
                    <form onSubmit={(e) => handleUpdatePass(e, p.keyboardPwdId)} className="mt-2 p-3 bg-card border border-border-card rounded space-y-2">
                      <input type="text" placeholder="New passcode (leave blank to keep)" value={editPass} onChange={(e) => setEditPass(e.target.value.replace(/\D/g, ""))} maxLength={9} className="w-full px-2 py-1.5 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
                      <input type="text" placeholder="Passcode name" value={editPassName} onChange={(e) => setEditPassName(e.target.value)} className="w-full px-2 py-1.5 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs text-text-secondary font-body">
                          Start
                          <input type="datetime-local" value={editPassStartDate} onChange={(e) => setEditPassStartDate(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
                        </label>
                        <label className="text-xs text-text-secondary font-body">
                          End
                          <input type="datetime-local" value={editPassEndDate} onChange={(e) => setEditPassEndDate(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="px-3 py-1 rounded bg-accent text-white text-xs hover:bg-accent-hover font-body">Save</button>
                        <button type="button" onClick={() => setEditPassId(null)} className="px-3 py-1 rounded bg-alt text-text-secondary text-xs border border-border-card font-body">Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IC Cards */}
        <div className="card-compact bg-card border border-border-card rounded-lg p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-heading font-semibold text-accent">IC Cards</h2>
            <button onClick={() => { setPassForm(false); }} className="px-3 py-1 rounded bg-alt text-text-secondary text-sm border border-border-card hover:bg-card transition-colors font-body">
              Manage
            </button>
          </div>

          {/* IC card add form removed — requires Bluetooth APP SDK */}

          {icCards.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-4 font-body">No IC cards</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {icCards.map((c: { [key: string]: unknown }, i: number) => (
                <div key={i} className="flex items-center justify-between bg-alt rounded px-3 py-2">
                  <div>
                    <p className="text-foreground font-mono text-sm">{c.cardNumber as string}</p>
                    <p className="text-text-muted text-xs font-body">{c.cardName as string}</p>
                  </div>
                  <button onClick={() => handleDelIc(c.cardId as number)} className="text-error hover:text-error text-xs font-body">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fingerprints */}
        <div className="card-compact bg-card border border-border-card rounded-lg p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-heading font-semibold text-accent">Fingerprints</h2>
            <button onClick={() => { setPassForm(false); }} className="px-3 py-1 rounded bg-alt text-text-secondary text-sm border border-border-card hover:bg-card transition-colors font-body">
              Manage
            </button>
          </div>

          {/* Fingerprint add form removed — requires Bluetooth APP SDK */}

          {fingerprints.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-4 font-body">No fingerprints</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {fingerprints.map((fp: { [key: string]: unknown }, i: number) => (
                <div key={i} className="flex items-center justify-between bg-alt rounded px-3 py-2">
                  <div>
                    <p className="text-foreground text-sm font-body">{fp.fingerprintName as string || `FP #${fp.fingerprintId}`}</p>
                    <p className="text-text-muted text-xs font-body">#{fp.fingerprintNumber as string}</p>
                  </div>
                  <button onClick={() => handleDelFp(fp.fingerprintId as number)} className="text-error hover:text-error text-xs font-body">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gateways */}
        <div className="card-compact bg-card border border-border-card rounded-lg p-4 shadow-card">
          <h2 className="text-lg font-heading font-semibold text-accent mb-3">Gateways</h2>
          {gateways.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-4 font-body">No gateways</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {gateways.map((g: { [key: string]: unknown }, i: number) => (
                <div key={i} className="bg-alt rounded px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-medium font-body">{g.gatewayName as string || `Gateway #${g.gatewayId}`}</p>
                    <p className="text-text-muted text-xs font-body">MAC: {g.gatewayMac as string} · {g.lockNum as number} lock(s)</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-body ${
                    Number(g.isOnline)
                      ? "text-success bg-success-soft border border-green-200"
                      : "text-error bg-error-soft border border-red-200"
                  }`}>
                    {Number(g.isOnline) ? "Online" : "Offline"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lock Time */}
      <div className="card-compact bg-card border border-border-card rounded-lg p-4 mt-4 sm:mt-6 shadow-card">
        <button onClick={() => setLockTimeExpanded(!lockTimeExpanded)} className="flex items-center justify-between w-full">
          <h2 className="text-base sm:text-lg font-heading font-semibold text-accent">Lock Time</h2>
          <span className="text-text-muted">{lockTimeExpanded ? "\u25B2" : "\u25BC"}</span>
        </button>
        {lockTimeExpanded && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-text-secondary font-body">
              {lockTime ? new Date(lockTime).toLocaleString() : "Unknown"}
            </p>
            <button onClick={handleAdjustTime} className="px-4 py-2 rounded bg-accent text-white text-sm hover:bg-accent-hover font-body">Adjust Time</button>
          </div>
        )}
      </div>

      {/* Unlock Records */}
      <div className="card-compact bg-card border border-border-card rounded-lg p-4 mt-4 sm:mt-6 shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button onClick={() => setRecordsExpanded(!recordsExpanded)} className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-heading font-semibold text-accent">Unlock Records ({recRes?.total ?? 0})</h2>
            <span className="text-text-muted">{recordsExpanded ? "\u25B2" : "\u25BC"}</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleClearRecords} className="text-error hover:text-error text-xs font-body">Clear All</button>
          </div>
        </div>
        {recordsExpanded && (
          <div className="mt-3 space-y-6">
            {renderRecordsList(
              records.filter((r) => r.success === 1),
              selectedSuccessRecords,
              (id) => toggleRecordSelection(id, true),
              successRecordsPage,
              setSuccessRecordsPage,
              true
            )}
            <div className="border-t border-border-card" />
            {renderRecordsList(
              records.filter((r) => r.success === 0),
              selectedFailedRecords,
              (id) => toggleRecordSelection(id, false),
              failedRecordsPage,
              setFailedRecordsPage,
              false
            )}
          </div>
        )}
      </div>

    </div>
  );
}
