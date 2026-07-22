# Audit: Animations, Responsive, Accessibility, Performance

**Date:** 2026-07-22  
**Files:** `src/components/Parallax.tsx`, all pages, `src/components/IDGuardScene.tsx`

## Animations

### Parallax.tsx (156 lines) — Component Library
| Component | Purpose | Implementation |
|-----------|---------|---------------|
| `ParallaxLayer` | Scroll-driven Y movement | `useScroll` + `useTransform` + `useSpring` |
| `useMouseParallax` | Track mouse position | `mousemove` → state {x, y} in [-1, 1] |
| `MouseParallaxLayer` | Mouse-follow parallax | spring animation on x/y |
| `FadeInView` | Scroll-triggered fade-in | `whileInView` + direction-aware offset |
| `HoverScale` | Hover tap feedback | spring scale on hover/tap |
| `StaggerFadeIn` | Sequential children fade | wraps FadeInView with index-based delay |
| `GlowCard` | Hover glow shadow | `whileHover` boxShadow |

### Issues
1. **No `prefers-reduced-motion` support** — all animations run regardless of user preference. WCAG 2.1 SC 2.3.3 requires respecting reduced motion.
2. **`useMouseParallax` always-on** — `mousemove` listener always active, causing re-renders on every mouse move. Should be throttled/raf-throttled.
3. **`StaggerFadeIn` uses index keys** — `key={i}` is an anti-pattern for dynamic lists (but ok for static).
4. **`GlowCard` hardcoded color** — `rgba(59, 130, 246, 0.3)` — hardcoded blue glow, not themeable.
5. **`FadeInView` margin** — `margin: "-50px"` triggers when 50px into viewport. Reasonable.
6. **No `exit` animations** — components don't animate out on unmount. Not critical but missing polish.
7. **Framer Motion `whileInView` viewport `once: true`** — good, prevents re-trigger on scroll back.

