"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useAuth() {
  const { data, mutate } = useSWR<{ ok: boolean }>("/api/auth", fetcher, {
    refreshInterval: 60000, // check every minute
  });

  return {
    isAuthenticated: data?.ok ?? false,
    isLoading: !data,
    checkAuth: mutate,
  };
}

export async function login(username: string, password: string) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function logout() {
  await fetch("/api/auth", { method: "POST" });
}
