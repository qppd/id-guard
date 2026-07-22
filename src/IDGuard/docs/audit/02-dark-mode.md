# Audit: Dark Mode & Color System

**Date:** 2026-07-22  
**Files affected:** 12 files, 236 hardcoded hex colors total

## The Core Problem

The project has a **fully functional CSS custom property system** in `globals.css` with light/dark/accent variants. The `ThemeContext` correctly manages `dark`/`light` classes on `<html>`, sets `data-accent`, `data-card-style`, `data-border-style`, `data-card-density` attributes, and persists to `localStorage`. Runtime utility classes (`.bg-card`, `.text-foreground`, `.text-accent`, etc.) resolve `var()` at runtime.

**But almost no component uses them.**

## Hardcoded Color Census (236 total)

| File | Count | Key Colors |
|------|-------|------------|
| `app/page.tsx` (landing) | 52 | `#183B6B`, `#3B82F6`, `#6B7280`, `#E5E7EB`, `#1F2937` |
| `app/locks/[id]/page.tsx` | 48 | `#183B6B`, `#E5E7EB`, `#F8F6F2`, `#9CA3AF`, `#1F2937`, `#3B82F6` |
| `app/login/page.tsx` | 12 | `#F8F6F2`, `#3B82F6`, `#183B6B`, `#6B7280` |
| `components/LoginForm.tsx` | 18 | `#183B6B`, `#E5E7EB`, `#3B82F6`, `#1F2937`, `#6B7280`, `#9CA3AF` |
| `components/LockCard.tsx` | 14 | `#183B6B`, `#E5E7EB`, `#3B82F6`, `#6B7280`, `#22C55E`, `#F59E0B`, `#EF4444` |
| `components/Navbar.tsx` | 8 | `#183B6B`, `#2A5CA5`, `#3B82F6`, `#DCEEFF`, `#1E3A5F` |
| `app/settings/page.tsx` | 22 | `#183B6B`, `#E5E7EB`, `#6B7280`, `#3B82F6`, `#1F2937`, `#9CA3AF`, `#EF4444` |
| `app/dashboard/page.tsx` | 20 | `#183B6B`, `#E5E7EB`, `#9CA3AF`, `#6B7280`, `#22C55E`, `#EF4444` |
| `app/gateways/page.tsx` | 16 | `#183B6B`, `#E5E7EB`, `#9CA3AF`, `#6B7280`, `#22C55E`, `#EF4444` |
| `app/keys/page.tsx` | 20 | `#183B6B`, `#E5E7EB`, `#3B82F6`, `#1F2937`, `#9CA3AF`, `#EF4444`, `#22C55E`, `#F59E0B` |
| `components/IDGuardScene.tsx` | 6 | `#3B82F6`, `#60A5FA`, `#183B6B` (3D scene) |
| `app/globals.css` | 0 | (defines the CSS vars — not a problem) |

## Color Mapping Table

| Hardcoded Hex | CSS Var | Runtime Class | Meaning |
|---------------|---------|---------------|---------|
| `#183B6B` | `--accent` (blue) | `.text-accent`, `.bg-accent` | Deep Navy — primary |
| `#2A5CA5` | `--accent-hover` | `.hover\:bg-accent-hover` | Hover state |
| `#3B82F6` | `--link` / `--status-info` | `.text-link`, `.bg-sky` | Royal Blue |
| `#60A5FA` | `--link` (dark mode) | `.text-link` (dark) | Light Blue |
| `#1F2937` | `--fg` | `.text-foreground` | Charcoal — primary text |
| `#6B7280` | `--text-secondary` | `.text-text-secondary` | Slate — secondary text |
| `#9CA3AF` | `--text-muted` | `.text-text-muted` | Muted text |
| `#E5E7EB` | `--card-border` / `--input-border` | `.border-border-card`, `.border-input-border` | Light gray border |
| `#F8F6F2` | `--bg-alt` | `.bg-alt` | Warm cream alt bg |
| `#DCEEFF` | `--accent-bg-color` | `.bg-sky` | Sky blue hover bg |
| `#1E3A5F` | `--accent-bg-color` (dark) | `.bg-sky` (dark) | Dark navy alt bg |
| `#FFFFFF` | `--card-bg` (light) / `--bg` (light) | `.bg-card`, `.bg-background` | White |
| `#22C55E` | `--status-success` | (needs class) | Success green |
| `#F59E0B` | `--status-warning` | (needs class) | Warning amber |
| `#EF4444` | `--status-error` | (needs class) | Error red |

