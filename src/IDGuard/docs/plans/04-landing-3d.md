# Plan: Landing 3D Scene Redesign

**Prereq:** Audit doc `04-landing-3d.md`  
**Target file:** `src/components/IDGuardScene.tsx`

## Overview

Replace the current "abstract security orb" with a **"digital identity vault"** — a central geometric lock/shield with bio-scanner ring, encrypted data stream particles, and ambient glow. All colors themed via React context.

## Step 1: Accept theme props

```tsx
import { useTheme } from "@/contexts/ThemeContext";

const accentColors: Record<AccentColor, { primary: string; secondary: string; emissive: string }> = {
  blue:   { primary: "#183B6B", secondary: "#3B82F6", emissive: "#3B82F6" },
  green:  { primary: "#166534", secondary: "#22C55E", emissive: "#22C55E" },
  purple: { primary: "#581C87", secondary: "#A855F7", emissive: "#A855F7" },
  orange: { primary: "#9A3412", secondary: "#F97316", emissive: "#F97316" },
  teal:   { primary: "#115E59", secondary: "#14B8A6", emissive: "#14B8A6" },
  pink:   { primary: "#831843", secondary: "#EC4899", emissive: "#EC4899" },
};

export default function IDGuardScene() {
  const { settings } = useTheme();
  const colors = accentColors[settings.accent];
  // ... pass `colors` to all sub-components
}
```

## Step 2: New ShieldCore — "Digital Vault"

Replace torus knot + octahedron + sphere with:

```tsx
function ShieldCore({ colors }: { colors: AccentColors }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Vault body — rounded icosahedron */}
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
      
      {/* Orbiting satellites — actual orbit now */}
      {Array.from({ length: 6 }).map((_, i) => (
        <OrbitingSphere key={i} index={i} total={6} colors={colors} />
      ))}
    </group>
  );
}

function OrbitingSphere({ index, total, colors }: { index: number; total: number; colors: AccentColors }) {
  const ref = useRef<THREE.Mesh>(null);
  const angle = (index / total) * Math.PI * 2;
  const radius = 1.8;
  
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime * 0.3;
      ref.current.position.x = Math.cos(angle + t) * radius;
      ref.current.position.z = Math.sin(angle + t) * radius;
      ref.current.position.y = Math.sin(t * 0.5 + index) * 0.2;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshStandardMaterial color={colors.secondary} emissive={colors.emissive} emissiveIntensity={0.5} />
    </mesh>
  );
}
```

## Step 3: New Particles — "Encrypted Data Stream"

Replace random cube particles with flowing curved paths:

```tsx
function DataStreamParticles({ colors }: { colors: AccentColors }) {
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
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={300} array={points} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color={colors.secondary}
        size={0.04}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}
```

## Step 4: New ScanRing — "Biometric Scanner"

Replace 3 tilted line rings with 3 concentric expanding rings:

```tsx
function ScannerRings({ colors }: { colors: AccentColors }) {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <ExpandingRing key={i} delay={i * 0.8} colors={colors} />
      ))}
    </group>
  );
}

function ExpandingRing({ delay, colors }: { delay: number; colors: AccentColors }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  
  useFrame((state) => {
    if (ref.current && matRef.current) {
      const t = (state.clock.elapsedTime + delay) % 2.5;
      const scale = 1 + t * 0.8;
      ref.current.scale.set(scale, scale, scale);
      matRef.current.opacity = Math.max(0, 0.5 * (1 - t / 2.5));
    }
  });

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1.5, 0.02, 4, 64]} />
      <meshBasicMaterial ref={matRef} color={colors.secondary} transparent opacity={0.5} />
    </mesh>
  );
}
```

## Step 5: Fix all Date.now() → state.clock.elapsedTime

Every `useFrame` callback should use the first parameter `state.clock.elapsedTime`:
```tsx
// BEFORE:
useFrame(() => {
  mesh.rotation.y = Date.now() * 0.0005;
});

// AFTER:
useFrame((state) => {
  mesh.rotation.y = state.clock.elapsedTime * 0.15;
});
```

## Step 6: Mouse parallax camera

```tsx
function CameraRig() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  
  useFrame(() => {
    camera.position.x += (mouse.current.x * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (mouse.current.y * 0.3 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}
```

## Step 7: prefers-reduced-motion support

```tsx
import { useReducedMotion } from "framer-motion";

export default function IDGuardScene() {
  const { settings } = useTheme();
  const reduceMotion = useReducedMotion() ?? false;
  const colors = accentColors[settings.accent];
  
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      frameloop={reduceMotion || !settings.enableAnimations ? "demand" : "always"}
    >
      <SceneContent colors={colors} reduceMotion={reduceMotion} />
    </Canvas>
  );
}
```

When `frameloop="demand"`, objects render once and don't animate. Components should check `reduceMotion` prop and skip `useFrame` when true.

## Step 8: Lighting setup

```tsx
<ambientLight intensity={0.4} />
<directionalLight position={[5, 5, 5]} intensity={1.5} color={colors.secondary} />
<directionalLight position={[-3, -2, 3]} intensity={0.8} color={colors.primary} />
<pointLight position={[0, 0, 3]} intensity={0.8} color={colors.secondary} />
{/* Add drei Environment for metal reflections: */}
<Suspense fallback={null}>
  <Environment preset="city" />
</Suspense>
```

Environment preset adds realistic reflections on the metal surfaces. Import from `@react-three/drei`.

## Step 9: Remove FingerprintArc and LightRays

The FingerprintArc is a 2D arc that doesn't read as a fingerprint. The LightRays are large transparent planes that don't add much. Both can be removed to simplify the scene.

## Verification

1. `npm run build` — no TS errors
2. Check scene loads on landing page
3. Change accent color → all 3D elements change color (wait for re-render)
4. Toggle dark mode → verify scene looks good against dark bg
5. Move mouse → camera subtly follows
6. Enable `prefers-reduced-motion` in DevTools → scene becomes static
7. Toggle "Enable 3D" off in settings → landing shows fallback spinner/content only
8. Frame rate stable at 60fps (DevTools Performance tab)
9. No `Date.now()` anywhere in the file