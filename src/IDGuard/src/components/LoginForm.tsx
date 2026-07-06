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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image
            src="/logos/id_guard_logo+name.png"
            alt="IDGuard"
            width={200}
            height={60}
            className="mx-auto mb-3"
            priority
          />
          <p className="text-text-secondary text-sm">Sign in to manage your locks</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-text-secondary mb-1">
              TTLock Username / Email
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded bg-input-bg border border-input-border text-foreground text-sm placeholder-text-muted focus:outline-none focus:border-accent"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-text-secondary mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-input-bg border border-input-border text-foreground text-sm placeholder-text-muted focus:outline-none focus:border-accent"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