## What's Broken in Dark Mode

1. **All cards** are `bg-white border-[#E5E7EB]` → will be white on `#0F172A` background — harsh, no contrast adiustment
2. **All headings** are `text-[#183B6B]` → Deep Navy on `#0F172A` → barely visible
3. **All body text** is `text-[#1F2937]` → Charcoal on dark bg → invisible
4. **Secondary text** `text-[#6B7280]` → ok-ish on dark but wrong
5. **Muted text** `text-[#9CA3AF]` → too light on dark
6. **Inputs** `bg-white border-[#E5E7EB]` → white inputs on dark bg → jarring
7. **Navbar** `bg-[#183B6B]` → hardcoded navy, ignores accent setting
8. **Buttons** `bg-[#183B6B] hover:bg-[#2A5CA5]` → ignores accent setting entirely
9. **Feature icon** `text-[#3B82F6]` → hardcoded, ignores accent
10. **3D scene colors** `#3B82F6`, `#60A5FA`, `#183B6B` — hardcoded in JS, can't be themed via CSS
11. **Login page** `bg-[#F8F6F2]` → hardcoded cream, will be bright in dark mode
12. **Settings page** `bg-white` cards, `text-[#183B6B]` headings → same issue

## Missing CSS Utility Classes

The globals.css defines status colors but has NO utility classes for them:
- ❌ `.text-success` / `.bg-success` (for `#22C55E`)
- ❌ `.text-warning` / `.bg-warning` (for `#F59E0B`)
- ❌ `.text-error` / `.bg-error` (for `#EF4444`)
- ❌ `.bg-accent-bg-color` is `.bg-sky` but naming is confusing

**Recommendation:** Add status utility classes to globals.css.

## Dark Mode .dark Block Audit

The `.dark` block in globals.css (lines 49-64) defines:
- `--bg: #0F172A` ✓
- `--bg-alt: #1E293B` ✓
- `--card-bg: #1E293B` ✓
- `--fg: #F1F5F9` ✓
- `--text-secondary: #94A3B8` ✓
- `--text-muted: #64748B` ✓
- `--card-border: #334155` ✓
- `--input-bg: #1E293B` ✓
- `--input-border: #475569` ✓
- `--link: #60A5FA` ✓
- `--link-hover: #93C5FD` ✓
- `--accent-bg-color: #1E3A5F` ✓
- `--focus-ring: #60A5FA` ✓

**Missing:** `--accent-text` stays `#FFFFFF` in dark — correct. But accents like "blue" dark accent `#183B6B` has `--accent-lgt: 26%` which is very dark — on `#0F172A` bg the accent buttons would be barely visible. **Recommendation:** consider raising `--accent-lgt` in dark mode for better contrast.

## Fix Strategy

1. Add missing status utility classes to globals.css
2. Systematic find-replace across all 12 files using the color mapping table
3. Add `--accent-lgt` dark-mode overrides for each accent palette
4. Add `--accent-light` CSS var for gradient endpoints
5. Replace `bg-white` → `bg-card` everywhere
6. Replace `bg-red-50`/`bg-green-50`/`bg-yellow-50` → theme-aware status bg classes
7. Add `--accent-light: #60A5FA` to `:root` and `.dark` (dark: `#93C5FD`)
8. 3D scene: pass theme colors as props from React context, not hardcoded