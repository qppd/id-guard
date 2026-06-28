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
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-blue-400">🔐</span>
          TTLock
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/keys" className="text-sm text-gray-300 hover:text-white transition-colors">
              Keys
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
