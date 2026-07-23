"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Gateway {
  gatewayId: number;
  gatewayName: string;
  gatewayMac: string;
  gatewayVersion: number;
  isOnline: number;
  lockNum: number;
  rssi?: number;
}

interface GatewayDetail {
  [key: string]: unknown;
}

interface GatewayLock {
  lockId: number;
  lockName: string;
  lockAlias: string;
  rssi?: number;
  [key: string]: unknown;
}

interface GatewayDevice {
  deviceType: string;
  deviceId: number;
  deviceName: string;
  deviceAlias: string;
  rssi?: number;
  [key: string]: unknown;
}

interface UpgradeCheck {
  needUpgrade: number;
  firmwareInfo?: string;
  version?: string;
  [key: string]: unknown;
}

type ActionState = { loading: boolean; error: string; success: string; data?: unknown };

const initialAction: ActionState = { loading: false, error: "", success: "" };

export default function GatewaysPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { settings } = useTheme();
  const router = useRouter();

  const { data, error, isLoading, mutate } = useSWR<{ ok: boolean; data: Gateway[] }>(
    isAuthenticated ? "/api/gateways" : null,
    fetcher,
    { refreshInterval: settings.refreshInterval > 0 ? settings.refreshInterval * 1000 : 15000 }
  );

  // Per-gateway UI state maps (keyed by gatewayId)
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showSection, setShowSection] = useState<{ [id: number]: "detail" | "locks" | "devices" | "upgrade" | null }>({});
  const [renameForm, setRenameForm] = useState<{ [id: number]: { open: boolean; value: string } }>({});
  const [transferForm, setTransferForm] = useState<{ [id: number]: { open: boolean; value: string } }>({});
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [actionState, setActionState] = useState<{ [id: number]: { [k: string]: ActionState } }>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) return <div className="min-h-[80vh] flex items-center justify-center"><p className="text-text-muted">Loading...</p></div>;
  if (!isAuthenticated) return null;

  const gateways = data?.data ?? [];

  // Helper: get/set action state for a gateway+action
  const getAction = (id: number, key: string): ActionState =>
    actionState[id]?.[key] ?? initialAction;
  const setAction = (id: number, key: string, patch: Partial<ActionState>) =>
    setActionState((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: { ...getAction(id, key), ...patch } },
    }));

  // Detail / Locks / Devices / Upgrade fetch via useSWR-like inline fetch
  const loadSection = async (gw: Gateway, section: "detail" | "locks" | "devices" | "upgrade") => {
    const current = showSection[gw.gatewayId];
    if (current === section) {
      setShowSection({ ...showSection, [gw.gatewayId]: null });
      setExpandedId(expandedId === gw.gatewayId && !current ? gw.gatewayId : null);
      return;
    }
    setShowSection({ ...showSection, [gw.gatewayId]: section });
    setExpandedId(gw.gatewayId);

    const url =
      section === "detail" ? `/api/gateways/detail?gatewayId=${gw.gatewayId}` :
      section === "locks" ? `/api/gateways/locks?gatewayId=${gw.gatewayId}` :
      section === "devices" ? `/api/gateways/devices?gatewayId=${gw.gatewayId}` :
      `/api/gateways/upgrade-check?gatewayId=${gw.gatewayId}`;

    setAction(gw.gatewayId, section, { loading: true, error: "", success: "" });
    try {
      const res = await fetch(url);
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || `Failed to load ${section}`);
      setAction(gw.gatewayId, section, { loading: false, error: "", success: "", data: result.data });
    } catch (err) {
      setAction(gw.gatewayId, section, { loading: false, error: err instanceof Error ? err.message : "Failed", success: "" });
    }
  };

  // Rename gateway
  const handleRename = async (gw: Gateway) => {
    const value = renameForm[gw.gatewayId]?.value ?? "";
    setAction(gw.gatewayId, "rename", { ...initialAction, loading: true });
    try {
      const res = await fetch("/api/gateways/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gatewayId: gw.gatewayId, gatewayName: value }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || "Rename failed");
      setAction(gw.gatewayId, "rename", { loading: false, error: "", success: "Renamed" });
      setRenameForm({ ...renameForm, [gw.gatewayId]: { open: false, value: "" } });
      mutate();
      setTimeout(() => setAction(gw.gatewayId, "rename", { ...getAction(gw.gatewayId, "rename"), success: "" }), 3000);
    } catch (err) {
      setAction(gw.gatewayId, "rename", { loading: false, error: err instanceof Error ? err.message : "Failed", success: "" });
    }
  };

  // Delete gateway
  const handleDelete = async (gw: Gateway) => {
    setAction(gw.gatewayId, "delete", { ...initialAction, loading: true });
    try {
      const res = await fetch("/api/gateways/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gatewayId: gw.gatewayId }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || "Delete failed");
      setAction(gw.gatewayId, "delete", { loading: false, error: "", success: "Deleted" });
      setConfirmDelete(null);
      mutate();
    } catch (err) {
      setAction(gw.gatewayId, "delete", { loading: false, error: err instanceof Error ? err.message : "Failed", success: "" });
    }
  };

  // Transfer gateway
  const handleTransfer = async (gw: Gateway) => {
    const value = transferForm[gw.gatewayId]?.value ?? "";
    setAction(gw.gatewayId, "transfer", { ...initialAction, loading: true });
    try {
      const res = await fetch("/api/gateways/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverUsername: value, gatewayIdList: `[${gw.gatewayId}]` }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || "Transfer failed");
      setAction(gw.gatewayId, "transfer", { loading: false, error: "", success: "Transferred" });
      setTransferForm({ ...transferForm, [gw.gatewayId]: { open: false, value: "" } });
      mutate();
      setTimeout(() => setAction(gw.gatewayId, "transfer", { ...getAction(gw.gatewayId, "transfer"), success: "" }), 3000);
    } catch (err) {
      setAction(gw.gatewayId, "transfer", { loading: false, error: err instanceof Error ? err.message : "Failed", success: "" });
    }
  };

  // Set upgrade mode
  const handleUpgradeMode = async (gw: Gateway) => {
    setAction(gw.gatewayId, "upgrade-mode", { ...initialAction, loading: true });
    try {
      const res = await fetch("/api/gateways/upgrade-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gatewayId: gw.gatewayId }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || "Failed to set upgrade mode");
      setAction(gw.gatewayId, "upgrade-mode", { loading: false, error: "", success: "Upgrade mode set" });
      setTimeout(() => setAction(gw.gatewayId, "upgrade-mode", { ...getAction(gw.gatewayId, "upgrade-mode"), success: "" }), 3000);
    } catch (err) {
      setAction(gw.gatewayId, "upgrade-mode", { loading: false, error: err instanceof Error ? err.message : "Failed", success: "" });
    }
  };

  const openRename = (gw: Gateway) =>
    setRenameForm({ ...renameForm, [gw.gatewayId]: { open: true, value: gw.gatewayName || "" } });
  const closeRename = (gw: Gateway) =>
    setRenameForm({ ...renameForm, [gw.gatewayId]: { open: false, value: "" } });
  const openTransfer = (gw: Gateway) =>
    setTransferForm({ ...transferForm, [gw.gatewayId]: { open: true, value: "" } });
  const closeTransfer = (gw: Gateway) =>
    setTransferForm({ ...transferForm, [gw.gatewayId]: { open: false, value: "" } });

  // Render a small action button used in card action rows
  const ActionButton = ({
    label,
    onClick,
    variant = "default",
    disabled = false,
    loading = false,
  }: {
    label: string;
    onClick: () => void;
    variant?: "default" | "danger" | "warning" | "success" | "neutral";
    disabled?: boolean;
    loading?: boolean;
  }) => {
    const cls =
      variant === "danger" ? "bg-error-soft text-error border border-red-200 hover:bg-red-100" :
      variant === "warning" ? "bg-warning-soft text-warning border border-yellow-200 hover:bg-yellow-100" :
      variant === "success" ? "bg-success-soft text-success border border-green-200 hover:bg-green-100" :
      variant === "neutral" ? "bg-alt text-text-secondary border border-border-card hover:bg-card" :
      "bg-accent text-white hover:bg-accent-hover";
    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`px-2.5 py-1.5 sm:py-1 rounded text-xs font-body transition-colors disabled:opacity-50 ${cls}`}
      >
        {loading ? `${label}...` : label}
      </button>
    );
  };

  // Render the expanded section content
  const renderSection = (gw: Gateway) => {
    const section = showSection[gw.gatewayId];
    if (!section) return null;
    const state = getAction(gw.gatewayId, section);
    const data = state.data as { [key: string]: unknown } | unknown[] | undefined;

    return (
      <div className="mt-3 pt-3 border-t border-border-card">
        {state.loading && <p className="text-text-muted text-xs font-body">Loading {section}...</p>}
        {state.error && (
          <p className="text-error text-xs font-body mb-2">{state.error}</p>
        )}

        {section === "detail" && data && !Array.isArray(data) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs font-body">
            {Object.entries(data).slice(0, 20).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 min-w-0">
                <span className="text-text-muted shrink-0">{k}:</span>
                <span className="text-text-secondary text-right break-all">{String(v)}</span>
              </div>
            ))}
          </div>
        )}

        {section === "locks" && Array.isArray(data) && (
          <div className="space-y-2">
            {data.length === 0 && <p className="text-text-muted text-xs font-body">No locks bound to this gateway.</p>}
            {data.map((item, idx) => {
              const lk = item as GatewayLock;
              return (
                <div key={lk.lockId ?? idx} className="bg-alt rounded p-2 text-xs font-body">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-accent font-semibold">{lk.lockName || lk.lockAlias || `Lock #${lk.lockId}`}</span>
                    {lk.rssi != null && <span className="text-text-muted">Signal: {lk.rssi} dBm</span>}
                  </div>
                  <p className="text-text-muted mt-0.5">ID: {lk.lockId}{lk.lockAlias ? ` · ${lk.lockAlias}` : ""}</p>
                </div>
              );
            })}
          </div>
        )}

        {section === "devices" && Array.isArray(data) && (
          <div className="space-y-2">
            {data.length === 0 && <p className="text-text-muted text-xs font-body">No devices bound to this gateway.</p>}
            {data.map((item, idx) => {
              const dev = item as GatewayDevice;
              return (
                <div key={dev.deviceId ?? idx} className="bg-alt rounded p-2 text-xs font-body">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-accent font-semibold">{dev.deviceName || dev.deviceAlias || dev.deviceType || `Device #${dev.deviceId}`}</span>
                    {dev.rssi != null && <span className="text-text-muted">Signal: {dev.rssi} dBm</span>}
                  </div>
                  <p className="text-text-muted mt-0.5">Type: {dev.deviceType} · ID: {dev.deviceId}{dev.deviceAlias ? ` · ${dev.deviceAlias}` : ""}</p>
                </div>
              );
            })}
          </div>
        )}

        {section === "upgrade" && data && !Array.isArray(data) && (
          <div className="text-xs font-body space-y-1">
            {(() => {
              const up = data as UpgradeCheck;
              return (
                <>
                  <p>
                    <span className="text-text-muted">Upgrade needed: </span>
                    <span className={up.needUpgrade ? "text-warning" : "text-success"}>
                      {up.needUpgrade ? "Yes" : "No"}
                    </span>
                  </p>
                  {up.version && <p><span className="text-text-muted">Version: </span><span className="text-text-secondary">{up.version}</span></p>}
                  {up.firmwareInfo && <p><span className="text-text-muted">Firmware: </span><span className="text-text-secondary break-all">{up.firmwareInfo}</span></p>}
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container-page py-4 sm:py-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-accent font-heading">Gateways</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 font-body">{gateways.length} gateway{gateways.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {isLoading && <div className="text-center py-12"><p className="text-text-muted">Loading gateways...</p></div>}

      {error && (
        <div className="bg-error-soft border border-red-200 rounded-lg p-4 text-sm text-red-600 mb-6">Failed to load gateways</div>
      )}

      {!isLoading && gateways.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg mb-2 font-body">No gateways found</p>
          <p className="text-text-muted text-sm font-body">Add a gateway through the TTLock mobile app first.</p>
        </div>
      )}

      <div className="space-y-3">
        {gateways.map((gw) => {
          const section = showSection[gw.gatewayId];
          const renameOpen = renameForm[gw.gatewayId]?.open ?? false;
          const transferOpen = transferForm[gw.gatewayId]?.open ?? false;
          const renameState = getAction(gw.gatewayId, "rename");
          const deleteState = getAction(gw.gatewayId, "delete");
          const transferState = getAction(gw.gatewayId, "transfer");
          const upgradeModeState = getAction(gw.gatewayId, "upgrade-mode");

          return (
            <div key={gw.gatewayId} className="card-compact bg-card border border-border-card rounded-lg p-3 sm:p-4 shadow-card">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="min-w-0 flex-1 mr-2">
                  <h3 className="text-accent font-heading font-semibold text-sm sm:text-base truncate">{gw.gatewayName || `Gateway #${gw.gatewayId}`}</h3>
                  <p className="text-text-muted text-xs mt-0.5 font-body">ID: {gw.gatewayId} · v{gw.gatewayVersion}</p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-body ${
                  gw.isOnline
                    ? "text-success bg-success-soft"
                    : "text-error bg-error-soft"
                }`}>
                  {gw.isOnline ? "Online" : "Offline"}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-3 sm:gap-4 gap-y-1 text-xs text-text-muted font-body mb-3">
                <span>MAC: <span className="font-mono text-text-secondary break-all">{gw.gatewayMac}</span></span>
                <span>Locks: {gw.lockNum}</span>
                {gw.rssi != null && <span>Signal: {gw.rssi} dBm</span>}
              </div>

              {/* Action buttons row */}
              <div className="flex flex-wrap items-center gap-2">
                <ActionButton
                  label="Detail"
                  onClick={() => loadSection(gw, "detail")}
                  variant={section === "detail" ? "neutral" : "default"}
                />
                <ActionButton
                  label="View Locks"
                  onClick={() => loadSection(gw, "locks")}
                  variant={section === "locks" ? "neutral" : "default"}
                />
                <ActionButton
                  label="View Devices"
                  onClick={() => loadSection(gw, "devices")}
                  variant={section === "devices" ? "neutral" : "default"}
                />
                <ActionButton
                  label="Check Upgrade"
                  onClick={() => loadSection(gw, "upgrade")}
                  variant={section === "upgrade" ? "neutral" : "default"}
                />
                <ActionButton
                  label="Rename"
                  onClick={() => openRename(gw)}
                  variant="neutral"
                />
                <ActionButton
                  label="Transfer"
                  onClick={() => openTransfer(gw)}
                  variant="neutral"
                />
                <ActionButton
                  label="Set Upgrade Mode"
                  onClick={() => handleUpgradeMode(gw)}
                  variant="warning"
                  loading={upgradeModeState.loading}
                  disabled={upgradeModeState.loading}
                />
                <ActionButton
                  label="Delete"
                  onClick={() => setConfirmDelete(gw.gatewayId)}
                  variant="danger"
                />
              </div>

              {/* Success / error banners for one-shot actions */}
              {renameState.error && <p className="text-error text-xs font-body mt-2">{renameState.error}</p>}
              {renameState.success && <p className="text-success text-xs font-body mt-2">{renameState.success}</p>}
              {transferState.error && <p className="text-error text-xs font-body mt-2">{transferState.error}</p>}
              {transferState.success && <p className="text-success text-xs font-body mt-2">{transferState.success}</p>}
              {upgradeModeState.error && <p className="text-error text-xs font-body mt-2">{upgradeModeState.error}</p>}
              {upgradeModeState.success && <p className="text-success text-xs font-body mt-2">{upgradeModeState.success}</p>}

              {/* Rename inline form */}
              {renameOpen && (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleRename(gw); }}
                  className="mt-3 flex flex-col sm:flex-row gap-2 bg-alt rounded p-2"
                >
                  <input
                    type="text"
                    placeholder="New gateway name"
                    value={renameForm[gw.gatewayId]?.value ?? ""}
                    onChange={(e) => setRenameForm({ ...renameForm, [gw.gatewayId]: { open: true, value: e.target.value } })}
                    className="w-full sm:flex-1 px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-focus-ring font-body"
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={renameState.loading}
                      className="px-3 py-1.5 rounded bg-accent text-white text-xs hover:bg-accent-hover disabled:opacity-50 transition-colors font-body"
                    >
                      {renameState.loading ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => closeRename(gw)}
                      className="px-3 py-1.5 rounded bg-alt text-text-secondary text-xs border border-border-card hover:bg-card transition-colors font-body"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Transfer inline form */}
              {transferOpen && (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleTransfer(gw); }}
                  className="mt-3 flex flex-col sm:flex-row gap-2 bg-alt rounded p-2"
                >
                  <input
                    type="text"
                    placeholder="Receiver username"
                    value={transferForm[gw.gatewayId]?.value ?? ""}
                    onChange={(e) => setTransferForm({ ...transferForm, [gw.gatewayId]: { open: true, value: e.target.value } })}
                    className="w-full sm:flex-1 px-3 py-2 rounded bg-card border border-border-card text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-focus-ring font-body"
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={transferState.loading}
                      className="px-3 py-1.5 rounded bg-accent text-white text-xs hover:bg-accent-hover disabled:opacity-50 transition-colors font-body"
                    >
                      {transferState.loading ? "Transferring..." : "Transfer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => closeTransfer(gw)}
                      className="px-3 py-1.5 rounded bg-alt text-text-secondary text-xs border border-border-card hover:bg-card transition-colors font-body"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Delete confirmation */}
              {confirmDelete === gw.gatewayId && (
                <div className="mt-3 bg-error-soft border border-red-200 rounded p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <p className="text-error text-xs font-body flex-1">
                    Delete this gateway? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <ActionButton
                      label="Confirm Delete"
                      onClick={() => handleDelete(gw)}
                      variant="danger"
                      loading={deleteState.loading}
                      disabled={deleteState.loading}
                    />
                    <ActionButton
                      label="Cancel"
                      onClick={() => setConfirmDelete(null)}
                      variant="neutral"
                    />
                  </div>
                  {deleteState.error && <p className="text-error text-xs font-body">{deleteState.error}</p>}
                </div>
              )}

              {/* Expanded section (detail / locks / devices / upgrade) */}
              {section && renderSection(gw)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
