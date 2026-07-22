# Plan: Animations, Responsive, Accessibility, Performance

**Prereq:** Audit doc `06-animations-a11y-perf.md`  
**Target files:** `src/components/Parallax.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, all pages

## Part 1: Animations

### 1.1 Reduced motion support in Parallax.tsx
```tsx
import { useReducedMotion } from "framer-motion";

// In FadeInView:
export function FadeInView({ children, delay = 0, ... }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div>{children}</div>; // no animation, just content
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

// In HoverScale:
export function HoverScale({ children, scale = 1.05, ... }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <>{children}</>;
  
  return (
    <motion.div whileHover={{ scale }} whileTap={{ scale: 0.95 }} ...>
      {children}
    </motion.div>
  );
}

// In ParallaxLayer:
export function ParallaxLayer({ children, speed = 0.3, className }) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  if (reduceMotion) return <div className={className}>{children}</div>;
  // ...
}

// In MouseParallaxLayer:
export function MouseParallaxLayer({ children, factor = 0.02, className }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  // ...
}
```

### 1.2 Throttle mouse parallax
```tsx
// In useMouseParallax:
export function useMouseParallax() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>();
  
  useEffect(() => {
    let targetPos = { x: 0, y: 0 };
    const handler = (e: MouseEvent) => {
      targetPos = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setPos(targetPos);
          rafRef.current = undefined;
        });
      }
    };
    window.addEventListener("mousemove", handler);
    return () => {
      window.removeEventListener("mousemove", handler);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
  
  return pos;
}
```

### 1.3 Fix GlowCard hardcoded color
```tsx
// Before: whileHover={{ boxShadow: "0 0 30px rgba(59, 130, 246, 0.15)" }}
// Can't use CSS var in framer-motion easily. Use getComputedStyle:

export function GlowCard({ children, className }) {
  const reduceMotion = useReducedMotion();
  const [glowColor, setGlowColor] = useState("");
  
  useEffect(() => {
    const updateGlow = () => {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue("--focus-ring")
        .trim();
      setGlowColor(color || "#3B82F6");
    };
    updateGlow();
    // Update when accent changes (context will cause re-render, but we need effect):
    const observer = new MutationObserver(updateGlow);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-accent", "class"],
    });
    return () => observer.disconnect();
  }, []);
  
  if (reduceMotion) return <div className={className}>{children}</div>;
  
  return (
    <motion.div
      className={className}
      whileHover={{ boxShadow: `0 0 30px ${glowColor}26` }} // 26 = ~15% opacity in hex
    >
      {children}
    </motion.div>
  );
}
```

### 1.4 Respect settings.enableAnimations in homepage
```tsx
// In app/page.tsx:
const { settings } = useTheme();
// Wrap all FadeInView/ParallaxLayer uses. If !settings.enableAnimations, return plain divs.
// Simplest: wrap the whole page in a conditional:
if (!settings.enableAnimations) {
  return <LandingPageStatic />; // same content but no motion components
}
```

Actually, simpler: FadeInView etc. already check `reduceMotion`. We can extend them to also check settings via a context hook:
```tsx
// In Parallax.tsx FadeInView:
const reduceMotion = useReducedMotion();
const { settings } = useTheme();
if (reduceMotion || !settings.enableAnimations) return <div>{children}</div>;
```

But Parallax.tsx importing useTheme creates a circular dep risk (page imports Parallax, Parallax imports context). It's fine — context is a provider, components consume it. No cycle.

### 1.5 Mobile navbar animation
```tsx
// In Navbar.tsx:
<AnimatePresence>
  {mobileOpen && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="lg:hidden overflow-hidden"
    >
      {/* menu items */}
    </motion.div>
  )}
</AnimatePresence>
```

Add `import { AnimatePresence, motion } from "framer-motion"` to Navbar.

## Part 2: Responsive

### 2.1 Remove non-standard breakpoint
In globals.css, remove or fix `.text-responsive-xl` and `.text-responsive-2xl`:
```css
/* BEFORE: */
.text-responsive-2xl { font-size: 1.5rem; }
@media (max-width: 480px) { .text-responsive-2xl { font-size: 1.25rem; } }

