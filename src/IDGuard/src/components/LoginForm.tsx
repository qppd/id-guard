"use client";

import { useState } from "react";
import { useAuth, login } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { checkAuth } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      await checkAuth();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-6">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <Image
            src="/logos/id_guard_logo+name.png"
            alt="IDGuard"
            width={200}
            height={60}
            className="logo-small-responsive mx-auto mb-3"
            priority
          />
          <p className="text-[#6B7280] text-sm font-body">Sign in to manage your locks</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-[#6B7280] mb-1 font-body">
              TTLock Username / Email
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 rounded bg-white border border-[#E5E7EB] text-[#1F2937] text-base sm:text-sm placeholder-[#9CA3AF] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-[#6B7280] mb-1 font-body">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 rounded bg-white border border-[#E5E7EB] text-[#1F2937] text-base sm:text-sm placeholder-[#9CA3AF] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-2 rounded bg-[#183B6B] text-white text-base sm:text-sm font-medium hover:bg-[#2A5CA5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-body"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
