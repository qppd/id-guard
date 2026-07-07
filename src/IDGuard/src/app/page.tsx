"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) return null; // redirecting

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <Image
        src="/logos/id_guard_logo+name.png"
        alt="IDGuard"
        width={280}
        height={84}
        className="logo-responsive mb-4 sm:mb-6"
        priority
      />
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-[#183B6B] mb-3 sm:mb-4">
        Smart Lock Management
      </h1>
      <p className="text-[#1F2937] mb-8 max-w-md text-sm sm:text-lg font-body">
        Manage your TTLock-compatible smart locks — lock/unlock remotely, share eKeys,
        and monitor your devices from anywhere.
      </p>
      <a
        href="/login"
        className="px-8 py-3 sm:px-6 sm:py-3 rounded-lg bg-[#183B6B] text-white font-medium hover:bg-[#2A5CA5] transition-colors font-body text-base sm:text-sm"
      >
        Sign In
      </a>
    </div>
  );
}
