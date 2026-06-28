"use client";

import { useState } from "react";
import { useAuth, login } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">🔐 TTLock</h1>
          <p className="text-gray-400 text-sm">Sign in to manage your locks</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-gray-300 mb-1">
              TTLock Username / Email
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
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
            className="w-full py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
