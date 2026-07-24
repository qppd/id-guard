"use client";

import LockCard from "@/components/LockCard";
import { useLocks } from "@/lib/hooks/useLocks";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { locks, isLoading, error, toggleLock } = useLocks();
  const { settings } = useTheme();
  const router = useRouter();

  const { data: gwData } = useSWR<{ ok: boolean; data: Record<string, unknown>[] }>(
    isAuthenticated ? "/api/gateways" : null,
    fetcher,
    { refreshInterval: settings.refreshInterval > 0 ? settings.refreshInterval * 1000 : undefined }
  );

  const gateways = gwData?.data ?? [];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const onlineGateways = gateways.filter((g: Record<string, unknown>) => g.isOnline == 1);

  return (
    <div className="container-page py-4 sm:py-8">
      {/* Summary cards */}
      {settings.showSummary && (
        <div className="grid-summary mb-4 sm:mb-6">
          <div className="card-compact bg-card border border-border-card rounded-lg p-3 sm:p-4 text-center shadow-card">
            <p className="text-xl sm:text-2xl font-bold text-accent font-heading">{locks.length}</p>
            <p className="text-xs text-text-muted mt-1 font-body">Locks</p>
          </div>
          <div className="card-compact bg-card border border-border-card rounded-lg p-3 sm:p-4 text-center shadow-card">
            <p className="text-xl sm:text-2xl font-bold text-accent font-heading">{gateways.length}</p>
            <p className="text-xs text-text-muted mt-1 font-body">Gateways</p>
          </div>
          <div className="card-compact bg-card border border-border-card rounded-lg p-3 sm:p-4 text-center shadow-card">
            <p className="text-xl sm:text-2xl font-bold text-accent font-heading">{onlineGateways.length}</p>
            <p className="text-xs text-text-muted mt-1 font-body">Online</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-accent font-heading">Dashboard</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 font-body">
            {locks.length} lock{locks.length !== 1 ? "s" : ""} on your account
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-text-muted">Loading locks...</p>
        </div>
      )}

      {error && (
        <div className="bg-error-soft border border-red-200 rounded-lg p-4 text-sm text-red-600 mb-6">
          {error}
        </div>
      )}

      {!isLoading && !error && locks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg mb-2 font-body">No locks found</p>
          <p className="text-text-muted text-sm font-body">
            Add a lock through the TTLock mobile app first, then refresh.
          </p>
        </div>
      )}

      <div className={`gap-3 sm:gap-4 ${settings.lockView === "list" ? "flex flex-col" : "grid-locks"}`}>
        {locks.map((lock) => (
          <Link href={`/locks/${lock.lockId}`} className="block" key={lock.lockId}>
            <LockCard
              lockId={lock.lockId}
              lockName={lock.lockName}
              lockAlias={lock.lockAlias || ""}
              battery={lock.electricQuantity}
              hasGateway={lock.hasGateway}
              firmwareRevision={lock.firmwareRevision}
              onAction={toggleLock}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