/* AFTER: Use Tailwind responsive prefixes in components instead. Remove these classes. */
```
No component actually uses these classes (verified in audit). Safe to remove.

### 2.2 Print styles for lock detail
Add to globals.css:
```css
@media print {
  .no-print, button, .animate-spin { display: none !important; }
  body { background: white !important; color: black !important; }
  .bg-card { background: white !important; border: 1px solid #ccc !important; }
}
```

## Part 3: Accessibility

### 3.1 Skip link in layout.tsx
```tsx
// In app/layout.tsx, before Navbar:
<body>
  <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded">
    Skip to content
  </a>
  <Navbar />
  <main id="main-content">
    {children}
  </main>
</body>
```

### 3.2 Navbar accessibility
```tsx
// Logo link:
<a href="/" aria-label="IDGuard home" className="flex items-center gap-2">
  <Image ... />
  <span className="font-heading font-bold text-lg text-accent">IDGuard</span>
</a>

// Mobile menu button:
<button
  aria-label="Toggle menu"
  aria-expanded={mobileOpen}
  aria-controls="mobile-menu"
  onClick={() => setMobileOpen(!mobileOpen)}
>
  ...
</button>

// Mobile menu:
<div id="mobile-menu" role="navigation" aria-label="Mobile navigation">
  ...
</div>
```

### 3.3 aria-live regions
In pages that show error/success messages (login, lock detail, passcodes, etc.):
```tsx
// Error/success banner:
<p aria-live="assertive" className="text-error ...">{err}</p>
<p aria-live="polite" className="text-success ...">{msg}</p>

// Loading states:
<div role="status" aria-label="Loading">
  <div className="animate-spin ..." />
  <span className="sr-only">Loading...</span>
</div>
```

### 3.4 Collapsible sections (lock detail)
```tsx
<button
  onClick={() => setRecordsExpanded(!recordsExpanded)}
  aria-expanded={recordsExpanded}
  aria-controls="records-content"
>
  Unlock Records ({recRes?.total ?? 0})
</button>
<div id="records-content" role="region" aria-label="Unlock records">
  {recordsExpanded && (...)}
</div>
```

### 3.5 Settings Toggle Btn already in Plan 03.

### 3.6 Link underlines
```css
/* In globals.css: */
a { text-decoration: underline; text-decoration-color: transparent; }
a:hover { text-decoration-color: currentColor; }
/* Or Tailwind utility: */
```
In footer and anywhere with links: add `underline-offset-4 hover:underline`.

### 3.7 3D canvas fallback
```tsx
// For IDGuardScene and LoginScene:
<div className="relative">
  <SceneComponent />
  <noscript>
    <div className="absolute inset-0 flex items-center justify-center bg-alt">
      <p>3D content requires JavaScript.</p>
    </div>
  </noscript>
</div>
```

## Part 4: Performance

### 4.1 3D scene improvements (covered in Plans 04 & 05)
- `state.clock.elapsedTime` instead of `Date.now()`
- `frameloop="demand"` when reduced motion or animations disabled
- Drei `Points` or `InstancedMesh` for particles

### 4.2 Image optimization
Convert logos to WebP format:
```bash
# (if tools available, or use online converter)
# Place .webp versions next to .png, reference in Image component:
<Image src="/logos/id_guard_logo+name.webp" ... />
```
Next.js Image automatically serves WebP if available in some configs. Alternatively, SVG logos would be best (infinite resolution, tiny size).

### 4.3 Lock detail API batching
Current: 8 parallel SWR requests on lock detail page.
Proposed: create a batch endpoint `/api/locks/[id]/all` that returns all data in one response.
```typescript
// src/app/api/locks/[id]/all/route.ts:
// Fetches detail, passcodes, records, gateways, ic-cards, fingerprints, door-sensor, config
// Returns combined JSON
```
This reduces HTTP overhead but increases single response size. Since all requests go to the same API server, batching is a net win. (Defer to Plan 06 — optimization phase.)

## Verification

1. `npm run build` — no TS errors
2. Toggle "prefers-reduced-motion: reduce" in DevTools → all animations disabled, content presents statically
3. Tab through every page → focus ring visible on all interactive elements
4. Screen reader (NVSA/VoiceOver) → announces loading states, errors, menu toggle, collapsible sections
5. Run Lighthouse audit → Performance 90+, Accessibility 90+, Best Practices 90+
6. Check `useMouseParallax` → no excessive re-renders (DevTools Profiler)
7. Footer links have visible underline on hover
8. Lock detail page → collapsible sections announce state correctly
9. Mobile navbar → menu opens/closes with animation, aria-expanded updates
10. Print preview of lock detail → clean output without buttons