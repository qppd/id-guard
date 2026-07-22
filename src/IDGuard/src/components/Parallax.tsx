"use client";

import { useRef, useEffect, useState, ReactNode } from "react";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── animation gate: skip when user prefers no motion OR disables in settings ─── */
function useAnimate(): boolean {
  const reduceMotion = useReducedMotion() ?? false;
  const { settings } = useTheme();
  return !reduceMotion && settings.enableAnimations;
}

/* ─── ParallaxLayer ─── */
interface ParallaxLayerProps {
  speed: number;
  children: ReactNode;
  className?: string;
}

export function ParallaxLayer({ speed, children, className = "" }: ParallaxLayerProps) {
  const animate = useAnimate();
  const ref = useRef<HTMLDivElement>(null!);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, speed * -100]);
  const springY = useSpring(y, { stiffness: 100, damping: 30 });

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div style={animate ? { y: springY } : undefined}>{children}</motion.div>
    </div>
  );
}

/* ─── Throttled mouse parallax via RAF ─── */
export function useMouseParallax() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | undefined>(undefined);
  const animate = useAnimate();

  useEffect(() => {
    if (!animate) return;
    let targetPos = { x: 0, y: 0 };
    const handler = (e: MouseEvent) => {
      targetPos = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setMousePos(targetPos);
          rafRef.current = undefined;
        });
      }
    };
    window.addEventListener("mousemove", handler);
    return () => {
      window.removeEventListener("mousemove", handler);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  return mousePos;
}

export function MouseParallaxLayer({
  children, factor = 0.03, className = "",
}: { children: ReactNode; factor?: number; className?: string }) {
  const animate = useAnimate();
  const mousePos = useMouseParallax();
  const ref = useRef<HTMLDivElement>(null!);

  if (!animate) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      animate={{ x: mousePos.x * factor * 100, y: mousePos.y * factor * 100 }}
      transition={{ type: "spring", stiffness: 50, damping: 20, mass: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

/* ─── FadeInView ─── */
export function FadeInView({
  children, delay = 0, direction = "up", className = "",
}: {
  children: ReactNode; delay?: number; direction?: "up" | "down" | "left" | "right" | "none"; className?: string;
}) {
  const animate = useAnimate();
  const directionMap: Record<string, { x?: number; y?: number }> = {
    up: { y: 40 }, down: { y: -40 }, left: { x: 40 }, right: { x: -40 }, none: {},
  };

  if (!animate) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directionMap[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── HoverScale ─── */
export function HoverScale({ children, scale = 1.05, className = "" }: {
  children: ReactNode; scale?: number; className?: string;
}) {
  const animate = useAnimate();
  if (!animate) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      {children}
    </motion.div>
  );
}

/* ─── StaggerFadeIn ─── */
export function StaggerFadeIn({ children, className = "" }: { children: ReactNode[]; className?: string }) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <FadeInView key={i} delay={i * 0.15}>{child}</FadeInView>
      ))}
    </div>
  );
}

/* ─── GlowCard — theme-aware via CSS vars ─── */
export function GlowCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const animate = useAnimate();
  const [glowColor, setGlowColor] = useState("#3B82F6");

  useEffect(() => {
    const read = () => {
      const color = getComputedStyle(document.documentElement).getPropertyValue("--focus-ring").trim();
      if (color) setGlowColor(color);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-accent", "class"] });
    return () => observer.disconnect();
  }, []);

  if (!animate) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      whileHover={{ boxShadow: `0 0 30px ${glowColor}4d, 0 0 60px ${glowColor}1a` }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}