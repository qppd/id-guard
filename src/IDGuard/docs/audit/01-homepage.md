# Audit: Homepage (`src/app/page.tsx`)

**Date:** 2026-07-22  
**File:** `src/app/page.tsx` (283 lines, 11,914 bytes)  
**Hardcoded colors:** 52 instances

## Current State

### Structure
- Full-page landing with 4 sections: Hero, Features, Stats/Trust, CTA, Footer
- Uses `AnimatedBackground` component (fixed gradient orbs + SVG grid)
- 3D scene (`IDGuardScene`) dynamically imported with suspended SSR
- Scroll-driven parallax via Framer Motion (`useScroll`, `useTransform`, `useSpring`)
- Mouse parallax on stats section via `MouseParallaxLayer`
- Feature cards use `GlowCard` wrapper with hover-based glow

### Logo Usage
- Hero: `id_guard_logo+name.png` — 280×84px base, responsive `w-[200px] sm:w-[240px] lg:w-[280px]`
- Footer: `id_guard_logo.png` — 24×24px inline

### Hero Content
- H1: "Your Digital Identity, Guarded" — gradient text (Deep Navy → Royal Blue → Light Blue)
- Subtitle: "#1F2937" (Charcoal) — never adapts to dark or light mode
- Two CTA buttons: "Get Started" (filled `#183B6B`) and "Learn More" (outlined)

### Hardcoded Colors (52 occurrences)
| Color | Meaning | Occurrences |
|-------|---------|-------------|
| `#183B6B` | Deep Navy (primary) | 13 — headings, buttons, text |
| `#3B82F6` | Royal Blue (accent) | 7 — gradient, feature icons, background orbs |
| `#60A5FA` | Light Blue | 2 — background orbs, gradient |
| `#1F2937` | Charcoal (text) | 2 — subtitle text |
| `#6B7280` | Slate (secondary text) | 5 — descriptions, footer |
| `#9CA3AF` | Muted (scroll indicator) | 1 |
| `#E5E7EB` | Light Gray (border) | 3 — feature cards, footer border |
| `#F8F6F2` | Warm Cream (gradient overlay) | 1 |
| `#DCEEFF` | Sky Blue (hover bg) | 2 |
| `#1E3A5F` | Dark Navy (CTA bg) | 1 |
| `#2A5CA5` | Medium Blue (hover) | 1 |
| `#183B6B`/25 | Navy at 25% opacity | 1 |

### Dark Mode Impact
**Broken entirely.** Every single color is hardcoded. Dark mode provides different CSS vars in `globals.css`, but this page never reads them. The heading "Your Digital Identity, Guarded" will be Deep Navy on dark background → invisible. Cards will be white (`bg-white`) on `#1E293B` background → jarring. Feature cards are `bg-white` with `border-[#E5E7EB]` — no theme adaptivity.

## What Needs Fixing

1. **Every hardcoded hex → CSS custom property** (`text-foreground`, `bg-card`, `border-border-card`, etc.)
2. **`bg-white` → `bg-card`** — 4 instances (feature cards, CTA button)
3. **`text-[#183B6B]` → `text-accent`** — headings/buttons
4. **`text-[#6B7280]` → `text-text-secondary`** — descriptions
5. **`text-[#1F2937]` → `text-foreground`** — subtitle
6. **`border-[#E5E7EB]` → `border-border-card`** — cards, footer
7. **`bg-[#183B6B]` → `btn-primary` or `bg-accent`** — buttons
8. **Hero gradient text** — needs dark-mode-aware gradient (swap colors based on theme)
9. **Logo sizing** — should use `.logo-responsive` CSS class instead of inline Tailwind widths
10. **Hero background** — `from-[#F8F6F2]/30 to-background` uses `to-background` (correct!) but `via` is hardcoded

## Fix Approach

Replace ALL classes with theme-aware utility classes from globals.css:
| Hardcoded | Replacement |
|-----------|-------------|
| `text-[#183B6B]` | `text-accent` |
| `text-[#1F2937]` | `text-foreground` |
| `text-[#6B7280]` | `text-text-secondary` |
| `text-[#9CA3AF]` | `text-text-muted` |
| `bg-white` | `bg-card` |
| `bg-[#183B6B]` | `bg-accent` |
| `border-[#E5E7EB]` | `border-border-card` |
| `bg-[#DCEEFF]` | `bg-sky` or `bg-accent-bg` (for darker bg in light) |
| `hover:bg-[#DCEEFF]` | `hover:bg-sky` |
| `hover:bg-[#2A5CA5]` | `hover:bg-accent-hover` |
| `hover:text-[#183B6B]` | `hover:text-accent` |
| `from-[#183B6B]` | `from-accent` (will scale to current accent hue) |

### Gradients (Special Handling)
Hero gradient text: `bg-gradient-to-r from-accent via-accent to-[#60A5FA]` — the via/accent picks up the current accent hue, "to" color needs a CSS var like `--accent-light` or use `--link` which = `#60A5FA` in light mode.

CTA card gradient: `bg-gradient-to-br from-[#183B6B] to-[#1E3A5F]` → `bg-gradient-to-br from-accent to-[#1E3A5F]` — dark blue gradient stays dark in both modes (CTA is intentionally dark). Check: does it clash with dark background? CTA card will merge into dark bg. **Recommendation**: add a subtle border or keep it as `bg-accent` flat.

Background orbs: `from-[#3B82F6]/10` → use accent CSS var in gradient. The `/10` opacity is Tailwind syntax; can be `from-accent/10`.

### Animation Audit
- `ParallaxLayer` — scroll-driven Y transforms ✓
- `MouseParallaxLayer` — mouse-follow ✓
- `FadeInView` — scroll-triggered fade-in ✓
- `HoverScale` — hover scale ✓
- `GlowCard` — hover glow ✓
- Hero: `springOpacity + springScale` driven by scroll — fade out hero content/3D on scroll ✓

No animation bugs identified. Performance: R3F scene properly SSR-disabled with fallback loading spinner.