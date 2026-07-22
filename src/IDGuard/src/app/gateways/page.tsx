"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
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
  const { settings } = useTheme();
  const router = useRouter();

  const { data, error, isLoading } = useSWR<{ ok: boolean; data: Gateway[] }>(
    isAuthenticated ? "/api/gateways" : null,
    fetcher,
    { refreshInterval: settings.refreshInterval > 0 ? settings.refreshInterval * 1000 : 15000 }
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) return <div className="min-h-[80vh] flex items-center justify-center"><p className="text-text-muted">Loading...</p></div>;
  if (!isAuthenticated) return null;

  const gateways = data?.data ?? [];

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
        {gateways.map((gw) => (
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
            <div className="flex flex-wrap gap-x-3 sm:gap-4 gap-y-1 text-xs text-text-muted font-body">
              <span>MAC: <span className="font-mono text-text-secondary break-all">{gw.gatewayMac}</span></span>
              <span>Locks: {gw.lockNum}</span>
              {gw.rssi != null && <span>Signal: {gw.rssi} dBm</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
