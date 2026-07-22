# Plan: Login 3D Scene + Login Page Redesign

**Prereq:** Audit doc `05-login-3d.md`  
**Target files:** `src/components/LoginScene.tsx` (NEW), `src/app/login/page.tsx`, `src/components/LoginForm.tsx`

## Step 1: Create LoginScene.tsx — dedicated 3D component

A calmer, focused scene with a central 3D padlock:

```tsx
// src/components/LoginScene.tsx
"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";
import { useTheme } from "@/contexts/ThemeContext";
import { useReducedMotion } from "framer-motion";

const accentColors = { /* same map as IDGuardScene */ };

function LockModel({ colors }: { colors: { primary: string; secondary: string; emissive: string } }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
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

function AmbientGlow({ colors }: { colors: { secondary: string } }) {
  // Large soft sphere behind lock for depth
  return (
    <mesh position={[0, 0, -1]} scale={2.5}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color={colors.secondary} transparent opacity={0.05} />
    </mesh>
  );
}

function LoginParticles({ colors }: { colors: { secondary: string } }) {
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
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={80} array={positions} itemSize={3} />
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
      <LockModel colors={colors} />
      <AmbientGlow colors={colors} />
      <LoginParticles colors={colors} />
    </Canvas>
  );
}
```

## Step 2: Update login/page.tsx

### 2.1 Replace IDGuardScene with LoginScene
```tsx
// BEFORE:
const IDGuardScene = dynamic(() => import("@/components/IDGuardScene"), { ssr: false, ... });

// AFTER:
const LoginScene = dynamic(() => import("@/components/LoginScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});
```

### 2.2 Fix page background
```tsx
// BEFORE:
<div className="... bg-[#F8F6F2] ...">

// AFTER:
<div className="... bg-alt ...">
```

### 2.3 Fix gradient orbs
```tsx
// BEFORE:
<div className="... bg-gradient-to-br from-[#3B82F6]/8 to-transparent ...">
<div className="... bg-gradient-to-tl from-[#183B6B]/8 to-transparent ...">

// AFTER:
<div className="... bg-gradient-to-br from-[var(--link)]/8 to-transparent ...">
<div className="... bg-gradient-to-tl from-[var(--accent)]/8 to-transparent ...">
```

### 2.4 Fix floating text overlay
```tsx
// BEFORE:
<motion.h2 className="text-2xl sm:text-3xl font-heading text-[#183B6B] mb-2">
  Welcome Back
</motion.h2>
<motion.p className="text-[#6B7280] text-base ...">

// AFTER:
<motion.h2 className="text-2xl sm:text-3xl font-heading text-accent mb-2">
  Welcome Back
</motion.h2>
<motion.p className="text-text-secondary text-base ...">
```

### 2.5 Fix gradient overlay
```tsx
// BEFORE:
<div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#F8F6F2] to-transparent" />

// AFTER:
<div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
```

### 2.6 Respect settings.enable3D
```tsx
const { settings } = useTheme();
// ...
{settings.enable3D ? <LoginScene /> : (
  <div className="w-full h-full flex items-center justify-center">
    <Image src="/logos/id_guard_logo.png" alt="IDGuard" width={120} height={120} />
  </div>
)}
```

## Step 3: LoginForm color fixes (18 replacements)

Apply the replacement table from Plan 02:
- `bg-[#183B6B]` → `bg-accent`
- `hover:bg-[#2A5CA5]` → `hover:bg-accent-hover`
- `bg-white` → `bg-card`
- `border-[#E5E7EB]` → `border-border-card`
- `text-[#1F2937]` → `text-foreground`
- `text-[#6B7280]` → `text-text-secondary`
- `text-[#9CA3AF]` → `text-text-muted`
- `focus:border-[#3B82F6]` → `focus:border-focus-ring`
- `shadow-[0_0_0_3px_rgba(59,130,246,0.1)]` → use CSS class `.focus-ring-shadow` (add to globals.css) or `focus:ring-2 focus:ring-[var(--focus-ring)]/30`
- `bg-[#E5E7EB]` decorative lines → `bg-border-card`
- `bg-red-50 border-red-200` → `bg-error-soft border-error-soft`
- `text-[#EF4444]` → `text-error`
- `border-[#EF4444]` via red-600 → `border-error`
- `bg-[#3B82F6] border-t-transparent` (spinner) → `bg-[var(--accent)] border-t-transparent`

### LoginForm focus ring shadow fix
```tsx
// BEFORE:
className="... focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"

// AFTER (add CSS in globals.css):
.input-focus-ring {
  outline: none;
  border-color: var(--focus-ring);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus-ring) 15%, transparent);
}

// In LoginForm:
className="... focus:outline-none focus:border-focus-ring focus:ring-2 focus:ring-[var(--focus-ring)]/20"
// Or use a single utility: just remove the inline shadow and rely on :focus-visible from globals.css
```

## Step 4: Noscript fallback

```tsx
// In login/page.tsx, add inside the 3D container:
<noscript>
  <div className="w-full h-full flex items-center justify-center bg-alt">
    <Image src="/logos/id_guard_logo.png" alt="IDGuard" width={120} height={120} />
  </div>
</noscript>
```

## Verification

1. `npm run build` — no TS errors
2. Open login page in light mode → 3D lock visible on left, form on right
3. Toggle dark mode → lock model adapts, page bg dark, form inputs dark
4. Change accent → lock model and keyhole change color
5. Toggle "Enable 3D" off in settings → login shows static logo instead
6. Mobile (`375px`) → 3D hidden, form only (existing behavior)
7. `prefers-reduced-motion` → lock static, no float
8. Tab through form → focus ring visible on each field
9. Submit invalid creds → error banner visible in both themes
10. Submit valid creds → redirects to dashboard