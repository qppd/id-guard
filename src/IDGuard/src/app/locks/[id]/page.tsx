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
  const { settings } = useTheme();

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

  const { data: configRes, mutate: refreshConfig } = useSWR<{ ok: boolean; data: { [key: string]: unknown } }>(
    isAuthenticated ? `/api/locks/config?lockId=${lockId}` : null,
    fetcher
  );

  const [passForm, setPassForm] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [passType, setPassType] = useState(1);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [upgradeInfo, setUpgradeInfo] = useState("");
  const [recordsExpanded, setRecordsExpanded] = useState(false);
  const [icExpanded, setIcExpanded] = useState(false);
  const [fpExpanded, setFpExpanded] = useState(false);
  const [configExpanded, setConfigExpanded] = useState(false);

  // IC card form
  const [icForm, setIcForm] = useState(false);
  const [icNumber, setIcNumber] = useState("");
  const [icName, setIcName] = useState("");
  // Fingerprint form
  const [fpForm, setFpForm] = useState(false);
  const [fpNumber, setFpNumber] = useState("");
  const [fpName, setFpName] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) return <div className="min-h-[80vh] flex items-center justify-center"><p className="text-text-muted">Loading...</p></div>;
  if (!isAuthenticated) return null;

  const detail = detailRes?.data;
  const passcodes = passRes?.data ?? [];
  const gateways = gwRes?.data?.list ?? [];
  const records = recRes?.data ?? [];
  const gwById = gateways.filter((g: { [key: string]: unknown }) => g.lockId === lockId || g.lockNum);
  const icCards = icRes?.data ?? [];
  const fingerprints = fpRes?.data ?? [];

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

  // IC Card handlers
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

  // Fingerprint handlers
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

  const batteryColor = detail?.electricQuantity != null
    ? detail.electricQuantity > 50 ? "text-[#22C55E]" : detail.electricQuantity > 20 ? "text-[#F59E0B]" : "text-[#EF4444]"
    : "text-text-muted";

  const batteryBg = detail?.electricQuantity != null
    ? detail.electricQuantity > 50 ? "bg-green-50" : detail.electricQuantity > 20 ? "bg-yellow-50" : "bg-red-50"
    : "";

  const unlockTypeLabel: { [key: number]: string } = {
    1: "Bluetooth", 2: "Passcode", 3: "IC Card", 4: "Fingerprint",
    5: "Mechanical Key", 6: "Gateway", 7: "Face", 8: "Remote",
    9: "QR Code", 10: "Palm Vein", 11: "Door Sensor",
  };

  return (
    <div className="container-page py-4 sm:py-8">
      <button onClick={() => router.back()} className="text-[#3B82F6] hover:text-[#183B6B] text-sm mb-3 sm:mb-4 font-body">&larr; Back</button>

      {/* Lock Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#183B6B] font-heading truncate">{detail?.lockName || `Lock #${lockId}`}</h1>
            {detail?.lockAlias && <p className="text-[#6B7280] text-sm mt-1 font-body truncate">{detail.lockAlias}</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Door Sensor */}
            {doorRes?.data != null && (
              <span className={`text-xs px-2 py-1 rounded-full font-body ${
                doorRes.data.doorState
                  ? "bg-green-50 text-[#22C55E] border border-green-200"
                  : "bg-[#F8F6F2] text-[#6B7280] border border-[#E5E7EB]"
              }`}>
                {doorRes.data.doorState ? "Open" : "Closed"}
              </span>
            )}
            <span className={`text-base sm:text-lg font-bold ${batteryColor} ${batteryBg} px-2 py-1 rounded`}>
              {detail != null ? `${detail.electricQuantity}%` : "..."}
            </span>
          </div>
        </div>
        <div className="grid-detail-info mt-4 sm:mt-6 text-sm">
          <div><span className="text-[#9CA3AF]">ID</span><p className="text-[#1F2937] font-body break-all">{detail?.lockId}</p></div>
          <div className="sm:col-span-1"><span className="text-[#9CA3AF]">MAC</span><p className="text-[#1F2937] font-mono text-xs break-all">{detail?.lockMac || "—"}</p></div>
          <div><span className="text-[#9CA3AF]">Gateway</span><p className="text-[#1F2937] font-body">{detail?.hasGateway ? "Connected" : "None"}</p></div>
          <div><span className="text-[#9CA3AF]">Firmware</span><p className="text-[#1F2937] font-body">{detail?.firmwareRevision || "—"}</p></div>
          <div><span className="text-[#9CA3AF]">Hardware</span><p className="text-[#1F2937] font-body">{detail?.hardwareRevision != null ? `v${detail.hardwareRevision}` : "—"}</p></div>
          <div className="sm:col-span-1"><span className="text-[#9CA3AF]">Admin Code</span><p className="text-[#1F2937] font-mono text-xs break-all">{detail?.adminPwd || "—"}</p></div>
        </div>

        {/* Upgrade */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button onClick={handleCheckUpgrade} className="w-full sm:w-auto px-3 py-1.5 rounded bg-white border border-[#E5E7EB] text-[#6B7280] text-sm hover:bg-[#DCEEFF] hover:text-[#183B6B] transition-colors font-body">
            Check Upgrade
          </button>
          {upgradeInfo && <p className="text-xs text-[#6B7280] self-start sm:self-center font-body">{upgradeInfo}</p>}
        </div>
      </div>

      {/* Error/success banner */}
      {err && <p className="text-[#EF4444] text-xs bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{err}</p>}
      {msg && <p className="text-[#22C55E] text-xs bg-green-50 border border-green-200 rounded-lg p-3 mb-4">{msg}</p>}

      <div className="grid-2col-responsive">
        {/* Passcodes */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-heading font-semibold text-[#183B6B]">Passcodes</h2>
            <button onClick={() => { setPassForm(!passForm); setIcForm(false); setFpForm(false); }} className="px-3 py-1 rounded bg-[#183B6B] text-white text-sm hover:bg-[#2A5CA5] transition-colors font-body">
              {passForm ? "Cancel" : "+ Add"}
            </button>
          </div>

          {passForm && (
            <form onSubmit={handleAddPass} className="mb-4 p-3 bg-[#F8F6F2] rounded space-y-2">
              <input type="text" placeholder="Passcode (4-9 digits)" value={newPass} onChange={(e) => setNewPass(e.target.value.replace(/\D/g, ""))} maxLength={9} minLength={4} required className="w-full px-3 py-2 rounded bg-white border border-[#E5E7EB] text-[#1F2937] text-sm focus:outline-none focus:border-[#3B82F6]" />
              <select value={passType} onChange={(e) => setPassType(Number(e.target.value))} className="w-full px-3 py-2 rounded bg-white border border-[#E5E7EB] text-[#1F2937] text-sm focus:outline-none focus:border-[#3B82F6]">
                <option value={1}>Permanent</option>
                <option value={2}>Timed</option>
                <option value={3}>Cyclic</option>
              </select>
              <button type="submit" className="w-full py-1.5 rounded bg-[#183B6B] text-white text-sm hover:bg-[#2A5CA5] font-body">Add Passcode</button>
            </form>
          )}

          {passcodes.length === 0 ? (
            <p className="text-[#9CA3AF] text-sm text-center py-4 font-body">No passcodes</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {passcodes.map((p) => (
                <div key={p.passcodeId} className="flex items-center justify-between bg-[#F8F6F2] rounded px-3 py-2">
                  <div>
                    <span className="text-[#1F2937] font-mono text-sm">{p.passcode}</span>
                    <span className="text-[#9CA3AF] text-xs ml-2 font-body">
                      {p.type === 1 ? "Permanent" : p.type === 2 ? "Timed" : p.type === 3 ? "Cyclic" : "Other"}
                    </span>
                  </div>
                  <button onClick={() => handleDelPass(p.passcodeId)} className="text-[#EF4444] hover:text-red-700 text-xs font-body">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IC Cards */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-heading font-semibold text-[#183B6B]">IC Cards</h2>
            <button onClick={() => { setIcForm(!icForm); setPassForm(false); setFpForm(false); }} className="px-3 py-1 rounded bg-[#183B6B] text-white text-sm hover:bg-[#2A5CA5] transition-colors font-body">
              {icForm ? "Cancel" : "+ Add"}
            </button>
          </div>

          {icForm && (
            <form onSubmit={handleAddIc} className="mb-4 p-3 bg-[#F8F6F2] rounded space-y-2">
              <input type="text" placeholder="Card Number" value={icNumber} onChange={(e) => setIcNumber(e.target.value)} required className="w-full px-3 py-2 rounded bg-white border border-[#E5E7EB] text-[#1F2937] text-sm focus:outline-none focus:border-[#3B82F6]" />
              <input type="text" placeholder="Card Name" value={icName} onChange={(e) => setIcName(e.target.value)} required className="w-full px-3 py-2 rounded bg-white border border-[#E5E7EB] text-[#1F2937] text-sm focus:outline-none focus:border-[#3B82F6]" />
              <button type="submit" className="w-full py-1.5 rounded bg-[#183B6B] text-white text-sm hover:bg-[#2A5CA5] font-body">Add IC Card</button>
            </form>
          )}

          {icCards.length === 0 ? (
            <p className="text-[#9CA3AF] text-sm text-center py-4 font-body">No IC cards</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {icCards.map((c: { [key: string]: unknown }, i: number) => (
                <div key={i} className="flex items-center justify-between bg-[#F8F6F2] rounded px-3 py-2">
                  <div>
                    <p className="text-[#1F2937] font-mono text-sm">{c.cardNumber as string}</p>
                    <p className="text-[#9CA3AF] text-xs font-body">{c.cardName as string}</p>
                  </div>
                  <button onClick={() => handleDelIc(c.cardId as number)} className="text-[#EF4444] hover:text-red-700 text-xs font-body">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fingerprints */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-heading font-semibold text-[#183B6B]">Fingerprints</h2>
            <button onClick={() => { setFpForm(!fpForm); setPassForm(false); setIcForm(false); }} className="px-3 py-1 rounded bg-[#183B6B] text-white text-sm hover:bg-[#2A5CA5] transition-colors font-body">
              {fpForm ? "Cancel" : "+ Add"}
            </button>
          </div>

          {fpForm && (
            <form onSubmit={handleAddFp} className="mb-4 p-3 bg-[#F8F6F2] rounded space-y-2">
              <input type="text" placeholder="Fingerprint Number" value={fpNumber} onChange={(e) => setFpNumber(e.target.value)} required className="w-full px-3 py-2 rounded bg-white border border-[#E5E7EB] text-[#1F2937] text-sm focus:outline-none focus:border-[#3B82F6]" />
              <input type="text" placeholder="Fingerprint Name" value={fpName} onChange={(e) => setFpName(e.target.value)} required className="w-full px-3 py-2 rounded bg-white border border-[#E5E7EB] text-[#1F2937] text-sm focus:outline-none focus:border-[#3B82F6]" />
              <button type="submit" className="w-full py-1.5 rounded bg-[#183B6B] text-white text-sm hover:bg-[#2A5CA5] font-body">Add Fingerprint</button>
            </form>
          )}

          {fingerprints.length === 0 ? (
            <p className="text-[#9CA3AF] text-sm text-center py-4 font-body">No fingerprints</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {fingerprints.map((fp: { [key: string]: unknown }, i: number) => (
                <div key={i} className="flex items-center justify-between bg-[#F8F6F2] rounded px-3 py-2">
                  <div>
                    <p className="text-[#1F2937] text-sm font-body">{fp.fingerprintName as string || `FP #${fp.fingerprintId}`}</p>
                    <p className="text-[#9CA3AF] text-xs font-body">#{fp.fingerprintNumber as string}</p>
                  </div>
                  <button onClick={() => handleDelFp(fp.fingerprintId as number)} className="text-[#EF4444] hover:text-red-700 text-xs font-body">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gateways */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-card">
          <h2 className="text-lg font-heading font-semibold text-[#183B6B] mb-3">Gateways</h2>
          {gwById.length === 0 ? (
            <p className="text-[#9CA3AF] text-sm text-center py-4 font-body">No gateways</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {gateways.map((g: { [key: string]: unknown }, i: number) => (
                <div key={i} className="bg-[#F8F6F2] rounded px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-[#1F2937] text-sm font-medium font-body">{g.gatewayName as string || `Gateway #${g.gatewayId}`}</p>
                    <p className="text-[#9CA3AF] text-xs font-body">MAC: {g.gatewayMac as string} · {g.lockNum as number} lock(s)</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-body ${
                    Number(g.isOnline)
                      ? "text-[#22C55E] bg-green-50 border border-green-200"
                      : "text-[#EF4444] bg-red-50 border border-red-200"
                  }`}>
                    {Number(g.isOnline) ? "Online" : "Offline"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unlock Records */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 mt-4 sm:mt-6 shadow-card">
      <button onClick={() => setRecordsExpanded(!recordsExpanded)} className="flex items-center justify-between w-full">
        <h2 className="text-base sm:text-lg font-heading font-semibold text-[#183B6B]">Unlock Records ({recRes?.total ?? 0})</h2>
          <span className="text-[#9CA3AF]">{recordsExpanded ? "\u25B2" : "\u25BC"}</span>
        </button>
        {recordsExpanded && (
          <div className="mt-3 space-y-1 max-h-96 overflow-y-auto">
            {records.length === 0 ? (
              <p className="text-[#9CA3AF] text-sm text-center py-4 font-body">No records</p>
            ) : (
              records.map((r) => (
                <div key={r.recordId} className="flex items-center justify-between bg-[#F8F6F2] rounded px-3 py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={r.success ? "text-[#22C55E]" : "text-[#EF4444]"}>
                      {r.success ? "Success" : "Failed"}
                    </span>
                    <span className="text-[#6B7280] font-body">{unlockTypeLabel[r.unlockType] || `Type ${r.unlockType}`}</span>
                    <span className="text-[#9CA3AF] text-xs font-body">{new Date(r.unlockTime).toLocaleString()}</span>
                  </div>
                  <span className="text-[#9CA3AF] text-xs font-body">keyId: {r.keyId}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Lock Config */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 mt-4 sm:mt-6 shadow-card">
        <button onClick={() => setConfigExpanded(!configExpanded)} className="flex items-center justify-between w-full">
          <h2 className="text-base sm:text-lg font-heading font-semibold text-[#183B6B]">Lock Config</h2>
          <span className="text-[#9CA3AF]">{configExpanded ? "\u25B2" : "\u25BC"}</span>
        </button>
        {configExpanded && configRes?.data && (
          <div className="mt-3 space-y-1">
            {Object.entries(configRes.data).filter(([k]) => k !== "errcode").map(([key, val]) => (
              <div key={key} className="flex items-center justify-between bg-[#F8F6F2] rounded px-3 py-1.5 text-sm">
                <span className="text-[#9CA3AF] font-body">{key}</span>
                <span className="text-[#1F2937] font-body">{String(val)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
