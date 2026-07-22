"use client";

import { useRef } from "react";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import { FadeInView } from "@/components/Parallax";
import { useTheme } from "@/contexts/ThemeContext";

const LoginScene = dynamic(() => import("@/components/LoginScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-focus-ring border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null!);
  const { settings } = useTheme();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-alt">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-text-secondary font-body"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div ref={ref} className="min-h-screen flex relative overflow-hidden bg-alt">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-[var(--link)]/8 to-transparent blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-[var(--accent)]/8 to-transparent blur-3xl" />
      </div>

      {/* Left side — 3D Scene */}
      <motion.div
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/5 to-transparent z-10" />

        <div className="relative w-full h-full z-0">
          <noscript>
            <div className="w-full h-full flex items-center justify-center bg-alt">
              <Image src="/logos/id_guard_logo.png" alt="IDGuard" width={120} height={120} />
            </div>
          </noscript>
          {settings.enable3D ? (
            <LoginScene />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image src="/logos/id_guard_logo.png" alt="IDGuard" width={120} height={120} />
            </div>
          )}
        </div>

        {/* Floating text overlay */}
        <motion.div
          className="absolute bottom-16 left-12 z-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <h2 className="text-3xl font-heading font-bold text-accent mb-2">
            Welcome Back
          </h2>
          <p className="text-text-secondary font-body text-sm max-w-sm">
            Your secure gateway to smart lock management. Sign in to continue.
          </p>
        </motion.div>
      </motion.div>

      {/* Right side — Login Form */}
      <motion.div
        className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <LoginForm />
      </motion.div>
    </div>
  );
}
