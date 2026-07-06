"use client";

import Link from "next/link";
import { useAuth, logout } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav className="bg-card border-b border-border-card">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="text-accent">🔐</span>
          TTLock
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-text-secondary hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/gateways" className="text-sm text-text-secondary hover:text-foreground transition-colors">
              Gateways
            </Link>
            <Link href="/keys" className="text-sm text-text-secondary hover:text-foreground transition-colors">
              Keys
            </Link>
            <Link
              href="/settings"
              className="text-sm text-text-secondary hover:text-foreground transition-colors"
              title="Settings"
            >
              ⚙️
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded bg-input-bg border border-input-border text-text-secondary hover:bg-accent-bg hover:text-accent transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
