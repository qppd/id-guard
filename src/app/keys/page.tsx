"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function KeysPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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
    fetcher
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
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const keys = data?.data ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">eKeys</h1>
          <p className="text-sm text-gray-400 mt-1">
            {keys.length} digital key{keys.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Cancel" : "Share Key"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSendKey} className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 space-y-3">
          <h3 className="text-white font-medium text-sm">Share eKey</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="number"
              placeholder="Lock ID"
              value={lockId}
              onChange={(e) => setLockId(e.target.value)}
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm"
              required
            />
            <input
              type="text"
              placeholder="Recipient username/email"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm"
              required
            />
            <input
              type="text"
              placeholder="Key name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm"
            />
          </div>
          {sendError && <p className="text-red-300 text-xs">{sendError}</p>}
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-1.5 rounded bg-green-700 text-green-100 text-sm hover:bg-green-600 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Key"}
          </button>
        </form>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading keys...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-sm text-red-300 mb-6">
          {error instanceof Error ? error.message : "Failed to load keys"}
        </div>
      )}

      {!isLoading && keys.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No keys found</p>
        </div>
      )}

      <div className="space-y-2">
        {keys.map((key) => (
          <div
            key={key.keyId}
            className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-white text-sm font-medium">
                {key.lockName as string || `Lock #${key.lockId}`}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                Key ID: {key.keyId} · Type: {key.userType === 110301 ? "Admin" : "User"}
                {key.remoteEnable ? " · Remote: ✅" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(key.startDate || key.endDate) && (
                <div className="text-xs text-gray-500 text-right mr-3 hidden sm:block">
                  {key.startDate && <p>From: {new Date(key.startDate as number).toLocaleDateString()}</p>}
                  {key.endDate && <p>Until: {new Date(key.endDate as number).toLocaleDateString()}</p>}
                </div>
              )}
              <button
                onClick={() => handleKeyAction(key.keyId, "freeze")}
                className="px-2 py-1 rounded bg-yellow-700/50 text-yellow-300 text-xs hover:bg-yellow-700 transition-colors"
              >
                Freeze
              </button>
              <button
                onClick={() => handleKeyAction(key.keyId, "unfreeze")}
                className="px-2 py-1 rounded bg-green-700/50 text-green-300 text-xs hover:bg-green-700 transition-colors"
              >
                Unfreeze
              </button>
              <button
                onClick={() => handleKeyAction(key.keyId, "delete")}
                className="px-2 py-1 rounded bg-red-700/50 text-red-300 text-xs hover:bg-red-700 transition-colors"
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
