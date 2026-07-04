"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

export default function GatewaysPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const { data, error, isLoading } = useSWR<{ ok: boolean; data: Gateway[] }>(
    isAuthenticated ? "/api/gateways" : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) return <div className="min-h-[80vh] flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;
  if (!isAuthenticated) return null;

  const gateways = data?.data ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gateways</h1>
          <p className="text-sm text-gray-400 mt-1">{gateways.length} gateway{gateways.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {isLoading && <div className="text-center py-12"><p className="text-gray-400">Loading gateways...</p></div>}

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-sm text-red-300 mb-6">Failed to load gateways</div>
      )}

      {!isLoading && gateways.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">No gateways found</p>
          <p className="text-gray-600 text-sm">Add a gateway through the TTLock mobile app first.</p>
        </div>
      )}

      <div className="space-y-3">
        {gateways.map((gw) => (
          <div key={gw.gatewayId} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-medium">{gw.gatewayName || `Gateway #${gw.gatewayId}`}</h3>
                <p className="text-gray-500 text-xs mt-0.5">ID: {gw.gatewayId} · v{gw.gatewayVersion}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${gw.isOnline ? "text-green-400 bg-green-900/30" : "text-red-400 bg-red-900/30"}`}>
                {gw.isOnline ? "🟢 Online" : "🔴 Offline"}
              </span>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>MAC: <span className="font-mono text-gray-300">{gw.gatewayMac}</span></span>
              <span>Locks: {gw.lockNum}</span>
              {gw.rssi != null && <span>Signal: {gw.rssi} dBm</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
