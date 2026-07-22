# Audit: Theme System Architecture

**Date:** 2026-07-22  
**Files:** `src/contexts/ThemeContext.tsx` (126 lines), `src/app/globals.css` (328 lines)

## ThemeContext.tsx

### API
```typescript
export type ThemeMode = "dark" | "light" | "system";
export type AccentColor = "blue" | "green" | "purple" | "orange" | "teal" | "pink";
export type CardStyle = "solid" | "glass";
export type BorderStyle = "full" | "subtle" | "none";
export type LockView = "grid" | "list";
export type CardDensity = "default" | "compact";

export interface ThemeSettings {
  theme: ThemeMode;
  accent: AccentColor;
  cardStyle: CardStyle;
  borderStyle: BorderStyle;
  lockView: LockView;
  cardDensity: CardDensity;
  showSummary: boolean;
  refreshInterval: number;
}
```

### Persistence
- Storage key: `ttlock-settings`
- Loaded on mount via `useEffect`
- Saved on every `updateSetting` call
- `resetSettings()` clears to defaults
- **SSR-safe**: returns `defaultSettings` on server, hydrates on client

### Theme Application
```typescript
function applyTheme(settings: ThemeSettings) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  if (settings.theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(prefersDark ? "dark" : "light");
  } else {
    root.classList.add(settings.theme);
  }
  root.setAttribute("data-accent", settings.accent);
  root.setAttribute("data-card-style", settings.cardStyle);
  root.setAttribute("data-border-style", settings.borderStyle);
  root.setAttribute("data-card-density", settings.cardDensity);
}
```

### Issues

1. **Hydration mismatch** — ThemeProvider renders children with `visibility: hidden` until mounted. This prevents flash but causes a blank frame. Better: inline script in `<head>` that sets theme class before React hydrates.

2. **No flash of incorrect theme (FOUC)** — The `visibility: hidden` approach works but is heavy. An inline script like Next.js `next-themes` uses would be better:
   ```html
   <script dangerouslySetInnerHTML={{ __html: `
     try {
       const s = JSON.parse(localStorage.getItem('ttlock-settings') || '{}');
       const root = document.documentElement;
       root.classList.add(s.theme || 'light');
       root.setAttribute('data-accent', s.accent || 'blue');
     } catch {}
   `}} />
   ```

3. **System theme listener re-attached** — The `useEffect` for system theme (lines 92-98) depends on `[settings]`, so it re-runs on EVERY settings change, not just when theme changes. Should depend on `[settings.theme]` only.

4. **No `data-lock-view` attribute** — `lockView` is in settings but `applyTheme` doesn't set a data attribute for it. It's read directly from `settings.lockView` by the dashboard, which is fine.

5. **No `showSummary` or `refreshInterval` in DOM** — These are behavioral settings, not visual. Correct — no DOM attribute needed.

6. **Missing setting types** — User wants: `animations`, `reducedMotion`, `enable3D`. These need to be added to `ThemeSettings` interface and defaults.

7. **No `data-theme` attribute** — Uses `.dark`/`.light` classes. This works but `data-theme` is more conventional and doesn't pollute the class list.

8. **Reset doesn't re-apply system listener** — If you reset from "system" to "light" and back to "system", the listener logic re-runs correctly because `settings` changes. Actually this is fine.

## globals.css

### Structure (328 lines)
1. `:root` — Light mode defaults (lines 7-46)
2. `.dark` — Dark mode overrides (lines 49-64)
3. `:root` derived accent vars (lines 67-72)
4. `[data-accent="..."]` — 6 accent palettes (lines 75-80)
5. `[data-card-style="glass"]` — Glass transparency (lines 83-86)
6. `[data-border-style="..."]` — Border variants (lines 89-90)
7. `[data-card-density="compact"]` — Compact density (lines 93-97)
8. Runtime utility classes (lines 104-178)
9. Typography (lines 159-175)
10. Body/heading defaults (lines 165-175)
11. Responsive grid system (lines 194-328)

### What Works
- CSS var cascade from `:root` → `.dark` correctly overrides in dark mode ✓
- Accent palettes via `data-accent` correctly set hue/sat/lgt ✓
- Derived vars (`--accent`, `--accent-hover`, `--accent-bg`) computed from HSL ✓
- Runtime utility classes resolve `var()` at render ✓
- Card style (glass) uses `color-mix` for transparency ✓
- Border style (subtle/none) correctly overrides ✓
- Card density (compact) correctly reduces padding ✓
- Responsive grid system is well-designed ✓

### What's Missing
1. **Status color utility classes** — `--status-success`, `--status-warning`, `--status-error` defined but no `.text-success`, `.bg-success` etc.
2. **`--accent-light` var** — No light variant of accent for gradient endpoints
3. **Dark-mode accent contrast** — `--accent-lgt: 26%` for blue is very dark on `#0F172A` bg. Each accent needs a dark-mode lightness override.
4. **Glass card in dark mode** — `color-mix(in srgb, var(--card-bg) 60%, transparent)` → `#1E293B` at 60% opacity over `#0F172A` = `#171E2B`ish. Works but subtle.
5. **No `.bg-alt` usage observed** — `--bg-alt` is defined (`#F8F6F2` light / `#1E293B` dark) but almost no component uses `.bg-alt` class.
6. **`.card-compact` targeting** — CSS exists but `.card-compact` class is NOT applied to any card in the app.
7. **No `.text-link` usage** — `--link` defined but components use `text-[#3B82F6]` instead.

### Recommended Additions
```css
/* Status color utilities */
.text-success  { color: var(--status-success); }
.text-warning  { color: var(--status-warning); }
.text-error    { color: var(--status-error); }
.bg-success    { background-color: var(--status-success); }
.bg-warning    { background-color: var(--status-warning); }
.bg-error      { background-color: var(--status-error); }
.bg-success-50 { background-color: color-mix(in srgb, var(--status-success) 10%, transparent); }
.bg-warning-50 { background-color: color-mix(in srgb, var(--status-warning) 10%, transparent); }
.bg-error-50  { background-color: color-mix(in srgb, var(--status-error) 10%, transparent); }

/* Accent light var */
:root { --accent-light: #60A5FA; }
.dark { --accent-light: #93C5FD; }

/* Dark-mode accent lightness boosts */
.dark [data-accent="blue"]   { --accent-lgt: 55%; }
.dark [data-accent="green"]  { --accent-lgt: 55%; }
.dark [data-accent="purple"] { --accent-lgt: 65%; }
.dark [data-accent="orange"] { --accent-lgt: 60%; }
.dark [data-accent="teal"]   { --accent-lgt: 55%; }
.dark [data-accent="pink"]   { --accent-lgt: 65%; }

/* Focus visible */
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```