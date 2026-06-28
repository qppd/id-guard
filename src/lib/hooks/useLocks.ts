"use client";

import useSWR from "swr";
import { useCallback } from "react";

interface Lock {
  lockId: number;
  lockName: string;
  lockAlias: string;
  lockMac: string;
  hasGateway: boolean;
  electricQuantity: number;
  firmwareRevision?: string;
}

interface LocksResponse {
  ok: boolean;
  data?: Lock[];
  error?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLocks() {
  const { data, error, mutate, isLoading } = useSWR<LocksResponse>(
    "/api/locks",
    fetcher,
    { refreshInterval: 10000 }
  );

  const toggleLock = useCallback(
    async (lockId: number, action: "lock" | "unlock") => {
      const res = await fetch("/api/locks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockId, action }),
      });
      const result = await res.json();
      if (result.ok) mutate(); // refresh list
      return result;
    },
    [mutate]
  );

  return {
    locks: data?.data ?? [],
    isLoading,
    error: error ? (error as Error).message : data?.error,
    toggleLock,
  };
}
