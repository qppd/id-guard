# Plan: Theme System Architecture Enhancements

**Prereq:** Audit doc `07-theme-system.md`  
**Target file:** `src/contexts/ThemeContext.tsx`, `src/app/globals.css`

## Part 1: globals.css additions

(Most of this is duplicated from Plan 02 for clarity. Execute Plan 02 first.)

### 1.1 Status color utilities
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

### 1.2 Accent light/dark vars
```css
:root {
  --accent-light: #60A5FA;
  --accent-dark: #1E3A5F;
}
.dark {
  --accent-light: #93C5FD;
  --accent-dark: #0F1A2E;
}
```

### 1.3 Dark-mode accent lightness boosts (needed when accent="blue" in dark mode)
```css
.dark[data-accent="blue"]   { --accent-lgt: 55%; }
.dark[data-accent="green"]  { --accent-lgt: 55%; }
.dark[data-accent="purple"] { --accent-lgt: 65%; }
.dark[data-accent="orange"] { --accent-lgt: 60%; }
.dark[data-accent="teal"]   { --accent-lgt: 55%; }
.dark[data-accent="pink"]   { --accent-lgt: 65%; }
```

### 1.4 Accessibility additions
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

/* Input focus ring utility */
.input-focus {
  border-color: var(--focus-ring);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus-ring) 15%, transparent);
}
```

## Part 2: ThemeContext.tsx updates

### 2.1 Add new settings (already in Plan 03)
```typescript
export interface ThemeSettings {
  // ... existing ...
  enable3D: boolean;
  enableAnimations: boolean;
}

const defaultSettings: ThemeSettings = {
  // ... existing ...
  enable3D: true,
  enableAnimations: true,
};
```

### 2.2 Fix system theme listener dependency
```tsx
// BEFORE:
useEffect(() => {
  if (settings.theme !== "system") return;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => applyTheme(settings);
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}, [settings]); // re-runs on every settings change

// AFTER:
useEffect(() => {
  if (settings.theme !== "system") return;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => applyTheme(settings);
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}, [settings.theme]); // only re-runs when theme mode changes
```

### 2.3 Add inline FOUC-prevention script in layout.tsx
```tsx
// In app/layout.tsx <head>:
<head>
  <script dangerouslySetInnerHTML={{ __html: `
    try {
      const s = JSON.parse(localStorage.getItem('ttlock-settings') || '{}');
      const root = document.documentElement;
      const theme = s.theme || 'light';
      if (theme === 'system') {
        root.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      } else {
        root.classList.add(theme);
      }
      root.setAttribute('data-accent', s.accent || 'blue');
      root.setAttribute('data-card-style', s.cardStyle || 'solid');
      root.setAttribute('data-border-style', s.borderStyle || 'full');
      root.setAttribute('data-card-density', s.cardDensity || 'default');
    } catch (e) {
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-accent', 'blue');
    }
  `}} />
</head>
```

This script runs before React hydrates, preventing any flash of incorrect theme.
The ThemeProvider's `visibility: hidden` approach (line ~88) can then be removed — or kept as a fallback. With the inline script, it's redundant. Remove it for a faster first paint.

```tsx
// In ThemeContext, remove the visibility:hidden toggle:
// BEFORE:
if (!mounted) return null; // or visibility hidden wrapper
// AFTER:
// Always render, inline script prevents FOUC
```

Actually, keep the `mounted` check for the SSR/client distinction in the settings value, but don't hide the DOM. The inline script handles initial paint. On mount, React hydrates with correct settings and `applyTheme` runs to sync.

## Part 3: Ensure all accent palettes work in dark mode

### 3.1 Test matrix
For each accent (blue, green, purple, orange, teal, pink) × each mode (light, dark):
- Is `bg-accent` visible? (button on bg)
- Is `text-accent` readable? (heading on card bg)
- Is `text-link` readable? (link on card bg)
- Is `bg-sky` (accent-bg-color) distinctive from bg?
- Does the focus ring have sufficient contrast?

### 3.2 Accent palette review (current values in globals.css)

| Accent | Light primary (`-h -s -l`) | Dark primary |
|--------|---------------------------|--------------|
| blue | `215 80% 26%` (`#183B6B`) | `215 80% 26%` (same!) |
| green | `160 80% 26%` | (assumed same pattern) |
| purple | `270 70% 32%` | (same) |
| orange | `25 90% 40%` | (same) |
| teal | `175 70% 28%` | (same) |
| pink | `320 80% 30%` | (same) |

**Problem:** Same hue/sat/light in light and dark mode. Blue at 26% lightness = `#183B6B` is fine on white, but barely visible on `#0F172A` dark bg.

**Fix:** Override `--accent-lgt` in `.dark[data-accent="..."]` blocks (from 26% → 55-65%) as written in Step 1.3. This is already in Plan 02.

## Verification

1. `npm run build` — no TS errors
2. DevTools → Application → Local Storage → `ttlock-settings`:
   - Change theme → key updates
   - Reload → correct theme applied
3. DevTools → Rendering → Emulate prefers-color-scheme:
   - dark → .dark class on html
   - light → .light class on html
   - System theme setting should auto-toggle
4. Cycle all 6 accents in both light and dark modes:
   - Each accent has visible buttons, readable headings, visible focus rings
5. No FOUC on reload (check DevTools → Performance → Reload profile)
6. Reduced-motion breakpoint → all animations disabled
7. `grep -rn 'Date.now' src/components/IDGuardScene.tsx` → empty (fixed in Plan 04)