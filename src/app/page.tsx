"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) return null; // redirecting

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4 text-center">
      <h1 className="text-4xl font-bold text-white mb-4">🔐 TTLock</h1>
      <p className="text-gray-400 mb-8 max-w-md">
        Manage your TTLock-compatible smart locks — lock/unlock remotely, share eKeys,
        and monitor your devices from anywhere.
      </p>
      <a
        href="/login"
        className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
      >
        Sign In
      </a>
    </div>
  );
}
