"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface KeyData {
  keyId: number;
  lockId: number;
  lockName?: string;
  lockAlias?: string;
  keyName?: string;
  userType?: string;
  keyStatus?: string;
  remoteEnable?: number;
  keyRight?: number;
  startDate?: number;
  endDate?: number;
  date?: number;
  username?: string;
  senderUsername?: string;
  electricQuantity?: number;
  remarks?: string;
  lockMac?: string;
  featureValue?: string;
  hasGateway?: number;
  noKeyPwd?: string;
  passageMode?: number;
  groupName?: string;
  [key: string]: unknown;
}

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
}

interface PeriodValues {
  startDate: string;
  endDate: string;
}

interface UnlockLinkData {
  link?: string;
  unlockLink?: string;
}

function toDateTimeLocal(timestamp?: number) {
  if (!timestamp || timestamp <= 0) return "";
  const date = new Date(timestamp);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function fmtTs(ts?: number): string {
  if (!ts || ts <= 0) return "";
  return new Date(ts).toLocaleString();
}

function fmtDateShort(ts?: number): string {
  if (!ts || ts <= 0) return "";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function KeysPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { settings } = useTheme();
  const router = useRouter();

  const [filterLockId, setFilterLockId] = useState("");
  const [activeLockId, setActiveLockId] = useState("");
  const keysUrl = activeLockId
    ? `/api/keys/list-by-lock?lockId=${encodeURIComponent(activeLockId)}`
    : "/api/keys";

  const { data, error, mutate, isLoading } = useSWR<ApiResponse<KeyData[]>>(
    isAuthenticated ? keysUrl : null,
    fetcher,
    { refreshInterval: settings.refreshInterval > 0 ? settings.refreshInterval * 1000 : undefined }
  );

  // Send key form
  const [showForm, setShowForm] = useState(false);
  const [lockId, setLockId] = useState("");
  const [receiver, setReceiver] = useState("");
  const [keyName, setKeyName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [createUser, setCreateUser] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  // Per-key action state
  const [periodKeyId, setPeriodKeyId] = useState<number | null>(null);
  const [periodValues, setPeriodValues] = useState<PeriodValues>({ startDate: "", endDate: "" });
  const [busyAction, setBusyAction] = useState("");
  const [actionErrors, setActionErrors] = useState<{ [key: number]: string }>({});
  const [unlockLinks, setUnlockLinks] = useState<{ [key: number]: string }>({});
  const [remoteToggles, setRemoteToggles] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const setKeyError = useCallback((keyId: number, message: string) => {
    setActionErrors((current) => ({ ...current, [keyId]: message }));
  }, []);

  const useCompactBtn = "px-2 py-1.5 sm:py-1 rounded text-xs transition-colors font-body disabled:opacity-50 disabled:cursor-not-allowed";
  const btnPrimary = `${useCompactBtn} bg-accent text-white hover:bg-accent-hover`;
  const btnDanger = `${useCompactBtn} bg-error-soft text-error hover:bg-red-100 border border-red-200`;
  const btnWarning = `${useCompactBtn} bg-warning-soft text-warning hover:bg-yellow-100 border border-yellow-200`;
  const btnSuccess = `${useCompactBtn} bg-success-soft text-success hover:bg-green-100 border border-green-200`;
  const btnNeutral = `${useCompactBtn} bg-alt text-text-secondary hover:text-foreground border border-border-card`;
  const btnAccent = `${useCompactBtn} bg-alt text-accent hover:bg-accent-bg border border-border-card`;

  // --- Send Key ---
  const handleSendKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendError("");

    const sd = startDate ? new Date(startDate).getTime() : Date.now();
    const ed = endDate
      ? new Date(endDate).getTime()
      : Date.now() + 365 * 24 * 60 * 60 * 1000;

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          lockId: parseInt(lockId, 10),
          receiverUsername: receiver,
          keyName: keyName || `Key for ${receiver}`,
          startDate: sd,
          endDate: ed,
          createUser: createUser ? 1 : undefined,
        }),
      });
      const result: ApiResponse<unknown> = await res.json();
      if (!result.ok) throw new Error(result.error || "Failed to send key");
      setShowForm(false);
      setLockId("");
      setReceiver("");
      setKeyName("");
      setStartDate("");
      setEndDate("");
      setCreateUser(false);
      await mutate();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send key");
    } finally {
      setSending(false);
    }
  };

  // --- Freeze / Unfreeze / Delete ---
  const handleKeyAction = async (key: KeyData, action: "freeze" | "unfreeze" | "delete") => {
    const actionId = `${key.keyId}-${action}`;
    setBusyAction(actionId);
    setKeyError(key.keyId, "");

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, keyId: key.keyId, lockId: key.lockId }),
      });
      const result: ApiResponse<unknown> = await res.json();
      if (!result.ok) throw new Error(result.error || "Action failed");
      await mutate();
    } catch (err) {
      setKeyError(key.keyId, err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyAction("");
    }
  };

  // --- Authorize / Unauthorize ---
  const handleAuthorize = async (key: KeyData, action: "authorize" | "unauthorize") => {
    const actionId = `${key.keyId}-${action}`;
    setBusyAction(actionId);
    setKeyError(key.keyId, "");

    try {
      const res = await fetch(action === "authorize" ? "/api/keys/authorize" : "/api/keys/unauthorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId: key.keyId, lockId: key.lockId }),
      });
      const result: ApiResponse<unknown> = await res.json();
      if (!result.ok) throw new Error(result.error || "Action failed");
      await mutate();
    } catch (err) {
      setKeyError(key.keyId, err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyAction("");
    }
  };

  // --- Change Period ---
  const openPeriodForm = (key: KeyData) => {
    if (periodKeyId === key.keyId) {
      setPeriodKeyId(null);
      return;
    }
    setKeyError(key.keyId, "");
    setPeriodValues({
      startDate: toDateTimeLocal(key.startDate),
      endDate: toDateTimeLocal(key.endDate),
    });
    setPeriodKeyId(key.keyId);
  };

  const handleChangePeriod = async (e: React.FormEvent, key: KeyData) => {
    e.preventDefault();
    const s = new Date(periodValues.startDate).getTime();
    const en = new Date(periodValues.endDate).getTime();

    if (!Number.isFinite(s) || !Number.isFinite(en)) {
      setKeyError(key.keyId, "Enter valid start and end dates.");
      return;
    }

    const actionId = `${key.keyId}-changePeriod`;
    setBusyAction(actionId);
    setKeyError(key.keyId, "");

    try {
      const res = await fetch("/api/keys/period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId: key.keyId, startDate: s, endDate: en }),
      });
      const result: ApiResponse<unknown> = await res.json();
      if (!result.ok) throw new Error(result.error || "Failed to change period");
      setPeriodKeyId(null);
      await mutate();
    } catch (err) {
      setKeyError(key.keyId, err instanceof Error ? err.message : "Failed to change period");
    } finally {
      setBusyAction("");
    }
  };

  // --- Unlock Link ---
  const handleGetLink = async (keyId: number) => {
    const actionId = `${keyId}-getUnlockLink`;
    setBusyAction(actionId);
    setKeyError(keyId, "");

    try {
      const res = await fetch("/api/keys/unlock-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      const result: ApiResponse<UnlockLinkData | string> = await res.json();
      if (!result.ok) throw new Error(result.error || "Failed to get unlock link");
      const link =
        typeof result.data === "string"
          ? result.data
          : result.data?.link || result.data?.unlockLink;
      if (!link) throw new Error("No unlock link returned");
      setUnlockLinks((cur) => ({ ...cur, [keyId]: link }));
    } catch (err) {
      setKeyError(keyId, err instanceof Error ? err.message : "Failed to get unlock link");
    } finally {
      setBusyAction("");
    }
  };

  // --- Remote Enable Toggle ---
  const handleToggleRemote = async (key: KeyData) => {
    const newVal = remoteToggles[key.keyId] !== undefined
      ? !remoteToggles[key.keyId]
      : key.remoteEnable !== 1;
    const toggleId = `${key.keyId}-remote`;
    setBusyAction(toggleId);
    setKeyError(key.keyId, "");

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          keyId: key.keyId,
          remoteEnable: newVal ? 1 : 2,
        }),
      });
      const result: ApiResponse<unknown> = await res.json();
      if (!result.ok) throw new Error(result.error || "Failed to update remote unlock");
      setRemoteToggles((cur) => ({ ...cur, [key.keyId]: newVal }));

      // If turning remote ON, auto-fetch the unlock link
      if (newVal && !unlockLinks[key.keyId]) {
        const linkRes = await fetch("/api/keys/unlock-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyId: key.keyId }),
        });
        const linkData: ApiResponse<UnlockLinkData | string> = await linkRes.json();
        if (linkData.ok) {
          const link = typeof linkData.data === "string"
            ? linkData.data
            : linkData.data?.link || linkData.data?.unlockLink;
          if (link) setUnlockLinks((cur) => ({ ...cur, [key.keyId]: link }));
        }
      } else {
        // If turning remote OFF, clear the cached link
        setUnlockLinks((cur) => {
          const next = { ...cur };
          delete next[key.keyId];
          return next;
        });
      }

      await mutate();
    } catch (err) {
      setKeyError(key.keyId, err instanceof Error ? err.message : "Failed to toggle remote unlock");
    } finally {
      setBusyAction("");
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
  };

  // --- Filter ---
  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedLockId = filterLockId.trim();
    if (!normalizedLockId) return;
    setActiveLockId(normalizedLockId);
  };

  const showAllKeys = () => {
    setActiveLockId("");
    setFilterLockId("");
  };

  // --- Loading / Auth ---
  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const keys = data?.ok ? data.data ?? [] : [];
  const loadError =
    error instanceof Error
      ? error.message
      : data && !data.ok
        ? data.error || "Failed to load keys"
        : "";

  return (
    <div className="container-page py-4 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-accent font-heading">eKeys</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 font-body">
            {activeLockId ? `Keys for Lock #${activeLockId}` : "All Keys"} · {keys.length} digital key{keys.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded bg-accent text-white text-sm hover:bg-accent-hover transition-colors font-body shrink-0"
        >
          {showForm ? "Cancel" : "Share Key"}
        </button>
      </div>

      {/* Filter */}
      <form onSubmit={handleFilter} className="card-compact bg-card border border-border-card rounded-lg p-3 sm:p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-2 shadow-card">
        <label htmlFor="key-lock-filter" className="text-sm text-foreground font-heading font-semibold sm:mr-1">
          List keys by lock
        </label>
        <input
          id="key-lock-filter"
          type="number"
          min="1"
          placeholder="Lock ID"
          value={filterLockId}
          onChange={(e) => setFilterLockId(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm placeholder-text-muted focus:outline-none focus:border-focus-ring"
        />
        <button type="submit" disabled={!filterLockId.trim()} className="px-3 py-2 rounded bg-accent text-white text-xs hover:bg-accent-hover disabled:opacity-50 transition-colors font-body">
          Filter
        </button>
        <button type="button" onClick={showAllKeys} disabled={!activeLockId} className="px-3 py-2 rounded bg-alt border border-border-card text-text-secondary text-xs hover:text-foreground disabled:opacity-50 transition-colors font-body">
          All Keys
        </button>
      </form>

      {/* Share Key Form */}
      {showForm && (
        <form onSubmit={handleSendKey} className="card-compact bg-card border border-border-card rounded-lg p-4 mb-4 sm:mb-6 space-y-3 shadow-card">
          <h3 className="text-accent font-heading font-semibold text-sm">Share eKey</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="number" placeholder="Lock ID" value={lockId} onChange={(e) => setLockId(e.target.value)} className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm placeholder-text-muted focus:outline-none focus:border-focus-ring" required />
            <input type="text" placeholder="Recipient email / TTLock username" value={receiver} onChange={(e) => setReceiver(e.target.value)} className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm placeholder-text-muted focus:outline-none focus:border-focus-ring" required />
            <input type="text" placeholder="Key name (e.g. Key for Juan)" value={keyName} onChange={(e) => setKeyName(e.target.value)} className="w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm placeholder-text-muted focus:outline-none focus:border-focus-ring" />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-text-secondary font-body">
                Valid from
                <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
              </label>
              <label className="text-xs text-text-secondary font-body">
                Valid until
                <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring" />
              </label>
            </div>
          </div>
          {sendError && <p className="text-error text-xs">{sendError}</p>}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-body">
              <span className="text-text-secondary">Auto-create account if unregistered</span>
              <button
                type="button"
                onClick={() => setCreateUser(!createUser)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  createUser ? "bg-accent" : "bg-border-card"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  createUser ? "translate-x-[18px]" : "translate-x-[3px]"
                }`} />
              </button>
            </label>
            <button type="submit" disabled={sending} className="px-4 py-1.5 rounded bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50 transition-colors font-body">
              {sending ? "Sending..." : "Send Key"}
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12"><p className="text-text-muted">Loading keys...</p></div>
      )}

      {/* Error */}
      {loadError && (
        <div className="bg-error-soft border border-red-200 rounded-lg p-4 text-sm text-error mb-6">{loadError}</div>
      )}

      {!isLoading && !loadError && keys.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-secondary font-body">
            {activeLockId ? `No keys found for Lock #${activeLockId}` : "No keys found"}
          </p>
        </div>
      )}

      {/* Key Cards */}
      <div className="space-y-3 sm:space-y-4">
        {keys.map((key) => {
          const isAdmin = key.userType === "110301";
          const isActive = key.keyStatus === "110401";
          const remoteOn = remoteToggles[key.keyId] !== undefined ? remoteToggles[key.keyId] : key.remoteEnable === 1;
          const lockLabel = key.lockAlias || key.lockName || `Lock #${key.lockId}`;
          const hasLink = !!unlockLinks[key.keyId];
          const isPeriodOpen = periodKeyId === key.keyId;

          return (
            <div
              key={key.keyId}
              className="card-compact bg-card border border-border-card rounded-lg p-3 sm:p-4 shadow-card"
            >
              {/* Header row: lock name + badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <p className="text-accent text-sm sm:text-base font-heading font-semibold truncate flex-1 min-w-0">
                  {lockLabel}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {isAdmin ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-bg text-accent border border-accent/30 font-semibold">Admin</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-alt text-text-secondary border border-border-card font-semibold">User</span>
                  )}
                  {isActive ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success border border-green-200 font-semibold">Active</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-soft text-warning border border-yellow-200 font-semibold">Frozen</span>
                  )}
                  {remoteOn && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-alt text-accent border border-accent/30 font-semibold">Remote</span>
                  )}
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3 text-xs">
                <div className="min-w-0">
                  <span className="text-text-muted block">Key Name</span>
                  <span className="text-foreground font-medium truncate block">{String(key.keyName ?? key.lockAlias ?? "") || "—"}</span>
                </div>
                {key.username && (
                  <div className="min-w-0">
                    <span className="text-text-muted block">Receiver</span>
                    <span className="text-foreground font-medium truncate block">{key.username}</span>
                  </div>
                )}
                {key.senderUsername && (
                  <div className="min-w-0">
                    <span className="text-text-muted block">Issued By</span>
                    <span className="text-foreground font-medium truncate block">{key.senderUsername}</span>
                  </div>
                )}
                {key.date && key.date > 0 && (
                  <div className="min-w-0">
                    <span className="text-text-muted block">Sent</span>
                    <span className="text-foreground font-medium truncate block">{fmtDateShort(key.date)}</span>
                  </div>
                )}
                {key.startDate != null && key.startDate > 0 && (
                  <div className="min-w-0">
                    <span className="text-text-muted block">Valid From</span>
                    <span className="text-foreground font-medium truncate block">{fmtDateShort(key.startDate)}</span>
                  </div>
                )}
                {key.endDate != null && key.endDate > 0 && (
                  <div className="min-w-0">
                    <span className="text-text-muted block">Valid Until</span>
                    <span className="text-foreground font-medium truncate block">{fmtDateShort(key.endDate)}</span>
                  </div>
                )}
                {!key.username && !key.senderUsername && (!key.date || key.date <= 0) && (
                  <div className="min-w-0 col-span-2">
                    <span className="text-text-muted text-[11px]">Lock ID: {key.lockId}</span>
                  </div>
                )}
              </div>

              {/* Toggle switches row */}
              <div className="flex flex-wrap items-center gap-4 mb-3 py-2 px-3 bg-alt/50 rounded-lg border border-border-card">
                {/* keyRight Toggle: Manage their own users */}
                <label className="flex items-center gap-2 cursor-pointer text-xs font-body">
                  <span className="text-text-secondary">Manage own users</span>
                  <button
                    onClick={() => handleAuthorize(key, key.keyRight === 1 ? "unauthorize" : "authorize")}
                    disabled={Boolean(busyAction)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      key.keyRight === 1 ? "bg-success" : "bg-border-card"
                    } ${busyAction?.startsWith(`${key.keyId}-`) ? "opacity-50" : ""}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      key.keyRight === 1 ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`} />
                  </button>
                </label>

                {/* remoteEnable Toggle: Unlock Link */}
                <label className="flex items-center gap-2 cursor-pointer text-xs font-body">
                  <span className="text-text-secondary">Unlock Link</span>
                  <button
                    onClick={() => handleToggleRemote(key)}
                    disabled={Boolean(busyAction)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      remoteOn ? "bg-success" : "bg-border-card"
                    } ${busyAction?.startsWith(`${key.keyId}-remote`) ? "opacity-50" : ""}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      remoteOn ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`} />
                  </button>
                </label>

                {/* Unlock link display when toggled on or previously fetched */}
                {remoteOn && (
                  <div className="flex-1 min-w-0 max-w-sm flex items-center gap-1.5">
                    {hasLink ? (
                      <>
                        <input
                          type="text"
                          readOnly
                          value={unlockLinks[key.keyId]}
                          onFocus={(e) => e.currentTarget.select()}
                          className="flex-1 min-w-0 px-2 py-1 rounded bg-card border border-border-card text-foreground text-[11px] focus:outline-none focus:border-focus-ring"
                        />
                        <button
                          onClick={() => handleCopyLink(unlockLinks[key.keyId])}
                          className={`${useCompactBtn} bg-alt text-accent hover:bg-accent-bg border border-border-card shrink-0 text-[11px]`}
                        >
                          Copy
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleGetLink(key.keyId)}
                        disabled={Boolean(busyAction)}
                        className={`${useCompactBtn} bg-alt text-accent hover:bg-accent-bg border border-border-card shrink-0 text-[11px]`}
                      >
                        {busyAction === `${key.keyId}-getUnlockLink` ? "Loading..." : "Get Link"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Actions row */}
              <div className="flex flex-wrap items-center gap-1.5">
                {isActive ? (
                  <button onClick={() => handleKeyAction(key, "freeze")} disabled={Boolean(busyAction)} className={btnWarning}>
                    {busyAction === `${key.keyId}-freeze` ? "Freezing..." : "Freeze"}
                  </button>
                ) : (
                  <button onClick={() => handleKeyAction(key, "unfreeze")} disabled={Boolean(busyAction)} className={btnSuccess}>
                    {busyAction === `${key.keyId}-unfreeze` ? "Unfreezing..." : "Unfreeze"}
                  </button>
                )}
                <button onClick={() => openPeriodForm(key)} disabled={Boolean(busyAction)} className={isPeriodOpen ? btnDanger : btnNeutral}>
                  {isPeriodOpen ? "Cancel" : "Change Period"}
                </button>
                <button onClick={() => handleGetLink(key.keyId)} disabled={Boolean(busyAction)} className={btnAccent}>
                  {busyAction === `${key.keyId}-getUnlockLink` ? "Getting..." : hasLink ? "Refresh Link" : "Get Link"}
                </button>
                <button onClick={() => handleKeyAction(key, "delete")} disabled={Boolean(busyAction)} className={btnDanger}>
                  {busyAction === `${key.keyId}-delete` ? "Deleting..." : "Delete"}
                </button>
              </div>

              {/* Period form */}
              {isPeriodOpen && (
                <form onSubmit={(e) => handleChangePeriod(e, key)} className="mt-3 pt-3 border-t border-border-card flex flex-col sm:flex-row sm:items-end gap-2">
                  <label className="flex-1 text-xs text-text-secondary font-body">
                    Start
                    <input
                      type="datetime-local"
                      value={periodValues.startDate}
                      onChange={(e) => setPeriodValues((cur) => ({ ...cur, startDate: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring"
                      required
                    />
                  </label>
                  <label className="flex-1 text-xs text-text-secondary font-body">
                    End
                    <input
                      type="datetime-local"
                      value={periodValues.endDate}
                      onChange={(e) => setPeriodValues((cur) => ({ ...cur, endDate: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring"
                      required
                    />
                  </label>
                  <button type="submit" disabled={Boolean(busyAction)} className="px-3 py-2 rounded bg-accent text-white text-xs hover:bg-accent-hover disabled:opacity-50 transition-colors font-body">
                    {busyAction === `${key.keyId}-changePeriod` ? "Saving..." : "Save"}
                  </button>
                </form>
              )}

              {/* Action error */}
              {actionErrors[key.keyId] && (
                <p className="mt-2 text-error text-xs font-body">{actionErrors[key.keyId]}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
