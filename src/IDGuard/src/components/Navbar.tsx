"use client";

import Link from "next/link";
import { useAuth, logout } from "@/lib/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-[#183B6B] border-b border-[#2A5CA5]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logos/id_guard_logo.png"
            alt="IDGuard"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-lg font-semibold text-white font-heading">IDGuard</span>
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`text-sm px-3 py-1.5 rounded transition-colors font-body ${
                isActive("/dashboard")
                  ? "bg-[#3B82F6] text-white"
                  : "text-white/80 hover:bg-[#DCEEFF] hover:text-[#183B6B]"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/gateways"
              className={`text-sm px-3 py-1.5 rounded transition-colors font-body ${
                isActive("/gateways")
                  ? "bg-[#3B82F6] text-white"
                  : "text-white/80 hover:bg-[#DCEEFF] hover:text-[#183B6B]"
              }`}
            >
              Gateways
            </Link>
            <Link
              href="/keys"
              className={`text-sm px-3 py-1.5 rounded transition-colors font-body ${
                isActive("/keys")
                  ? "bg-[#3B82F6] text-white"
                  : "text-white/80 hover:bg-[#DCEEFF] hover:text-[#183B6B]"
              }`}
            >
              Keys
            </Link>
            <Link
              href="/settings"
              className={`text-sm px-3 py-1.5 rounded transition-colors font-body ${
                isActive("/settings")
                  ? "bg-[#3B82F6] text-white"
                  : "text-white/80 hover:bg-[#DCEEFF] hover:text-[#183B6B]"
              }`}
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm ml-2 px-3 py-1.5 rounded text-white/80 border border-white/30 hover:bg-white/10 transition-colors font-body"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
