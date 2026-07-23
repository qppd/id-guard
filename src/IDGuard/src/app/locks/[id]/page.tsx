"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

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
    isAuthenticated ? `/api/records?lockId=${lockId}` : null,
    fetcher
  );

  const { data: gwRes } = useSWR<{ ok: boolean; data: { list: Array<{ [key: string]: unknown }> } }>(
    isAuthenticated ? `/api/gateways` : null,
    fetcher,
    { refreshInterval: settings.refreshInterval > 0 ? settings.refreshInterval * 1000 : undefined }
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

  const { data: configRes, mutate: refreshConfig } = useSWR<{ ok: boolean; data: { [key: string]: unknown } }>(
    isAuthenticated ? `/api/locks/config?lockId=${lockId}` : null,
    fetcher
  );

  const { data: workingModeRes, mutate: refreshWorkingMode } = useSWR<{ ok: boolean; data: { workingMode: number; cyclicConfig?: string } }>(
    isAuthenticated ? `/api/locks/working-mode?lockId=${lockId}` : null,
    fetcher
  );

  const { data: passageModeRes, mutate: refreshPassageMode } = useSWR<{ ok: boolean; data: { passageMode: number; cyclicConfig?: string; autoUnlock?: number } }>(
    isAuthenticated ? `/api/locks/passage-mode?lockId=${lockId}` : null,
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
  const [configExpanded, setConfigExpanded] = useState(false);
  const [workingModeExpanded, setWorkingModeExpanded] = useState(false);
  const [passageModeExpanded, setPassageModeExpanded] = useState(false);
  const [lockTimeExpanded, setLockTimeExpanded] = useState(false);

  // Passcode form
  const [passForm, setPassForm] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [passType, setPassType] = useState(2);
  // IC card form
  const [icForm, setIcForm] = useState(false);
  const [icNumber, setIcNumber] = useState("");
  const [icName, setIcName] = useState("");
  // Fingerprint form
  const [fpForm, setFpForm] = useState(false);
  const [fpNumber, setFpNumber] = useState("");
  const [fpName, setFpName] = useState("");

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
  // Working mode config
  const [workingModeConfig, setWorkingModeConfig] = useState(1);
  // Passage mode config
  const [passageModeConfig, setPassageModeConfig] = useState(2);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) return <div className="min-h-[80vh] flex items-center justify-center"><p className="text-text-muted">Loading...</p></div>;
  if (!isAuthenticated) return null;

  const detail = detailRes?.data;
  const passcodes = passRes?.data ?? [];
  const gateways = gwRes?.data?.list ?? [];
  const records = recRes?.data ?? [];
  const gwById = gateways;
  const icCards = icRes?.data ?? [];
  const fingerprints = fpRes?.data ?? [];
  const battery = batteryRes?.data?.electricQuantity ?? detail?.electricQuantity;
  const openState = openStateRes?.data?.state;
  const workingMode = workingModeRes?.data?.workingMode;
  const passageMode = passageModeRes?.data?.passageMode;
  const lockTime = lockTimeRes?.data?.date;

  // Handlers
  const handleAddPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      const now = Date.now();
      // TTLock requires startDate for all types; Period type also needs endDate
      const startDate = now;
      const endDate = passType === 3 ? now + 365 * 24 * 60 * 60 * 1000 : undefined;
      const res = await fetch("/api/passcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", lockId, passcode: newPass, type: passType, startDate, endDate }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg("Passcode added!");
      setNewPass("");
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
      refreshPass();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
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

  const handleAddIc = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/ic-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", lockId, cardNumber: icNumber, cardName: icName }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg("IC Card added!");
      setIcNumber(""); setIcName("");
      setIcForm(false);
      refreshIc();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

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

  const handleAddFp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/fingerprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", lockId, fingerprintNumber: fpNumber, fingerprintName: fpName }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg("Fingerprint added!");
      setFpNumber(""); setFpName("");
      setFpForm(false);
      refreshFp();
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

  const handleConfigWorkingMode = async () => {
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/locks/working-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockId, workingMode: workingModeConfig, type: 2 }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg("Working mode updated!");
      refreshWorkingMode();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleConfigPassageMode = async () => {
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/locks/passage-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockId, passageMode: passageModeConfig, type: 2 }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg("Passage mode updated!");
      refreshPassageMode();
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

  const batteryColor = battery != null
    ? battery > 50 ? "text-success" : battery > 20 ? "text-warning" : "text-error"
    : "text-text-muted";

  const batteryBg = battery != null
    ? battery > 50 ? "bg-success-soft" : battery > 20 ? "bg-warning-soft" : "bg-error-soft"
    : "";

  const recordTypeLabel: { [key: number]: string } = {
    1: "Bluetooth Unlock",
    2: "Bluetooth Lock",
    3: "Bluetooth Open",
    4: "Passcode Unlock",
    5: "Passcode Lock",
    6: "IC Card",
    7: "IC Card",
    8: "Fingerprint",
    9: "Fingerprint",
    10: "Mechanical Key",
    11: "Mechanical Key",
    12: "App Unlock",
    13: "App Lock",
    14: "Gateway Unlock",
    15: "Gateway Lock",
    16: "Remote Unlock",
    17: "Remote Lock",
    22: "Passcode Error",
    26: "IC Card",
    28: "App Unlock",
    44: "Door Opened",
    48: "Door Closed",
    55: "Remote",
  };

  const workingModeLabel: { [key: number]: string } = {
    1: "All Day", 2: "Off", 3: "Custom",
  };

  const passageModeLabel: { [key: number]: string } = {
    1: "On", 2: "Off",
  };

  return (
    <div className="container-page py-4 sm:py-8">
      <button onClick={() => router.back()} className="text-link hover:text-accent text-sm mb-3 sm:mb-4 font-body">&larr; Back</button>

      {/* Lock Header */}
      <div className="card-compact bg-card border border-border-card rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-accent font-heading truncate">{detail?.lockName || `Lock #${lockId}`}</h1>
            {detail?.lockAlias && <p className="text-text-secondary text-sm mt-1 font-body truncate">{detail.lockAlias}</p>}
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
            <button onClick={() => { setPassForm(!passForm); setIcForm(false); setFpForm(false); }} className="px-3 py-1 rounded bg-accent text-white text-sm hover:bg-accent-hover transition-colors font-body">
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
              </select>
              <button type="submit" className="w-full py-1.5 rounded bg-accent text-white text-sm hover:bg-accent-hover font-body">Add Passcode</button>
            </form>
          )}

          {passcodes.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-4 font-body">No passcodes</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {passcodes.map((p) => (
                <div key={p.keyboardPwdId} className="flex items-center justify-between bg-alt rounded px-3 py-2">
                  <div>
                    <span className="text-foreground font-mono text-sm">{p.keyboardPwd}</span>
                    <span className="text-text-muted text-xs ml-2 font-body">
                      {p.keyboardPwdType === 2 ? "Permanent" : p.keyboardPwdType === 3 ? "Period" : p.keyboardPwdType === 1 ? "One-time" : `Type ${p.keyboardPwdType}`}
                    </span>
                  </div>
                  <button onClick={() => handleDelPass(p.keyboardPwdId)} className="text-error hover:text-error text-xs font-body">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IC Cards */}
        <div className="card-compact bg-card border border-border-card rounded-lg p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-heading font-semibold text-accent">IC Cards</h2>
            <button onClick={() => { setIcForm(!icForm); setPassForm(false); setFpForm(false); }} className="px-3 py-1 rounded bg-accent text-white text-sm hover:bg-accent-hover transition-colors font-body">
              {icForm ? "Cancel" : "+ Add"}
            </button>
          </div>

          {icForm && (
            <form onSubmit={handleAddIc} className="mb-4 p-3 bg-alt rounded space-y-2">
              <input type="text" placeholder="Card Number" value={icNumber} onChange={(e) => setIcNumber(e.target.value)} required className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
              <input type="text" placeholder="Card Name" value={icName} onChange={(e) => setIcName(e.target.value)} required className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
              <button type="submit" className="w-full py-1.5 rounded bg-accent text-white text-sm hover:bg-accent-hover font-body">Add IC Card</button>
            </form>
          )}

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
            <button onClick={() => { setFpForm(!fpForm); setPassForm(false); setIcForm(false); }} className="px-3 py-1 rounded bg-accent text-white text-sm hover:bg-accent-hover transition-colors font-body">
              {fpForm ? "Cancel" : "+ Add"}
            </button>
          </div>

          {fpForm && (
            <form onSubmit={handleAddFp} className="mb-4 p-3 bg-alt rounded space-y-2">
              <input type="text" placeholder="Fingerprint Number" value={fpNumber} onChange={(e) => setFpNumber(e.target.value)} required className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
              <input type="text" placeholder="Fingerprint Name" value={fpName} onChange={(e) => setFpName(e.target.value)} required className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
              <button type="submit" className="w-full py-1.5 rounded bg-accent text-white text-sm hover:bg-accent-hover font-body">Add Fingerprint</button>
            </form>
          )}

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
          {gwById.length === 0 ? (
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

      {/* Working Mode */}
      <div className="card-compact bg-card border border-border-card rounded-lg p-4 mt-4 sm:mt-6 shadow-card">
        <button onClick={() => setWorkingModeExpanded(!workingModeExpanded)} className="flex items-center justify-between w-full">
          <h2 className="text-base sm:text-lg font-heading font-semibold text-accent">Working Mode</h2>
          <span className="text-text-muted">{workingModeExpanded ? "\u25B2" : "\u25BC"}</span>
        </button>
        {workingModeExpanded && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-text-secondary font-body">Current: {workingMode != null ? workingModeLabel[workingMode] || `Mode ${workingMode}` : "Unknown"}</p>
            <div className="flex gap-2 items-center">
              <select value={workingModeConfig} onChange={(e) => setWorkingModeConfig(Number(e.target.value))} className="px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring">
                <option value={1}>All Day</option>
                <option value={2}>Off</option>
                <option value={3}>Custom</option>
              </select>
              <button onClick={handleConfigWorkingMode} className="px-4 py-2 rounded bg-accent text-white text-sm hover:bg-accent-hover font-body">Apply</button>
            </div>
          </div>
        )}
      </div>

      {/* Passage Mode */}
      <div className="card-compact bg-card border border-border-card rounded-lg p-4 mt-4 sm:mt-6 shadow-card">
        <button onClick={() => setPassageModeExpanded(!passageModeExpanded)} className="flex items-center justify-between w-full">
          <h2 className="text-base sm:text-lg font-heading font-semibold text-accent">Passage Mode</h2>
          <span className="text-text-muted">{passageModeExpanded ? "\u25B2" : "\u25BC"}</span>
        </button>
        {passageModeExpanded && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-text-secondary font-body">Current: {passageMode != null ? passageModeLabel[passageMode] || `Mode ${passageMode}` : "Unknown"}</p>
            <div className="flex gap-2 items-center">
              <select value={passageModeConfig} onChange={(e) => setPassageModeConfig(Number(e.target.value))} className="px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring">
                <option value={1}>On</option>
                <option value={2}>Off</option>
              </select>
              <button onClick={handleConfigPassageMode} className="px-4 py-2 rounded bg-accent text-white text-sm hover:bg-accent-hover font-body">Apply</button>
            </div>
          </div>
        )}
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
        <div className="flex items-center justify-between">
          <button onClick={() => setRecordsExpanded(!recordsExpanded)} className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-heading font-semibold text-accent">Unlock Records ({recRes?.total ?? 0})</h2>
            <span className="text-text-muted">{recordsExpanded ? "\u25B2" : "\u25BC"}</span>
          </button>
          <button onClick={handleClearRecords} className="text-error hover:text-error text-xs font-body">Clear All</button>
        </div>
        {recordsExpanded && (
          <div className="mt-3 space-y-1 max-h-96 overflow-y-auto">
            {records.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-4 font-body">No records</p>
            ) : (
              records.map((r) => (
                <div key={r.recordId} className="flex items-center justify-between bg-alt rounded px-3 py-2 text-sm">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
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
        )}
      </div>

      {/* Lock Config */}
      <div className="card-compact bg-card border border-border-card rounded-lg p-4 mt-4 sm:mt-6 shadow-card">
        <button onClick={() => setConfigExpanded(!configExpanded)} className="flex items-center justify-between w-full">
          <h2 className="text-base sm:text-lg font-heading font-semibold text-accent">Lock Config</h2>
          <span className="text-text-muted">{configExpanded ? "\u25B2" : "\u25BC"}</span>
        </button>
        {configExpanded && configRes?.data && (
          <div className="mt-3 space-y-1">
            {Object.entries(configRes.data).filter(([k]) => k !== "errcode").map(([key, val]) => (
              <div key={key} className="flex items-center justify-between bg-alt rounded px-3 py-1.5 text-sm">
                <span className="text-text-muted font-body">{key}</span>
                <span className="text-foreground font-body">{String(val)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
