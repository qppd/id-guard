"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import { useRef, useMemo, Suspense } from "react";
import * as THREE from "three";
import { useTheme, type AccentColor } from "@/contexts/ThemeContext";
import { useReducedMotion } from "framer-motion";

type AccentColors = { primary: string; secondary: string; emissive: string };

const accentColors: Record<AccentColor, AccentColors> = {
  blue:   { primary: "#183B6B", secondary: "#3B82F6", emissive: "#3B82F6" },
  green:  { primary: "#166534", secondary: "#22C55E", emissive: "#22C55E" },
  purple: { primary: "#581C87", secondary: "#A855F7", emissive: "#A855F7" },
  orange: { primary: "#9A3412", secondary: "#F97316", emissive: "#F97316" },
  teal:   { primary: "#115E59", secondary: "#14B8A6", emissive: "#14B8A6" },
  pink:   { primary: "#831843", secondary: "#EC4899", emissive: "#EC4899" },
};

function LockModel({ colors, reduceMotion }: { colors: AccentColors; reduceMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current || reduceMotion) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
  });

  return (
    <Float speed={reduceMotion ? 0 : 1.5} rotationIntensity={reduceMotion ? 0 : 0.2} floatIntensity={reduceMotion ? 0 : 0.3}>
      <group ref={groupRef}>
        {/* Lock body — rounded box */}
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[1, 0.8, 0.3]} />
          <meshStandardMaterial color={colors.primary} metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Lock shackle — torus arc */}
        <mesh position={[0, 0.45, 0]}>
          <torusGeometry args={[0.35, 0.08, 8, 32, Math.PI]} />
          <meshStandardMaterial color={colors.secondary} metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Keyhole — emissive cylinder on front face */}
        <mesh position={[0, -0.2, 0.16]}>
          <cylinderGeometry args={[0.08, 0.12, 0.05, 16]} />
          <meshStandardMaterial
            color={colors.emissive}
            emissive={colors.emissive}
            emissiveIntensity={0.6}
          />
        </mesh>

        {/* Keyhole pin (vertical drop) */}
        <mesh position={[0, -0.32, 0.16]}>
          <boxGeometry args={[0.04, 0.18, 0.03]} />
          <meshStandardMaterial
            color={colors.emissive}
            emissive={colors.emissive}
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>
    </Float>
  );
}

function AmbientGlow({ colors }: { colors: AccentColors }) {
  return (
    <mesh position={[0, 0, -1]} scale={2.5}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color={colors.secondary} transparent opacity={0.05} />
    </mesh>
  );
}

function LoginParticles({ colors, reduceMotion }: { colors: AccentColors; reduceMotion: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(80 * 3);
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 1;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 4;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current || reduceMotion) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={colors.secondary} size={0.03} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

export default function LoginScene() {
  const { settings } = useTheme();
  const reduceMotion = useReducedMotion() ?? false;
  const colors = accentColors[settings.accent];

  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      frameloop={reduceMotion || !settings.enableAnimations ? "demand" : "always"}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 3, 3]} intensity={1} color={colors.secondary} />
      <directionalLight position={[-3, 2, 1]} intensity={0.5} color={colors.primary} />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
      <LockModel colors={colors} reduceMotion={reduceMotion} />
      <AmbientGlow colors={colors} />
      <LoginParticles colors={colors} reduceMotion={reduceMotion} />
    </Canvas>
  );
}
