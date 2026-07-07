"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function KeysPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { settings } = useTheme();
  const router = useRouter();

  interface KeyData {
    keyId: number;
    lockId: number;
    lockName?: string;
    userType: number;
    remoteEnable?: number;
    startDate?: number;
    endDate?: number;
    status?: number;
  }

  const { data, error, mutate, isLoading } = useSWR<{ ok: boolean; data: KeyData[] }>(
    isAuthenticated ? "/api/keys" : null,
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
          lockId: parseInt(lockId),
          receiverUsername: receiver,
          keyName,
        }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || "Failed to send key");
      setShowForm(false);
      setLockId("");
      setReceiver("");
      setKeyName("");
      mutate();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSending(false);
    }
  };

  const handleKeyAction = async (keyId: number, action: "delete" | "freeze" | "unfreeze") => {
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, keyId }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error);
      mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const keys = data?.data ?? [];

  return (
    <div className="container-page py-4 sm:py-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#183B6B] font-heading">eKeys</h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-body">
            {keys.length} digital key{keys.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded bg-[#183B6B] text-white text-sm hover:bg-[#2A5CA5] transition-colors font-body shrink-0"
        >
          {showForm ? "Cancel" : "Share Key"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSendKey} className="bg-white border border-[#E5E7EB] rounded-lg p-4 mb-4 sm:mb-6 space-y-3 shadow-card">
          <h3 className="text-[#183B6B] font-heading font-semibold text-sm">Share eKey</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="number"
              placeholder="Lock ID"
              value={lockId}
              onChange={(e) => setLockId(e.target.value)}
              className="w-full sm:w-1/3 px-3 py-2 rounded bg-white border border-[#E5E7EB] text-[#1F2937] text-sm placeholder-[#9CA3AF] focus:outline-none focus:border-[#3B82F6]"
              required
            />
            <input
              type="text"
              placeholder="Recipient username/email"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              className="w-full sm:w-1/3 px-3 py-2 rounded bg-white border border-[#E5E7EB] text-[#1F2937] text-sm placeholder-[#9CA3AF] focus:outline-none focus:border-[#3B82F6]"
              required
            />
            <input
              type="text"
              placeholder="Key name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="w-full sm:w-1/3 px-3 py-2 rounded bg-white border border-[#E5E7EB] text-[#1F2937] text-sm placeholder-[#9CA3AF] focus:outline-none focus:border-[#3B82F6]"
            />
          </div>
          {sendError && <p className="text-[#EF4444] text-xs">{sendError}</p>}
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-1.5 rounded bg-[#183B6B] text-white text-sm hover:bg-[#2A5CA5] disabled:opacity-50 transition-colors font-body"
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600 mb-6">
          {error instanceof Error ? error.message : "Failed to load keys"}
        </div>
      )}

      {!isLoading && keys.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#6B7280] font-body">No keys found</p>
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        {keys.map((key) => (
          <div
            key={key.keyId}
            className="bg-white border border-[#E5E7EB] rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-card"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[#183B6B] text-sm font-heading font-semibold truncate">
                {key.lockName as string || `Lock #${key.lockId}`}
              </p>
              <p className="text-[#9CA3AF] text-xs mt-0.5 font-body">
                Key ID: {key.keyId} · Type: {key.userType === 110301 ? "Admin" : "User"}
                {key.remoteEnable ? " · Remote" : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(key.startDate || key.endDate) && (
                <div className="text-xs text-[#9CA3AF] sm:text-right mr-0 sm:mr-3 hidden sm:block font-body">
                  {key.startDate && <p>From: {new Date(key.startDate as number).toLocaleDateString()}</p>}
                  {key.endDate && <p>Until: {new Date(key.endDate as number).toLocaleDateString()}</p>}
                </div>
              )}
              <button
                onClick={() => handleKeyAction(key.keyId, "freeze")}
                className="px-2.5 py-1.5 sm:py-1 rounded bg-yellow-50 text-[#F59E0B] text-xs hover:bg-yellow-100 border border-yellow-200 transition-colors font-body"
              >
                Freeze
              </button>
              <button
                onClick={() => handleKeyAction(key.keyId, "unfreeze")}
                className="px-2.5 py-1.5 sm:py-1 rounded bg-green-50 text-[#22C55E] text-xs hover:bg-green-100 border border-green-200 transition-colors font-body"
              >
                Unfreeze
              </button>
              <button
                onClick={() => handleKeyAction(key.keyId, "delete")}
                className="px-2.5 py-1.5 sm:py-1 rounded bg-[#183B6B] text-white text-xs hover:bg-[#2A5CA5] transition-colors font-body"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
