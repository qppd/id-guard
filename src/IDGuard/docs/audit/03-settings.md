# Audit: Settings Page (`src/app/settings/page.tsx`)

**Date:** 2026-07-22  
**File:** `src/app/settings/page.tsx` (219 lines, 7,581 bytes)  
**Hardcoded colors:** 22 instances

## Current State

### Structure
- 3 setting sections: "Theme & Colors", "Layout & Display", "Data & Refresh"
- 1 reset button at bottom
- Auth-guarded (redirects to `/login` if not authenticated)
- Uses `useTheme()` hook for all settings

### Components
- `SettingCard` — white card with border, heading, children
- `SettingRow` — flex row with label + control, bottom border
- `ToggleBtn` — segmented button group for enum-like settings

### Available Settings
| Setting | Type | Options |
|---------|------|---------|
| Theme | `ThemeMode` | Dark / Light / System |
| Accent Color | `AccentColor` | Blue / Green / Purple / Orange / Teal / Pink |
| Card Style | `CardStyle` | Solid / Glass |
| Borders | `BorderStyle` | Full / Subtle / None |
| Lock View | `LockView` | Grid / List |
| Card Density | `CardDensity` | Default / Compact |
| Show Summary | `boolean` | Toggle switch |
| Refresh Interval | `number` | Off / 15s / 30s / 60s / 120s |

### Hardcoded Colors (22 occurrences)
| Color | Usage | Count |
|-------|-------|-------|
| `#183B6B` | Card headings, active toggle btn, accent rings | 5 |
| `#E5E7EB` | Card borders, toggle borders, row separators | 4 |
| `#6B7280` | Row labels, inactive toggle text | 3 |
| `#1F2937` | Inactive toggle hover text | 1 |
| `#3B82F6` | Back link | 1 |
| `#EF4444` | Reset button text | 1 |
| `#22C55E` | Green accent ring | 1 |
| `bg-white` | Card bg, toggle inactive bg | 2 |
| `bg-red-50` | Reset button bg | 1 |
| `border-red-200` | Reset button border | 1 |
| `ring-offset-card` | (uses CSS var — correct!) | 1 |

### What Works
- `ring-offset-card` correctly uses `--card-bg` via CSS var ✓
- `useTheme()` hook properly connects to context ✓
- All settings persist to localStorage ✓
- System theme mode listens to `prefers-color-scheme` changes ✓

### What's Broken
1. **All card backgrounds** `bg-white` → doesn't use `bg-card` → dark mode broken
2. **All card headings** `text-[#183B6B]` → hardcoded Navy, not `text-accent`
3. **All borders** `border-[#E5E7EB]` → not `border-border-card`
4. **All labels** `text-[#6B7280]` → not `text-text-secondary`
5. **Toggle active** `bg-[#183B6B]` → not `bg-accent` — accent color picker doesn't affect toggles!
6. **Toggle inactive** `bg-white text-[#6B7280]` → doesn't adapt to dark
7. **Row separator** `border-[#E5E7EB]/50` → hardcoded
8. **Accent picker rings** use Tailwind `bg-purple-500`, `bg-orange-500` etc — but accent="blue" uses `bg-[#183B6B]`. inconsistency
9. **Reset button** `bg-red-50 text-[#EF4444] border-red-200` → not theme-aware

## Missing Features

### Requested: Card style, borders, density toggles
All three are **already present** in the code:
- Card Style: Solid/Glass → sets `data-card-style` → globals.css handles `--card-bg` transparency ✓
- Borders: Full/Subtle/None → sets `data-border-style` → globals.css handles `--card-border` ✓  
- Card Density: Default/Compact → sets `data-card-density` → globals.css handles padding/font-size ✓

**But the effects don't propagate** because:
1. Dashboard/gateways/keys/locks pages use `bg-white` directly, NOT the `.card-compact` class
2. The `data-card-density="compact"` CSS targets `.card-compact` class which is NOT applied to cards on other pages
3. Glass card style: the `color-mix` in CSS reduces opacity, but `bg-white` in components overrides `--card-bg`

### Requested: Toggle options (new settings)
Currently 8 settings exist. User wants MORE toggle options. Suggestions:
- **Animations toggle** — enable/disable Framer Motion animations
- **Reduced motion** — respect `prefers-reduced-motion`
- **3D scene toggle** — enable/disable 3D hero on landing (performance)
- **Compact navbar** — collapse to icon-only on mobile/tablet

## Fix Plan

1. Replace all 22 hardcoded colors with CSS var-backed classes
2. Add `.card-compact` class to cards on dashboard/gateways/keys/locks pages
3. Replace `bg-white` with `bg-card` on all cards in SettingCard + other pages
4. Make accent picker rings use accent CSS vars (predefined swatches)
5. Make ToggleBtn active use `bg-accent text-white` instead of `bg-[#183B6B]`
6. Add new settings to ThemeContext: `animations: boolean`, `reducedMotion: boolean`, `enable3D: boolean`
7. Add corresponding settings UI rows
8. Ensure settings changes reflect instantly (already works via `applyTheme()`)