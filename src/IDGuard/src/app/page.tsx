"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import dynamic from "next/dynamic";
import { FadeInView, HoverScale, MouseParallaxLayer, ParallaxLayer, GlowCard } from "@/components/Parallax";

const IDGuardScene = dynamic(() => import("@/components/IDGuardScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] md:h-[600px] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#3B82F6]/10 to-transparent blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-[#183B6B]/10 to-transparent blur-3xl" />
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-gradient-to-bl from-[#60A5FA]/8 to-transparent blur-3xl" />

      {/* Grid pattern overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3B82F6" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

const features = [
  {
    title: "Remote Lock/Unlock",
    desc: "Control your locks from anywhere in the world with instant one-tap access.",
    icon: "01",
  },
  {
    title: "Share eKeys",
    desc: "Send temporary or permanent digital keys to family, guests, or staff.",
    icon: "02",
  },
  {
    title: "Real-time Monitoring",
    desc: "Track unlock records, door sensor status, and battery levels in real time.",
    icon: "03",
  },
  {
    title: "Fingerprint & IC Cards",
    desc: "Manage multiple authentication methods from one dashboard.",
    icon: "04",
  },
];

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null!);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const springOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });
  const springScale = useSpring(scale, { stiffness: 100, damping: 30 });

  return (
    <div ref={containerRef} className="min-h-screen">
      <AnimatedBackground />

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0 z-0"
          style={{ opacity: springOpacity, scale: springScale }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F8F6F2]/30 to-background z-10" />
          <IDGuardScene />
        </motion.div>

        {/* Hero content */}
        <motion.div
          className="relative z-20 text-center px-4 max-w-4xl mx-auto"
          style={{ y: heroY }}
        >
          <FadeInView delay={0.2}>
            <Image
              src="/logos/id_guard_logo+name.png"
              alt="IDGuard"
              width={280}
              height={84}
              className="mx-auto mb-6 w-[200px] sm:w-[240px] lg:w-[280px] h-auto"
              priority
            />
          </FadeInView>

          <FadeInView delay={0.4}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-[#183B6B] mb-4 leading-tight">
              Your{" "}
              <span className="bg-gradient-to-r from-[#183B6B] via-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">
                Digital Identity
              </span>
              , Guarded
            </h1>
          </FadeInView>

          <FadeInView delay={0.6}>
            <p className="text-[#1F2937] text-lg sm:text-xl md:text-2xl mb-10 max-w-2xl mx-auto font-body leading-relaxed">
              Next-gen smart lock management with real-time access control,
              secure key sharing, and intuitive dashboards — all from one platform.
            </p>
          </FadeInView>

          <FadeInView delay={0.8}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <HoverScale scale={1.06}>
                <motion.a
                  href="/login"
                  className="px-10 py-4 rounded-xl bg-[#183B6B] text-white font-semibold text-lg hover:bg-[#2A5CA5] transition-all shadow-lg shadow-[#183B6B]/25 font-body inline-block"
                  whileHover={{ boxShadow: "0 0 40px rgba(59, 130, 246, 0.4)" }}
                >
                  Get Started
                </motion.a>
              </HoverScale>
              <HoverScale scale={1.06}>
                <motion.a
                  href="#features"
                  className="px-10 py-4 rounded-xl border-2 border-[#183B6B] text-[#183B6B] font-semibold text-lg hover:bg-[#DCEEFF] transition-all font-body inline-block"
                >
                  Learn More
                </motion.a>
              </HoverScale>
            </div>
          </FadeInView>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#9CA3AF]">
              <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <ParallaxLayer speed={0.3}>
        <section id="features" className="relative py-24 md:py-32 px-4">
          <div className="max-w-6xl mx-auto">
            <FadeInView>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[#183B6B] text-center mb-4">
                Everything You Need
              </h2>
              <p className="text-[#6B7280] text-center max-w-xl mx-auto mb-16 text-lg font-body">
                Secure, fast, and intuitive access management for modern properties.
              </p>
            </FadeInView>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <FadeInView key={i} delay={i * 0.15}>
                  <GlowCard className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-card hover:shadow-xl transition-shadow h-full">
                    <div className="text-2xl font-bold text-[#3B82F6] mb-3 font-heading">
                      {f.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-[#183B6B] mb-2 font-heading">
                      {f.title}
                    </h3>
                    <p className="text-[#6B7280] text-sm font-body leading-relaxed">
                      {f.desc}
                    </p>
                  </GlowCard>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>
      </ParallaxLayer>

      {/* ===== STATS / TRUST SECTION ===== */}
      <ParallaxLayer speed={-0.2}>
        <section className="relative py-20 md:py-28 px-4">
          <MouseParallaxLayer factor={0.02} className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-gradient-to-r from-[#3B82F6]/5 to-transparent rounded-full blur-3xl" />
          </MouseParallaxLayer>

          <div className="max-w-4xl mx-auto text-center">
            <FadeInView>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[#183B6B] mb-6">
                Trusted Protection
              </h2>
              <p className="text-[#1F2937] text-lg max-w-2xl mx-auto mb-12 font-body">
                IDGuard integrates with industry-leading TTLock hardware to provide
                enterprise-grade security for your property.
              </p>
            </FadeInView>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { num: "10K+", label: "Locks Managed" },
                { num: "50K+", label: "Access Events" },
                { num: "99.9%", label: "Uptime" },
                { num: "24/7", label: "Monitoring" },
              ].map((stat, i) => (
                <FadeInView key={i} delay={i * 0.1}>
                  <motion.div
                    className="text-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="text-4xl md:text-5xl font-bold text-[#183B6B] font-heading mb-1">
                      {stat.num}
                    </div>
                    <div className="text-[#6B7280] text-sm font-body">
                      {stat.label}
                    </div>
                  </motion.div>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>
      </ParallaxLayer>

      {/* ===== CTA SECTION ===== */}
      <ParallaxLayer speed={0.2}>
        <section className="relative py-20 md:py-28 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <FadeInView>
              <div className="bg-gradient-to-br from-[#183B6B] to-[#1E3A5F] rounded-3xl p-10 md:p-16 shadow-xl">
                <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
                  Ready to Secure Your Space?
                </h2>
                <p className="text-[#DCEEFF] text-lg mb-8 font-body max-w-lg mx-auto">
                  Join thousands of users who trust IDGuard for their smart lock management.
                </p>
                <HoverScale scale={1.06}>
                  <motion.a
                    href="/login"
                    className="inline-block px-10 py-4 rounded-xl bg-white text-[#183B6B] font-semibold text-lg hover:bg-[#DCEEFF] transition-all shadow-lg font-body"
                    whileHover={{ boxShadow: "0 0 40px rgba(255,255,255,0.3)" }}
                  >
                    Sign In Now
                  </motion.a>
                </HoverScale>
              </div>
            </FadeInView>
          </div>
        </section>
      </ParallaxLayer>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 border-t border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logos/id_guard_logo.png"
              alt="IDGuard"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span className="text-sm text-[#6B7280] font-body">
              IDGuard &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex gap-6 text-sm text-[#6B7280] font-body">
            <a href="#" className="hover:text-[#183B6B] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#183B6B] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#183B6B] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
