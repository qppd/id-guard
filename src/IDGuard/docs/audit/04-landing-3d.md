# Audit: Landing 3D Scene (`src/components/IDGuardScene.tsx`)

**Date:** 2026-07-22  
**File:** `src/components/IDGuardScene.tsx` (278 lines, 8,009 bytes)  
**Hardcoded colors:** 6 instances (all in JS/Three.js materials)

## Current State

### Scene Components
1. **Particles** — 150-200 random points in a cube, slow rotation, `#3B82F6` points material
2. **ScanRings** — 3 line-segment rings at different radii/tilts, rotating at different speeds
   - Ring 1: radius 2.2, flat XY plane, `#3B82F6` opacity 0.3
   - Ring 2: radius 2.6, tilted 45°, `#60A5FA` opacity 0.2
   - Ring 3: radius 2.0, tilted -30°/+60°, `#3B82F6` opacity 0.15
3. **ShieldCore** — central focal element
   - TorusKnot (1.5, 0.15) — `#183B6B`, metalness 0.9, roughness 0.1, distort 0.05
   - Octahedron (radius 0.9) — `#3B82F6`, metalness 0.95, emissive `#3B82F6` 0.3 intensity, distort 0.15
   - Inner Sphere (radius 0.5) — `#3B82F6` transparent opacity 0.15
   - 6 orbiting micro-spheres — `#60A5FA`, radius 0.06
4. **FingerprintArc** — 5 concentric arc lines at z=1.4, `#60A5FA` decreasing opacity
5. **LightRays** — 3 large semi-transparent planes above, `#3B82F6` opacity 0.03

### Lighting Setup
- Ambient: intensity 0.4
- Directional 1: [5,5,5] intensity 1.5, `#60A5FA`
- Directional 2: [-3,-2,3] intensity 0.8, `#3B82F6`
- Point light: [0,0,3] intensity 0.8, `#3B82F6`
- Spot light: [0,5,3] intensity 0.6, `#60A5FA`, angle 0.3, penumbra 1

### Canvas Config
- Camera: position [0,0,6], FOV 45
- DPR: [1, 2] (retina-ready)
- Antialias: true, Alpha: true (transparent bg)
- Background: "transparent"

## Issues

### 1. Hardcoded Colors (not themeable)
All material colors are hex strings in JS. When user changes accent from blue to green, the 3D scene stays blue. The scene should read accent from ThemeContext.

### 2. Date.now() in useFrame (performance)
Multiple components call `Date.now()` inside `useFrame`:
- ShieldCore: `Math.sin(Date.now() * 0.0005)` — line 117
- ShieldCore glow: `Math.sin(Date.now() * 0.003)` — line 120
- ShieldCore orbit positions: `Math.cos(angle + Date.now() * 0.0002)` — line 169-170

**Problem:** `Date.now()` forces evaluation every frame. Should use the `clock` from `useFrame((state, delta) => ...)` and `state.clock.elapsedTime` instead. More stable, better for SSR consistency, and allows time-scale manipulation.

### 3. Orbit positions computed in render, not in useFrame
Lines 169-170: `Math.cos(angle + Date.now() * 0.0002) * radius` — this is evaluated during React render, not during the animation frame. Since `Float` wraps this and `useFrame` only controls group rotation, the orbiting spheres don't actually orbit — they're static! They just float in place at their initial computed position.

**Fix:** Move the orbit animation into a `useFrame` that updates mesh positions per-frame.

### 4. Memory allocation in useFrame
Several `useMemo` blocks create geometries — that's fine. But the `Float` component's children are mapped in render creating new `<mesh>` elements each frame potentially. The orbiting spheres' `position` array is re-evaluated on every render.

### 5. No interaction
The scene doesn't respond to mouse/hover. For a landing page, subtle mouse-following camera or parallax would add polish.

### 6. No reduced-motion support
The scene animates infinitely with no way to pause for accessibility. Should respect `prefers-reduced-motion`.

### 7. FingerprintArc doesn't look like a fingerprint
The arc lines are flat 2D curves. A real fingerprint scanner has concentric ellipses with ridge-like patterns. The current implementation is more abstract than representational.

## Redesign Goals

Transform IDGuardScene from "abstract security orb" to **"digital identity vault"**:

1. **Shield/Lock motif** — central geometric lock shape (rounded box + shackle torus) instead of torus knot
2. **Biometric scanner ring** — concentric scanning rings that pulse outward (like a fingerprint being scanned)
3. **Data stream particles** — particles flowing along curved paths (representing encrypted data), not random cube
4. **Themeable colors** — read from `useTheme()` context, pass as uniforms
5. **Mouse parallax** — camera subtly follows cursor
6. **Reduced motion mode** — static pose when `prefers-reduced-motion`
7. **Better lighting** — environment map for realistic metal reflections (drei `Environment`)

## Technical Approach

### Props-based theming
```tsx
// Instead of hardcoded colors:
<color attach="background" args={["transparent"]} />
// Use:
<IDGuardScene accentColor={settings.accent} />
```

### Accent → Three.js color mapping
```tsx
const accentMap: Record<AccentColor, { primary: string; secondary: string; emissive: string }> = {
  blue:   { primary: "#183B6B", secondary: "#3B82F6", emissive: "#3B82F6" },
  green:  { primary: "#166534", secondary: "#22C55E", emissive "#22C55E" },
  purple: { primary: "#581C87", secondary: "#A855F7", emissive: "#A855F7" },
  orange: { primary: "#9A3412", secondary: "#F97316", emissive: "#F97316" },
  teal:   { primary: "#115E59", secondary: "#14B8A6", emissive: "#14B8A6" },
  pink:   { primary: "#831843", secondary: "#EC4899", emissive: "#EC4899" },
};
```

### Performance improvements
- Replace `Date.now()` with `state.clock.elapsedTime`
- Move orbit animation into `useFrame` with actual position updates
- Use `Points` from drei instead of manual `BufferGeometry` for particles
- Consider `InstancedMesh` for orbiting micro-spheres
- Add `frameloop="demand"` option when reduced-motion is enabled