"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/lib/hooks/useAuth";
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
  passcodeId: number;
  passcode: string;
  type: number;
  startDate?: number;
  endDate?: number;
}

interface Record {
  recordId: number;
  lockId: number;
  keyId: number;
  unlockTime: number;
  unlockType: number;
  gatewayId?: number;
  success: number;
}

export default function LockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lockId = Number(params.id);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: detailRes, mutate: refreshDetail } = useSWR<{ ok: boolean; data: LockDetail }>(
    isAuthenticated ? `/api/locks/${lockId}` : null,
    fetcher
  );

  const { data: passRes, mutate: refreshPass } = useSWR<{ ok: boolean; data: Passcode[] }>(
    isAuthenticated ? `/api/passcodes?lockId=${lockId}` : null,
    fetcher
  );

  const { data: recRes } = useSWR<{ ok: boolean; data: Record[]; total: number }>(
    isAuthenticated ? `/api/records?lockId=${lockId}` : null,
    fetcher
  );

  const { data: gwRes } = useSWR<{ ok: boolean; data: { list: Array<{ [key: string]: unknown }> } }>(
    isAuthenticated ? `/api/gateways` : null,
    fetcher
  );

  const [passForm, setPassForm] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [passType, setPassType] = useState(1);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [upgradeInfo, setUpgradeInfo] = useState("");
  const [recordsExpanded, setRecordsExpanded] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) return <div className="min-h-[80vh] flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;
  if (!isAuthenticated) return null;

  const detail = detailRes?.data;
  const passcodes = passRes?.data ?? [];
  const gateways = gwRes?.data?.list ?? [];
  const records = recRes?.data ?? [];
  const gwById = gateways.filter((g: { [key: string]: unknown }) => g.lockId === lockId || g.lockNum);

  const handleAddPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      const res = await fetch("/api/passcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", lockId, passcode: newPass, type: passType }),
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

  const batteryColor = detail?.electricQuantity != null
    ? detail.electricQuantity > 50 ? "text-green-400" : detail.electricQuantity > 20 ? "text-yellow-400" : "text-red-400"
    : "text-gray-400";

  const unlockTypeLabel: { [key: number]: string } = {
    1: "Bluetooth", 2: "Passcode", 3: "IC Card", 4: "Fingerprint",
    5: "Mechanical Key", 6: "Gateway", 7: "Face", 8: "Remote",
    9: "QR Code", 10: "Palm Vein", 11: "Door Sensor",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm mb-4">&larr; Back</button>

      {/* Lock Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{detail?.lockName || `Lock #${lockId}`}</h1>
            {detail?.lockAlias && <p className="text-gray-400 text-sm mt-1">{detail.lockAlias}</p>}
          </div>
          <span className={`text-lg font-bold ${batteryColor}`}>
            🔋 {detail != null ? `${detail.electricQuantity}%` : "..."}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 text-sm">
          <div><span className="text-gray-500">ID</span><p className="text-white">{detail?.lockId}</p></div>
          <div><span className="text-gray-500">MAC</span><p className="text-white font-mono text-xs">{detail?.lockMac || "—"}</p></div>
          <div><span className="text-gray-500">Gateway</span><p className="text-white">{detail?.hasGateway ? "✅ Connected" : "❌ None"}</p></div>
          <div><span className="text-gray-500">Firmware</span><p className="text-white">{detail?.firmwareRevision || "—"}</p></div>
          <div><span className="text-gray-500">Hardware</span><p className="text-white">{detail?.hardwareRevision != null ? `v${detail.hardwareRevision}` : "—"}</p></div>
          <div><span className="text-gray-500">Admin Code</span><p className="text-white font-mono">{detail?.adminPwd || "—"}</p></div>
        </div>

        {/* Upgrade */}
        <div className="mt-4 flex gap-3">
          <button onClick={handleCheckUpgrade} className="px-3 py-1.5 rounded bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors">
            🔄 Check Upgrade
          </button>
          {upgradeInfo && <p className="text-xs text-gray-400 self-center">{upgradeInfo}</p>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Passcodes */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Passcodes</h2>
            <button onClick={() => setPassForm(!passForm)} className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors">
              {passForm ? "Cancel" : "+ Add"}
            </button>
          </div>

          {passForm && (
            <form onSubmit={handleAddPass} className="mb-4 p-3 bg-gray-800 rounded space-y-2">
              <input type="text" placeholder="Passcode (4-9 digits)" value={newPass} onChange={(e) => setNewPass(e.target.value.replace(/\D/g, ""))} maxLength={9} minLength={4} required className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm" />
              <select value={passType} onChange={(e) => setPassType(Number(e.target.value))} className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm">
                <option value={1}>Permanent</option>
                <option value={2}>Timed</option>
                <option value={3}>Cyclic</option>
              </select>
              <button type="submit" className="w-full py-1.5 rounded bg-green-700 text-green-100 text-sm hover:bg-green-600">Add Passcode</button>
              {msg && <p className="text-green-400 text-xs">{msg}</p>}
              {err && <p className="text-red-300 text-xs">{err}</p>}
            </form>
          )}

          {passcodes.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No passcodes</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {passcodes.map((p) => (
                <div key={p.passcodeId} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                  <div>
                    <span className="text-white font-mono text-sm">{p.passcode}</span>
                    <span className="text-gray-500 text-xs ml-2">
                      {p.type === 1 ? "Permanent" : p.type === 2 ? "Timed" : p.type === 3 ? "Cyclic" : "Other"}
                    </span>
                  </div>
                  <button onClick={() => handleDelPass(p.passcodeId)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gateways */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Gateways</h2>
          {gwById.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No gateways</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {gateways.map((g: { [key: string]: unknown }, i: number) => (
                <div key={i} className="bg-gray-800 rounded px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{g.gatewayName as string || `Gateway #${g.gatewayId}`}</p>
                    <p className="text-gray-500 text-xs">MAC: {g.gatewayMac as string} · {g.lockNum as number} lock(s)</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${Number(g.isOnline) ? "text-green-400 bg-green-900/30" : "text-red-400 bg-red-900/30"}`}>
                    {Number(g.isOnline) ? "Online" : "Offline"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unlock Records */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mt-6">
        <button onClick={() => setRecordsExpanded(!recordsExpanded)} className="flex items-center justify-between w-full">
          <h2 className="text-lg font-semibold text-white">Unlock Records ({recRes?.total ?? 0})</h2>
          <span className="text-gray-500">{recordsExpanded ? "▲" : "▼"}</span>
        </button>
        {recordsExpanded && (
          <div className="mt-3 space-y-1 max-h-96 overflow-y-auto">
            {records.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No records</p>
            ) : (
              records.map((r) => (
                <div key={r.recordId} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={r.success ? "text-green-400" : "text-red-400"}>
                      {r.success ? "✅" : "❌"}
                    </span>
                    <span className="text-gray-300">{unlockTypeLabel[r.unlockType] || `Type ${r.unlockType}`}</span>
                    <span className="text-gray-500 text-xs">{new Date(r.unlockTime).toLocaleString()}</span>
                  </div>
                  <span className="text-gray-500 text-xs">keyId: {r.keyId}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
