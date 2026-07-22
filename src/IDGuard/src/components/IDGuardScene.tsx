"use client";

import { useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { useTheme, type AccentColor } from "@/contexts/ThemeContext";

/* ─── Theme color palette per accent ─── */
type AccentColors = { primary: string; secondary: string; emissive: string };

const accentColors: Record<AccentColor, AccentColors> = {
  blue:   { primary: "#183B6B", secondary: "#3B82F6", emissive: "#3B82F6" },
  green:  { primary: "#166534", secondary: "#22C55E", emissive: "#22C55E" },
  purple: { primary: "#581C87", secondary: "#A855F7", emissive: "#A855F7" },
  orange: { primary: "#9A3412", secondary: "#F97316", emissive: "#F97316" },
  teal:   { primary: "#115E59", secondary: "#14B8A6", emissive: "#14B8A6" },
  pink:   { primary: "#831843", secondary: "#EC4899", emissive: "#EC4899" },
};

/* ─── Digital Vault Core ─── */
function ShieldCore({ colors, reduceMotion }: { colors: AccentColors; reduceMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current || reduceMotion) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  return (
    <group ref={groupRef}>
      {/* Vault body — faceted icosahedron */}
      <mesh>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color={colors.primary} metalness={0.9} roughness={0.1} flatShading />
      </mesh>

      {/* Inner glowing core */}
      <mesh scale={0.5}>
        <icosahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color={colors.secondary}
          emissive={colors.emissive}
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Shield frame — torus around equator */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.04, 8, 64]} />
        <meshStandardMaterial color={colors.secondary} metalness={0.95} roughness={0.05} />
      </mesh>

      {/* Orbiting satellites */}
      {Array.from({ length: 6 }).map((_, i) => (
        <OrbitingSphere key={i} index={i} total={6} colors={colors} reduceMotion={reduceMotion} />
      ))}
    </group>
  );
}

function OrbitingSphere({ index, total, colors, reduceMotion }: {
  index: number; total: number; colors: AccentColors; reduceMotion: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const angle = (index / total) * Math.PI * 2;
  const radius = 1.8;

  useFrame((state) => {
    if (!ref.current || reduceMotion) return;
    const t = state.clock.elapsedTime * 0.3;
    ref.current.position.x = Math.cos(angle + t) * radius;
    ref.current.position.z = Math.sin(angle + t) * radius;
    ref.current.position.y = Math.sin(t * 0.5 + index) * 0.2;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshStandardMaterial color={colors.secondary} emissive={colors.emissive} emissiveIntensity={0.5} />
    </mesh>
  );
}

/* ─── Encrypted Data Stream Particles ─── */
function DataStreamParticles({ colors, reduceMotion }: { colors: AccentColors; reduceMotion: boolean }) {
  const points = useMemo(() => {
    const arr = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      const angle = (i / 300) * Math.PI * 4;
      const radius = 2 + Math.random() * 1.5;
      const y = (Math.random() - 0.5) * 3;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, []);

  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!ref.current || reduceMotion) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial color={colors.secondary} size={0.04} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

/* ─── Biometric Scanner Rings ─── */
function ScannerRings({ colors, reduceMotion }: { colors: AccentColors; reduceMotion: boolean }) {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <ExpandingRing key={i} delay={i * 0.8} colors={colors} reduceMotion={reduceMotion} />
      ))}
    </group>
  );
}

function ExpandingRing({ delay, colors, reduceMotion }: { delay: number; colors: AccentColors; reduceMotion: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (!ref.current || !matRef.current || reduceMotion) return;
    const t = (state.clock.elapsedTime + delay) % 2.5;
    const scale = 1 + t * 0.8;
    ref.current.scale.set(scale, scale, scale);
    matRef.current.opacity = Math.max(0, 0.5 * (1 - t / 2.5));
  });

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1.5, 0.02, 4, 64]} />
      <meshBasicMaterial ref={matRef} color={colors.secondary} transparent opacity={0.5} />
    </mesh>
  );
}

/* ─── Mouse Parallax Camera ─── */
function CameraRig({ reduceMotion }: { reduceMotion: boolean }) {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reduceMotion) return;
    const handler = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [reduceMotion]);

  useFrame(() => {
    if (reduceMotion) return;
    camera.position.x += (mouse.current.x * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (mouse.current.y * 0.3 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ─── Scene Content (inside Canvas) ─── */
function SceneContent({ colors, reduceMotion }: { colors: AccentColors; reduceMotion: boolean }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} color={colors.secondary} />
      <directionalLight position={[-3, -2, 3]} intensity={0.8} color={colors.primary} />
      <pointLight position={[0, 0, 3]} intensity={0.8} color={colors.secondary} />

      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      <Float speed={reduceMotion ? 0 : 1.5} rotationIntensity={reduceMotion ? 0 : 0.3} floatIntensity={reduceMotion ? 0 : 0.5}>
        <ShieldCore colors={colors} reduceMotion={reduceMotion} />
      </Float>

      <ScannerRings colors={colors} reduceMotion={reduceMotion} />
      <DataStreamParticles colors={colors} reduceMotion={reduceMotion} />
      <CameraRig reduceMotion={reduceMotion} />
    </>
  );
}

/* ─── Main Component ─── */
export default function IDGuardScene() {
  const { settings } = useTheme();
  const reduceMotion = useReducedMotion() ?? false;
  const colors = accentColors[settings.accent];

  const frameloop = reduceMotion || !settings.enableAnimations ? "demand" : "always";

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      frameloop={frameloop}
    >
      <SceneContent colors={colors} reduceMotion={reduceMotion} />
    </Canvas>
  );
}
