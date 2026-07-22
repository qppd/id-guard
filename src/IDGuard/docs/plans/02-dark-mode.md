# Plan: Dark Mode Hardcore Color Fixes

**Prereq:** Audit doc `02-dark-mode.md`  
**Target files:** 11 component/page files + `globals.css`

## Phase A: globals.css additions (ADD FIRST — everything else depends on these)

### A1. Status color utility classes
Add after the existing `.bg-sky` class:
```css
.text-success { color: var(--status-success); }
.text-warning { color: var(--status-warning); }
.text-error   { color: var(--status-error); }
.bg-success-soft { background-color: color-mix(in srgb, var(--status-success) 12%, transparent); }
.bg-warning-soft { background-color: color-mix(in srgb, var(--status-warning) 12%, transparent); }
.bg-error-soft   { background-color: color-mix(in srgb, var(--status-error) 12%, transparent); }
.border-success-soft { border-color: color-mix(in srgb, var(--status-success) 30%, transparent); }
.border-warning-soft { border-color: color-mix(in srgb, var(--status-warning) 30%, transparent); }
.border-error-soft   { border-color: color-mix(in srgb, var(--status-error) 30%, transparent); }
```

### A2. Accent light var
Add to `:root`:
```css
--accent-light: #60A5FA;
--accent-dark: #1E3A5F;
```
Add to `.dark`:
```css
--accent-light: #93C5FD;
--accent-dark: #1E3A5F;
```

### A3. Dark-mode accent lightness boosts
Add after `[data-accent]` blocks:
```css
.dark[data-accent="blue"]   { --accent-lgt: 55%; }
.dark[data-accent="green"]  { --accent-lgt: 55%; }
.dark[data-accent="purple"] { --accent-lgt: 65%; }
.dark[data-accent="orange"] { --accent-lgt: 60%; }
.dark[data-accent="teal"]   { --accent-lgt: 55%; }
.dark[data-accent="pink"]   { --accent-lgt: 65%; }
```

### A4. Accessibility additions
```css
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Phase B: Component find-replace (11 files)

### Replacement table (apply consistently to ALL files):
| Search | Replace |
|--------|---------|
| `text-[#183B6B]` | `text-accent` |
| `text-[#2A5CA5]` | `text-accent-hover` |
| `text-[#3B82F6]` | `text-link` |
| `text-[#60A5FA]` | `text-link` |
| `text-[#1F2937]` | `text-foreground` |
| `text-[#6B7280]` | `text-text-secondary` |
| `text-[#9CA3AF]` | `text-text-muted` |
| `bg-[#183B6B]` | `bg-accent` |
| `bg-[#2A5CA5]` | `bg-accent-hover` |
| `hover:bg-[#2A5CA5]` | `hover:bg-accent-hover` |
| `hover:bg-[#DCEEFF]` | `hover:bg-sky` |
| `hover:text-[#183B6B]` | `hover:text-accent` |
| `bg-[#F8F6F2]` | `bg-alt` |
| `bg-[#DCEEFF]` | `bg-sky` |
| `bg-white` | `bg-card` |
| `border-[#E5E7EB]` | `border-border-card` |
| `border-white` | `border-border-card` |
| `text-[#22C55E]` | `text-success` |
| `text-[#F59E0B]` | `text-warning` |
| `text-[#EF4444]` | `text-error` |
| `bg-green-50 border-green-200` | `bg-success-soft border-success-soft` |
| `bg-red-50 border-red-200` | `bg-error-soft border-error-soft` |
| `bg-yellow-50 border-yellow-200` | `bg-warning-soft border-warning-soft` |
| `hover:text-red-700` | `hover:text-error` |
| `from-[#183B6B]` | `from-[var(--accent)]` |
| `via-[#3B82F6]` | `via-[var(--link)]` |
| `to-[#60A5FA]` | `to-[var(--accent-light)]` |
| `to-[#1E3A5F]` | `to-[var(--accent-dark)]` |
| `shadow-[#183B6B]/25` | `shadow-[var(--accent)]/25` |

### File-by-file order (least risky → most risky):

1. **`src/app/globals.css`** — add items A1-A4 (already in plan separate). **This MUST be done first.**
2. **`src/components/Navbar.tsx`** — 8 replacements
3. **`src/components/Parallax.tsx`** — fix GlowCard's hardcoded `rgba(59, 130, 246, 0.3)` → `var(--focus-ring)` or keep as `'rgba(' + accent + '0.3)'` via JS — actually GlowCard toggles via `whileHover={{ boxShadow: ... }}`. Replace with a class-based glow that reads the CSS var.
4. **`src/app/login/page.tsx`** — 12 replacements
5. **`src/components/LoginForm.tsx`** — 18 replacements
6. **`src/app/page.tsx`** — 52 replacements (covered by Plan 01)
7. **`src/app/dashboard/page.tsx`** — 20 replacements
8. **`src/app/gateways/page.tsx`** — 16 replacements
9. **`src/app/keys/page.tsx`** — 20 replacements
10. **`src/app/settings/page.tsx`** — 22 replacements (covered by Plan 03)
11. **`src/app/locks/[id]/page.tsx`** — 48 replacements
12. **`src/components/LockCard.tsx`** — 14 replacements

### Specific gotchas

**lock detail page (line 250):**
```tsx
// BEFORE:
const batteryColor = ... ? "text-[#22C55E]" : "text-[#F59E0B]" : "text-[#EF4444]"
const batteryBg = ... ? "bg-green-50" : "bg-yellow-50" : "bg-red-50"

// AFTER:
const batteryColor = ... ? "text-success" : "text-warning" : "text-error"
const batteryBg = ... ? "bg-success-soft" : "bg-warning-soft" : "bg-error-soft"
```

**IDGuardScene.tsx** — 6 color literals in JS not CSS, needs props-based approach. Defer to Plan 04.

**Parallax.tsx GlowCard (line ~140):**
```tsx
whileHover={{ boxShadow: "0 0 30px rgba(59, 130, 246, 0.15)" }}
// Can't easily use CSS var here in framer-motion. Solution: read CSS var via getComputedStyle.
// Simpler: use a CSS class instead:
whileHover="glow-card:active"  // no, framer-motion doesn't support class-based
// Best solution: accept slight variance, or read getComputedStyle("var(--focus-ring")) once at mount. Actually acceptable: since the value is hardcoded blue, when user changes accent away from blue, the glow stays blue — not ideal but low-priority.
// DECISION: defer GlowCard fix to Plan 06 (Animations)
```

## Verification

1. `npm run build` — no TS errors
2. Toggle dark mode → EVERY page should adapt
3. Cycle through all 6 accent colors on dark mode → accent buttons, headings, links all change hue
4. No remaining hardcoded hex colors: `grep -rn '#183B6B\|#3B82F6\|#1F2937\|#6B7280\|#9CA3AF\|#E5E7EB\|#F8F6F2\|#DCEEFF\|#2A5CA5\|#22C55E\|#F59E0B\|#EF4444' src/ --include="*.tsx" --include="*.ts" | grep -v globals.css | wc -l` → should output 0 (only 3D scene colors & possibly GlowCard remind temporarily)
5. No `bg-white` or `bg-red-50` or `bg-green-50` hardcoded Tailwind classes in any TSX file