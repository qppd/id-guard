# Audit: Login 3D Scene + Login Page

**Date:** 2026-07-22  
**Files:** `src/app/login/page.tsx` (98 lines), `src/components/IDGuardScene.tsx` (shared), `src/components/LoginForm.tsx` (173 lines)

## Login Page Structure

### Layout
- Split-screen: left 50% = 3D scene, right 50% = login form
- Mobile: hides 3D scene (`hidden lg:flex`), shows form only
- Animated background gradients (2 blurred orbs)
- Loading state: centered "Loading..." with opacity pulse
- Redirects to `/dashboard` if already authenticated

### Hardcoded Colors (login/page.tsx — 12 instances)
| Color | Usage | Count |
|-------|-------|-------|
| `#F8F6F2` | Page bg, loading bg | 2 |
| `#3B82F6` | Spinner border | 1 |
| `#183B6B` | Floating text heading, gradient overlay | 2 |
| `#6B7280` | Floating text paragraph | 1 |
| `#3B82F6/8` | Gradient orb | 1 |
| `#183B6B/8` | Gradient orb | 1 |
| `#183B6B/5` | Gradient overlay | 1 |
| `transparent` | Via gradient | 1 |

### LoginForm Component (173 lines, 18 hardcoded colors)
| Color | Usage | Count |
|-------|-------|-------|
| `#183B6B` | Submit button bg, hover bg | 2 |
| `#2A5CA5` | Button hover | 1 |
| `#3B82F6` | Focus ring shadow (rgba) | 3 |
| `#E5E7EB` | Input border, decorative lines | 3 |
| `#1F2937` | Input text | 2 |
| `#6B7280` | Labels | 2 |
| `#9CA3AF` | Placeholder, secure connection text | 2 |
| `#FFFFFF` | Button text, spinner border | 2 |
| `#EF4444` | (via red-50/red-200/red-600 classes) | 1 |
| `bg-white` | Input wrapper bg | 2 |
| `bg-red-50` | Error box bg | 1 |
| `border-red-200` | Error border | 1 |

## Issues

### 1. Same 3D scene as landing — no differentiation
The login page uses the exact same `IDGuardScene` component as the landing page. No visual distinction between "marketing hero" and "login portal". The login should feel more intimate/focused — smaller, calmer, less busy.

### 2. Login page background hardcoded
`bg-[#F8F6F2]` is the cream background. In dark mode, this will be a bright cream rectangle on dark nav. Should use `bg-background` or `bg-alt`.

### 3. LoginForm hardcoded everywhere
Same issue as all other components — all 18 colors bypass the theme system. In dark mode:
- `bg-white` inputs will glow on dark bg
- `text-[#1F2937]` input text will be invisible
- `border-[#E5E7EB]` will be too light
- `bg-[#183B6B]` button will blend into dark bg

### 4. Floating text overlay on 3D scene
The "Welcome Back" text overlay (`absolute bottom-16 left-12`) is positioned absolutely on the 3D scene side. `text-[#183B6B]` heading will be invisible on a dark 3D scene in dark mode. The gradient overlay `from-[#183B6B]/5` is hardcoded.

### 5. No dark-mode gradient overlays
The gradient overlays (`from-[#F8F6F2]`, `from-[#183B6B]/5`) are hardcoded for light mode. Need dark-mode equivalents.

### 6. Spinner border
`border-[#3B82F6] border-t-transparent` — hardcoded accent. Should use `--accent` or `--link`.

### 7. "Secure Connection" decorative lines
`bg-[#E5E7EB]` animated width lines — will be invisible on light bg in certain scenes but ok-ish in dark. Inconsistent.

## Redesign Goals for Login 3D

The login page 3D should be a **calmer, more focused** version of the landing scene:

1. **Smaller/slower** — reduce motion intensity by 50%, fewer particles
2. **Centered lock icon** — a 3D padlock or keyhole instead of the full shield-core assembly
3. **Ambient glow** — soft radial gradient behind the lock, no scan rings
4. **Theme-aware** — dark colors in dark mode, light in light mode
5. **Loading state** — 3D scene should show a loading skeleton while WebGL initializes
6. **Cursor interaction** — lock subtly rotates toward cursor position

## Proposed: Separate LoginScene Component

Instead of reusing `IDGuardScene`, create a dedicated `LoginScene.tsx`:

```tsx
function LoginScene() {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 45 }} dpr={[1, 2]}>
      <ambientLight intensity={0.5} />
      <(directionalLight position={[3, 3, 3]} intensity={1} />
      <LockModel />  // 3D padlock
      <AmbientGlow /> // soft radial glow
      <LoginParticles count={50} /> // fewer, slower
    </Canvas>
  );
}
```

### LockModel design
- RoundedBox body (1.2 × 0.9 × 0.4) — metalness 0.9
- Torus shackle (radius 0.35, tube 0.08) — positioned above
- Keyhole cylinder on front face — emissive accent color
- Slow rotation (0.05 rad/s on Y axis)
- Subtle float (drei `Float` with speed 0.5, intensity 0.2)