### Recommended Animation Improvements
1. Add `useReducedMotion` hook from Framer Motion → disable transform animations, keep opacity
2. Throttle `useMouseParallax` with `requestAnimationFrame`
3. Replace `GlowCard` hardcoded rgba with CSS var-based shadow
4. Add page transition animations (Next.js App Router doesn't have built-in transitions)
5. Add skeleton loading states for data-heavy pages (dashboard, lock detail)

---

## Responsive Design

### Current Breakpoints (globals.css)
| Prefix | Min Width | Tailwind equivalent |
|--------|-----------|-------------------|
| (none) | 0px | base |
| `sm:` | 640px | sm |
| `md:` | 768px | md |
| `lg:` | 1024px | lg |
| `xl:` | 1536px | xl |
| 2000px | 2000px | (custom) |

### Responsive CSS Classes
- `.container-page` — max-width 1280px → 1400px at xl, responsive padding
- `.container-settings` — max-width 42rem → 48rem at lg → 56rem at xl
- `.grid-summary` — 1 col → 3 col at sm
- `.grid-locks` — 1 → 2 at sm → 3 at lg → 4 at xl → 5 at 2000px
- `.grid-detail-info` — 2 col → 3 col at sm
- `.grid-2col-responsive` — 1 → 2 at md
- `.detail-header-info` — gap scaling only
- `.logo-responsive` — 200px → 240px at sm → 280px at lg
- `.logo-small-responsive` — 140px → 200px at sm
- `.text-responsive-xl/2xl` — shrinks at 480px

### Issues
1. **`.text-responsive-xl/2xl` uses `max-width: 480px`** — non-standard breakpoint, doesn't match Tailwind's system. Should use 640px (sm) or remove.
2. **Lock detail page** — `.grid-detail-info` is 2-col on mobile. With 6 info fields in 2 cols, it's ok but cramped on very small screens.
3. **Login page** — Hidden 3D on mobile (`hidden lg:flex`). Good — saves performance. But the transition between showing/hiding at lg breakpoint is abrupt.
4. **Navbar** — Mobile hamburger menu works but no animation on open/close. Just conditional render.
5. **No print styles** — No `@media print` rules.
6. **Lock detail page content sections** — 2-col grid can make passcodes/IC cards/fingerprints/gateways very narrow on tablets.

### Recommended Fixes
1. Remove `.text-responsive-xl/2xl`, use standard Tailwind responsive text sizing
2. Add slide-down animation to mobile navbar
3. Add `@media print` styles for lock detail page (hide buttons, show info only)
4. Add `min-w-0` to all flex children with `truncate` (already done in most places ✓)
5. Add `.container-page` to login page (currently full-width with custom flex)

---

## Accessibility

### Current State

| Requirement | Status | Notes |
|-------------|--------|-------|
| Semantic HTML | ⚠️ Partial | Uses `<nav>`, `<main>`, `<footer>`, `<section>` but many `<div>` where `<button>`/`<a>` needed |
| ARIA labels | ⚠️ Minimal | Only hamburger has `aria-label="Toggle menu"` |
| Focus visible | ❌ Missing | No `:focus-visible` styles. Custom `.focus:border-focus-ring` exists but not applied |
| Skip to content | ❌ Missing | No skip link for keyboard navigation |
| Color contrast | ❌ Broken | Dark text on dark bg in dark mode, light text on light bg issues |
| Alt text | ✓ Good | All images have alt text |
| Form labels | ✓ Good | All inputs have associated `<label htmlFor>` |
| Keyboard nav | ⚠️ Partial | Tab order works but no visible focus indicators |
| Screen reader | ⚠️ Minimal | No `aria-live` for dynamic content, no `role="status"` for loading |
| Reduced motion | ❌ Missing | No `prefers-reduced-motion` query |
| Heading hierarchy | ✅ Good | H1 → H2 → H3 consistent |
| Link distinguishing | ❌ Missing | Links in footer use `hover:text-[#183B6B]` — no underline by default |

### Critical Issues
1. **No focus-visible styles** — keyboard users can't see where they are
2. **No skip link** — keyboard users must tab through entire navbar on every page
3. **No aria-live regions** — error messages, loading states, API responses not announced
4. **No prefers-reduced-motion** — violates WCAG 2.1
5. **Color contrast** — `text-[#9CA3AF]` on `bg-white` = 2.85:1 (fails AA 4.5:1 for normal text)
6. **Navbar logo link** — no `aria-label`, screen reader reads "IDGuard image IDGuard" redundantly
7. **Mobile menu** — no `aria-expanded`, no `aria-controls`
8. **Toggle buttons in settings** — no `role="group"`, no `aria-pressed`
9. **Collapsible sections** in lock detail — no `aria-expanded`, no `aria-controls`
10. **3D Canvas** — no accessible fallback content

### Recommended Fixes
1. Add global `:focus-visible` outline style in globals.css
2. Add skip link `<a href="#main">Skip to content</a>` in layout
3. Add `aria-live="polite"` to error/message regions
4. Add `prefers-reduced-motion` media query → disable animations
5. Fix contrast: `--text-muted` should be darker in light mode (currently `#9CA3AF` → use `#6B7280`)
6. Add `aria-label` to logo links
7. Add `aria-expanded` + `aria-controls` to mobile menu toggle
8. Add `role="group"` + `aria-pressed` to ToggleBtn
9. Add `aria-expanded` to collapsible sections in lock detail
10. Add `role="status"` to loading spinners
11. Add `<noscript>` fallback for 3D scenes

---

## Performance

### Current State
- **R3F Canvas** — `dpr={[1, 2]}` ✓ (caps at 2x for retina)
- **SSR disabled for 3D** — `dynamic(() => import(...), { ssr: false })` ✓
- **SWR for data fetching** — good caching, revalidation on focus ✓
- **Fonts** — Poppins + Inter loaded via `next/font/google` ✓ (self-hosted)
- **Images** — `next/image` with explicit width/height ✓
- **No image optimization** — logos are PNG (112KB, 114KB, 30KB) — should be WebP/AVIF

### Issues
1. **236 hardcoded colors** — all critical-path CSS, but they're Tailwind classes so JIT-compiled. Not a runtime perf issue, but a maintenance issue.
2. **3D scene runs on every render** — `useFrame` callbacks run at 60fps. No `frameloop="demand"` option.
3. **Particles geometry re-created** — `useMemo` protects it ✓
4. **Date.now() in useFrame** — forces JS execution every frame for clock reading. Use `state.clock.elapsedTime`.
5. **Multiple SWR requests** — Lock detail page fires 8 parallel SWR requests. Each is independent but all hit API routes. Could batch into single endpoint.
6. **No Suspense boundaries** — pages don't wrap data-fetching in Suspense. SWR handles loading but no streaming.
7. **No code splitting** — Only the 3D scene is dynamically imported. Pages themselves are statically imported by Next.js (ok, App Router does this automatically).
8. **No service worker / PWA** — No offline support, no installable app manifest.

### Recommended Fixes
1. Replace `Date.now()` with `state.clock.elapsedTime` in IDGuardScene ✓ (easy win)
2. Add `frameloop="demand"` option when reduced-motion is enabled
3. Replace PNG logos with WebP or SVG
4. Add `<link rel="preload">` for logos
5. Consider batching lock detail API calls
6. Add `next/image` `priority` to above-the-fold logos only (already done for hero ✓)
7. Add `loading="lazy"` behavior (next/image does this by default ✓)
8. Lighthouse CI target: 90+ performance, 90+ accessibility