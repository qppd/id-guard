"use client";

import Link from "next/link";
import { useAuth, logout } from "@/lib/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
    <nav className="bg-accent border-b border-accent-hover">
      <div className="container-page h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="IDGuard home">
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
                      ? "bg-accent text-white"
                      : "text-white/80 hover:bg-sky hover:text-accent"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="text-sm ml-2 px-3 py-1.5 rounded text-white/80 border border-white/30 hover:bg-card/10 transition-colors font-body"
              >
                Logout
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden flex flex-col gap-1 p-2 rounded hover:bg-card/10 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <span className={`block w-5 h-0.5 bg-card transition-transform ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
              <span className={`block w-5 h-0.5 bg-card transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-card transition-transform ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
            </button>
          </>
        )}
      </div>

      {/* Mobile dropdown with animation */}
      <AnimatePresence>
        {isAuthenticated && menuOpen && (
          <motion.div
            id="mobile-menu"
            role="navigation"
            aria-label="Mobile navigation"
            className="sm:hidden bg-accent-dark border-t border-accent-hover px-4 py-3 space-y-2 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block text-sm px-3 py-2 rounded transition-colors font-body ${
                  isActive(item.href)
                    ? "bg-accent text-white"
                    : "text-white/80 hover:bg-card/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="w-full text-left text-sm px-3 py-2 rounded text-white/80 border border-white/30 hover:bg-card/10 transition-colors font-body"
            >
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}