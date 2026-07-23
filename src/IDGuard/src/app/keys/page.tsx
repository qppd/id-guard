"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  startDate?: number;
  endDate?: number;
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

type KeyAction = "delete" | "freeze" | "unfreeze";

function toDateTimeLocal(timestamp?: number) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
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
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  // Per-key action state
  const [periodKeyId, setPeriodKeyId] = useState<number | null>(null);
  const [periodValues, setPeriodValues] = useState<PeriodValues>({ startDate: "", endDate: "" });
  const [busyAction, setBusyAction] = useState("");
  const [actionErrors, setActionErrors] = useState<{ [key: number]: string }>({});
  const [unlockLinks, setUnlockLinks] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSendKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendError("");

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          lockId: parseInt(lockId, 10),
          receiverUsername: receiver,
          keyName,
        }),
      });
      const result: ApiResponse<unknown> = await res.json();
      if (!result.ok) throw new Error(result.error || "Failed to send key");
      setShowForm(false);
      setLockId("");
      setReceiver("");
      setKeyName("");
      await mutate();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send key");
    } finally {
      setSending(false);
    }
  };

  const setKeyError = (keyId: number, message: string) => {
    setActionErrors((current) => ({ ...current, [keyId]: message }));
  };

  const handleKeyAction = async (key: KeyData, action: KeyAction) => {
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
    const startDate = new Date(periodValues.startDate).getTime();
    const endDate = new Date(periodValues.endDate).getTime();

    if (!Number.isFinite(startDate) || !Number.isFinite(endDate)) {
      setKeyError(key.keyId, "Enter a valid start and end date.");
      return;
    }
    if (endDate <= startDate) {
      setKeyError(key.keyId, "End date must be after the start date.");
      return;
    }

    const actionId = `${key.keyId}-changePeriod`;
    setBusyAction(actionId);
    setKeyError(key.keyId, "");

    try {
      const res = await fetch("/api/keys/period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId: key.keyId, startDate, endDate }),
      });
      const result: ApiResponse<unknown> = await res.json();
      if (!result.ok) throw new Error(result.error || "Failed to change valid period");
      setPeriodKeyId(null);
      await mutate();
    } catch (err) {
      setKeyError(key.keyId, err instanceof Error ? err.message : "Failed to change valid period");
    } finally {
      setBusyAction("");
    }
  };

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
      const link = typeof result.data === "string"
        ? result.data
        : result.data?.link || result.data?.unlockLink;
      if (!link) throw new Error("The API did not return an unlock link");
      setUnlockLinks((current) => ({ ...current, [keyId]: link }));
    } catch (err) {
      setKeyError(keyId, err instanceof Error ? err.message : "Failed to get unlock link");
    } finally {
      setBusyAction("");
    }
  };

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

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const keys = data?.ok ? data.data ?? [] : [];
  const loadError = error instanceof Error
    ? error.message
    : data && !data.ok
      ? data.error || "Failed to load keys"
      : "";

  const compactButton = "px-2 py-1.5 sm:py-1 rounded text-xs transition-colors font-body disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="container-page py-4 sm:py-8">
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
        <button
          type="submit"
          disabled={!filterLockId.trim()}
          className="px-3 py-2 rounded bg-accent text-white text-xs hover:bg-accent-hover disabled:opacity-50 transition-colors font-body"
        >
          Filter
        </button>
        <button
          type="button"
          onClick={showAllKeys}
          disabled={!activeLockId}
          className="px-3 py-2 rounded bg-alt border border-border-card text-text-secondary text-xs hover:text-foreground disabled:opacity-50 transition-colors font-body"
        >
          All Keys
        </button>
      </form>

      {showForm && (
        <form onSubmit={handleSendKey} className="card-compact bg-card border border-border-card rounded-lg p-4 mb-4 sm:mb-6 space-y-3 shadow-card">
          <h3 className="text-accent font-heading font-semibold text-sm">Share eKey</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="number"
              placeholder="Lock ID"
              value={lockId}
              onChange={(e) => setLockId(e.target.value)}
              className="w-full sm:w-1/3 px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm placeholder-text-muted focus:outline-none focus:border-focus-ring"
              required
            />
            <input
              type="text"
              placeholder="Recipient username/email"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              className="w-full sm:w-1/3 px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm placeholder-text-muted focus:outline-none focus:border-focus-ring"
              required
            />
            <input
              type="text"
              placeholder="Key name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="w-full sm:w-1/3 px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm placeholder-text-muted focus:outline-none focus:border-focus-ring"
            />
          </div>
          {sendError && <p className="text-error text-xs">{sendError}</p>}
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-1.5 rounded bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50 transition-colors font-body"
          >
            {sending ? "Sending..." : "Send Key"}
          </button>
        </form>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-text-muted">Loading keys...</p>
        </div>
      )}

      {loadError && (
        <div className="bg-error-soft border border-red-200 rounded-lg p-4 text-sm text-error mb-6">
          {loadError}
        </div>
      )}

      {!isLoading && !loadError && keys.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-secondary font-body">
            {activeLockId ? `No keys found for Lock #${activeLockId}` : "No keys found"}
          </p>
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        {keys.map((key) => (
          <div
            key={key.keyId}
            className="card-compact bg-card border border-border-card rounded-lg p-3 sm:p-4 shadow-card"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-accent text-sm font-heading font-semibold truncate">
                  {key.lockAlias || key.keyName || key.lockName || `Lock #${key.lockId}`}
                </p>
                <p className="text-text-muted text-xs mt-0.5 font-body">
                  Key ID: {key.keyId} · Type: {key.userType === "110301" ? "Admin" : "User"}
                  {key.keyStatus && key.keyStatus !== "110401" ? " · Frozen" : ""}
                  {key.remoteEnable === 1 ? " · Remote" : ""}
                </p>
                {(key.startDate || key.endDate) && (
                  <div className="text-xs text-text-muted mt-1 font-body">
                    {key.startDate && <span>From: {new Date(key.startDate).toLocaleString()}</span>}
                    {key.startDate && key.endDate && <span> · </span>}
                    {key.endDate && <span>Until: {new Date(key.endDate).toLocaleString()}</span>}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => handleKeyAction(key, "freeze")}
                  disabled={Boolean(busyAction)}
                  className={`${compactButton} bg-warning-soft text-warning hover:bg-yellow-100 border border-yellow-200`}
                >
                  {busyAction === `${key.keyId}-freeze` ? "Freezing..." : "Freeze"}
                </button>
                <button
                  onClick={() => handleKeyAction(key, "unfreeze")}
                  disabled={Boolean(busyAction)}
                  className={`${compactButton} bg-success-soft text-success hover:bg-green-100 border border-green-200`}
                >
                  {busyAction === `${key.keyId}-unfreeze` ? "Unfreezing..." : "Unfreeze"}
                </button>
                <button
                  onClick={() => openPeriodForm(key)}
                  disabled={Boolean(busyAction)}
                  className={`${compactButton} bg-alt text-text-secondary hover:text-foreground border border-border-card`}
                >
                  {periodKeyId === key.keyId ? "Cancel Period" : "Change Period"}
                </button>
                <button
                  onClick={() => handleAuthorize(key, "authorize")}
                  disabled={Boolean(busyAction)}
                  className={`${compactButton} bg-success-soft text-success hover:bg-green-100 border border-green-200`}
                >
                  {busyAction === `${key.keyId}-authorize` ? "Authorizing..." : "Authorize"}
                </button>
                <button
                  onClick={() => handleAuthorize(key, "unauthorize")}
                  disabled={Boolean(busyAction)}
                  className={`${compactButton} bg-warning-soft text-warning hover:bg-yellow-100 border border-yellow-200`}
                >
                  {busyAction === `${key.keyId}-unauthorize` ? "Unauthorizing..." : "Unauthorize"}
                </button>
                <button
                  onClick={() => handleGetLink(key.keyId)}
                  disabled={Boolean(busyAction)}
                  className={`${compactButton} bg-alt text-accent hover:bg-accent-bg border border-border-card`}
                >
                  {busyAction === `${key.keyId}-getUnlockLink` ? "Getting..." : "Get Link"}
                </button>
                <button
                  onClick={() => handleKeyAction(key, "delete")}
                  disabled={Boolean(busyAction)}
                  className={`${compactButton} bg-error-soft text-error hover:bg-red-100 border border-red-200`}
                >
                  {busyAction === `${key.keyId}-delete` ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>

            {periodKeyId === key.keyId && (
              <form onSubmit={(e) => handleChangePeriod(e, key)} className="mt-3 pt-3 border-t border-border-card flex flex-col sm:flex-row sm:items-end gap-2">
                <label className="flex-1 text-xs text-text-secondary font-body">
                  Start date
                  <input
                    type="datetime-local"
                    value={periodValues.startDate}
                    onChange={(e) => setPeriodValues((current) => ({ ...current, startDate: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring"
                    required
                  />
                </label>
                <label className="flex-1 text-xs text-text-secondary font-body">
                  End date
                  <input
                    type="datetime-local"
                    value={periodValues.endDate}
                    onChange={(e) => setPeriodValues((current) => ({ ...current, endDate: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm focus:outline-none focus:border-focus-ring"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={Boolean(busyAction)}
                  className="px-3 py-2 rounded bg-accent text-white text-xs hover:bg-accent-hover disabled:opacity-50 transition-colors font-body"
                >
                  {busyAction === `${key.keyId}-changePeriod` ? "Saving..." : "Save Period"}
                </button>
              </form>
            )}

            {unlockLinks[key.keyId] && (
              <div className="mt-3 pt-3 border-t border-border-card">
                <label className="block text-xs text-text-secondary font-body mb-1" htmlFor={`unlock-link-${key.keyId}`}>
                  Unlock link
                </label>
                <div className="flex gap-2">
                  <input
                    id={`unlock-link-${key.keyId}`}
                    type="text"
                    readOnly
                    value={unlockLinks[key.keyId]}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 px-3 py-2 rounded bg-alt border border-border-card text-foreground text-xs focus:outline-none focus:border-focus-ring"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(unlockLinks[key.keyId])}
                    className={`${compactButton} bg-alt text-accent hover:bg-accent-bg border border-border-card shrink-0`}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {actionErrors[key.keyId] && (
              <p className="mt-2 text-error text-xs font-body">{actionErrors[key.keyId]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
