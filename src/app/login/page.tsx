"use client";

import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return <LoginForm />;
}
