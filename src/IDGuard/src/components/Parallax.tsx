"use client";

import { useRef, useEffect, useState, ReactNode } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

interface ParallaxLayer {
  speed: number;
  children: ReactNode;
  className?: string;
}

export function ParallaxLayer({ speed, children, className = "" }: ParallaxLayer) {
  const ref = useRef<HTMLDivElement>(null!);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, speed * -100]);
  const springY = useSpring(y, { stiffness: 100, damping: 30 });

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div style={{ y: springY }}>
        {children}
      </motion.div>
    </div>
  );
}

export function useMouseParallax() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return mousePos;
}

export function MouseParallaxLayer({
  children,
  factor = 0.03,
  className = "",
}: {
  children: ReactNode;
  factor?: number;
  className?: string;
}) {
  const mousePos = useMouseParallax();
  const ref = useRef<HTMLDivElement>(null!);

  return (
    <motion.div
      ref={ref}
      className={className}
      animate={{
        x: mousePos.x * factor * 100,
        y: mousePos.y * factor * 100,
      }}
      transition={{ type: "spring", stiffness: 50, damping: 20, mass: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

export function FadeInView({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}) {
  const directionMap = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
    none: {},
  };

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

export function HoverScale({ children, scale = 1.05, className = "" }: {
  children: ReactNode;
  scale?: number;
  className?: string;
}) {
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

export function StaggerFadeIn({
  children,
  className = "",
}: {
  children: ReactNode[];
  className?: string;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <FadeInView key={i} delay={i * 0.15}>
          {child}
        </FadeInView>
      ))}
    </div>
  );
}

export function GlowCard({ children, className = "" }: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{
        boxShadow: "0 0 30px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.1)",
      }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
