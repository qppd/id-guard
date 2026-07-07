"use client";

import Link from "next/link";
import { useAuth, logout } from "@/lib/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/gateways", label: "Gateways" },
    { href: "/keys", label: "Keys" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="bg-[#183B6B] border-b border-[#2A5CA5]">
      <div className="container-page h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logos/id_guard_logo.png"
            alt="IDGuard"
            width={32}
            height={32}
            className="w-7 h-7 sm:w-8 sm:h-8"
          />
          <span className="text-base sm:text-lg font-semibold text-white font-heading">IDGuard</span>
        </Link>

        {isAuthenticated && (
          <>
            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm px-3 py-1.5 rounded transition-colors font-body ${
                    isActive(item.href)
                      ? "bg-[#3B82F6] text-white"
                      : "text-white/80 hover:bg-[#DCEEFF] hover:text-[#183B6B]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="text-sm ml-2 px-3 py-1.5 rounded text-white/80 border border-white/30 hover:bg-white/10 transition-colors font-body"
              >
                Logout
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden flex flex-col gap-1 p-2 rounded hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-white transition-transform ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
              <span className={`block w-5 h-0.5 bg-white transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-white transition-transform ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
            </button>
          </>
        )}
      </div>

      {/* Mobile dropdown */}
      {isAuthenticated && menuOpen && (
        <div className="sm:hidden bg-[#1E3A5F] border-t border-[#2A5CA5] px-4 py-3 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`block text-sm px-3 py-2 rounded transition-colors font-body ${
                isActive(item.href)
                  ? "bg-[#3B82F6] text-white"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => { handleLogout(); setMenuOpen(false); }}
            className="w-full text-left text-sm px-3 py-2 rounded text-white/80 border border-white/30 hover:bg-white/10 transition-colors font-body"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
