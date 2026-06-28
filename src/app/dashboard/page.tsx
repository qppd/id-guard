"use client";

import LockCard from "@/components/LockCard";
import { useLocks } from "@/lib/hooks/useLocks";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { locks, isLoading, error, toggleLock } = useLocks();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            {locks.length} lock{locks.length !== 1 ? "s" : ""} on your account
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading locks...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-sm text-red-300 mb-6">
          {error}
        </div>
      )}

      {!isLoading && !error && locks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">No locks found</p>
          <p className="text-gray-600 text-sm">
            Add a lock through the TTLock mobile app first, then refresh.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locks.map((lock) => (
          <LockCard
            key={lock.lockId}
            lockId={lock.lockId}
            lockName={lock.lockName}
            lockAlias={lock.lockAlias || ""}
            battery={lock.electricQuantity}
            hasGateway={lock.hasGateway}
            firmwareRevision={lock.firmwareRevision}
            onAction={toggleLock}
          />
        ))}
      </div>
    </div>
  );
}
