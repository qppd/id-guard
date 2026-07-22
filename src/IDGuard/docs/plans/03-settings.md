# Plan: Settings Page Enhancements

**Prereq:** Audit doc `03-settings.md`  
**Target file:** `src/app/settings/page.tsx`, `src/contexts/ThemeContext.tsx`, `src/app/globals.css`

## Part 1: Color Fixes (22 replacements)

Apply the replacement table from `02-dark-mode.md` to `settings/page.tsx`:

| Line | Before | After |
|------|--------|-------|
| 36 | `text-[#3B82F6]` | `text-link` |
| 42 | `bg-white border border-[#E5E7EB]` | `bg-card border border-border-card` |
| 43 | `text-[#183B6B]` | `text-accent` |
| 47 | `border-[#E5E7EB]/50` | `border-border-card/50` |
| 49 | `text-[#6B7280]` | `text-text-secondary` |
| 56 | `bg-[#183B6B] text-white` | `bg-accent text-white` |
| 57 | `bg-white text-[#6B7280]  hover:text-[#1F2937]` | `bg-card text-text-secondary hover:text-foreground` |
| 70-75 | `ring-[#22C55E]`, `ring-[#A855F7]`, `ring-[#F97316]`, etc. | **Keep as-is** — these are predefined swatch rings for the color picker; they should show the actual accent color. They're visualization, not theming. ✓ |
| 112-117 | `bg-[#183B6B] text-white` active, `bg-white text-[#6B7280] hover:text-[#1F2937]` inactive | `bg-accent text-white`, `bg-card text-text-secondary hover:text-foreground` |
| 137 | `bg-red-50 text-[#EF4444] border-red-200` | `bg-error-soft text-error border-error-soft` |
| etc | (remaining similar) | (same pattern) |

## Part 2: Add new settings to ThemeContext

### 2.1 Update `ThemeSettings` interface:
```typescript
export interface ThemeSettings {
  theme: ThemeMode;
  accent: AccentColor;
  cardStyle: CardStyle;
  borderStyle: BorderStyle;
  lockView: LockView;
  cardDensity: CardDensity;
  showSummary: boolean;
  refreshInterval: number;
  // NEW:
  enable3D: boolean;
  enableAnimations: boolean;
}
```

### 2.2 Update `defaultSettings`:
```typescript
const defaultSettings: ThemeSettings = {
  ...
  enable3D: true,
  enableAnimations: true,
};
```

### 2.3 No DOM attribute needed for these (they're behavioral, read directly from context by consumer components).

## Part 3: Add new settings UI rows

### 3.1 New "Behavior" SettingCard (after "Data & Refresh")
```tsx
<SettingCard title="Behavior">
  <SettingRow label="Enable 3D Scenes">
    <ToggleBtn
      label="3D"
      value={settings.enable3D}
      options={[
        { value: true, label: "On" },
        { value: false, label: "Off" },
      ]}
      onChange={(v) => updateSetting("enable3D", v)}
    />
  </SettingRow>
  <SettingRow label="Animations" description="Enable transition and parallax effects">
    <ToggleBtn
      label="Animations"
      value={settings.enableAnimations}
      options={[
        { value: true, label: "On" },
        { value: false, label: "Off" },
      ]}
      onChange={(v) => updateSetting("enableAnimations", v)}
    />
  </SettingRow>
  <SettingRow label="Reduced Motion" description="Respects system preference">
    <span className="text-text-muted text-xs">
      {typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "Active" : "System default"}
    </span>
  </SettingRow>
</SettingCard>
```

### 3.2 Fix ToggleBtn type signature
Currently `ToggleBtn<T extends string>`. For boolean toggles (3D on/off), either:
- A: Change to `T extends string | boolean`
- B: Use "true"/"false" strings and cast
- C: Create a separate `ToggleSwitch` component for boolean values

**Decision:** Option A — update ToggleBtn generic:
```tsx
function ToggleBtn<T extends string | boolean>({
  label, value, options, onChange
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) { ... }
```

### 3.3 ToggleBtn accessibility
```tsx
// Add to the group container:
<div role="group" aria-label={label} className="...">

// Add to each button:
<button
  aria-pressed={value === opt.value}
  ...
>
```

## Part 4: Ensure card style/density/border effects propagate

### 4.1 Apply `.card-compact` class to cards on other pages
Currently the `data-card-density="compact"` CSS targets `.card-compact` class. No cards have this class. Fix by adding it to dashboard/gateways/keys/locks cards:

```tsx
// In dashboard/page.tsx, gateways/page.tsx, keys/page.tsx, locks/[id]/page.tsx:
// Change: <div className="bg-card border border-border-card rounded-lg p-4 ...">
// To:     <div className="card-compact bg-card border border-border-card rounded-lg p-4 ...">
```

The `.card-compact` class is defined in globals.css under `[data-card-density="compact"]`.

### 4.2 Verify glass card style works
The `[data-card-style="glass"]` CSS overrides `--card-bg` to use `color-mix`. Since we're now using `.bg-card` (which reads `--card-bg`), glass mode will work automatically once `bg-white` → `bg-card` replacement is done.

## Part 5: Settings page card style improvements

### 5.1 Card heading styling
```tsx
// BEFORE:
<h2 className="text-lg font-heading font-semibold text-accent">

// AFTER (add accent bar visual):
<div className="flex items-center gap-2">
  <div className="w-1 h-5 rounded-full bg-accent" />
  <h2 className="text-lg font-heading font-semibold text-accent">{title}</h2>
</div>
```

### 5.2 Setting row descriptive text
```tsx
// Add optional description prop to SettingRow:
function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border-card/50 last:border-0">
      <div>
        <p className="text-text-secondary text-sm font-medium">{label}</p>
        {description && <p className="text-text-muted text-xs mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}
```

## Verification

1. `npm run build` — no TS errors
2. Open settings page → all settings render correctly
3. Change theme → all settings UI adapts
4. Change accent → accent rings on Blue/Green/Purple/etc change; active toggle uses accent
5. Toggle card density to "compact" → settings cards AND dashboard/gateways/keys/locks cards shrink padding
6. Toggle card style to "glass" → cards become semi-transparent
7. Toggle border style to "none" → card borders disappear
8. Toggle 3D off → landing/login pages show fallback content (deferred to Plan 04/05)
9. Toggle animations off → Framer Motion animations disabled (deferred to Plan 06)
10. Reset settings → everything returns to default
11. Screen reader: each ToggleBtn group has `role="group"` and `aria-label`; each button has `aria-pressed`