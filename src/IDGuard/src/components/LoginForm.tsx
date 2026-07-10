"use client";

import { useState } from "react";
import { useAuth, login } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { HoverScale, FadeInView } from "@/components/Parallax";

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
    <motion.div
      className="w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <FadeInView delay={0.1}>
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          >
            <Image
              src="/logos/id_guard_logo+name.png"
              alt="IDGuard"
              width={200}
              height={60}
              className="logo-small-responsive mx-auto mb-3"
              priority
            />
          </motion.div>
          <motion.p
            className="text-[#6B7280] text-sm font-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            Sign in to manage your locks
          </motion.p>
        </div>
      </FadeInView>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FadeInView delay={0.2} direction="up">
          <motion.div
            className="bg-white rounded-xl p-1 shadow-sm border border-[#E5E7EB]"
            whileFocus={{ boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.15)" }}
          >
            <label htmlFor="username" className="block text-xs text-[#6B7280] px-3 pt-2 font-body">
              TTLock Username / Email
            </label>
            <motion.input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-transparent text-[#1F2937] text-sm placeholder-[#9CA3AF] focus:outline-none font-body"
              placeholder="your@email.com"
              required
              whileFocus={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          </motion.div>
        </FadeInView>

        <FadeInView delay={0.3} direction="up">
          <motion.div
            className="bg-white rounded-xl p-1 shadow-sm border border-[#E5E7EB]"
            whileFocus={{ boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.15)" }}
          >
            <label htmlFor="password" className="block text-xs text-[#6B7280] px-3 pt-2 font-body">
              Password
            </label>
            <motion.input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-transparent text-[#1F2937] text-sm placeholder-[#9CA3AF] focus:outline-none font-body"
              placeholder="••••••••"
              required
              whileFocus={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          </motion.div>
        </FadeInView>

        {error && (
          <motion.div
            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {error}
          </motion.div>
        )}

        <FadeInView delay={0.45} direction="up">
          <HoverScale scale={1.02}>
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#183B6B] text-white text-sm font-medium hover:bg-[#2A5CA5] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-body shadow-md"
              whileHover={{ boxShadow: "0 0 30px rgba(59, 130, 246, 0.3)" }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </HoverScale>
        </FadeInView>
      </form>

      {/* Animated decorative elements */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-2 text-xs text-[#9CA3AF] font-body">
          <motion.span
            className="inline-block w-8 h-px bg-[#E5E7EB]"
            animate={{ width: ["8px", "32px", "8px"] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          Secure Connection
          <motion.span
            className="inline-block w-8 h-px bg-[#E5E7EB]"
            animate={{ width: ["8px", "32px", "8px"] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
