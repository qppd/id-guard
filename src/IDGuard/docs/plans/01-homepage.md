# Plan: Homepage Redesign (Logo, Hero BG, Buttons)

**Prereq:** Audit doc `01-homepage.md`  
**Target file:** `src/app/page.tsx`

## Step 1: Theme-aware utility classes for the AnimatedBackground

```tsx
// BEFORE:
<div className="bg-gradient-to-br from-[#3B82F6]/10 to-transparent blur-3xl" />

// AFTER:
<div className="bg-gradient-to-br from-accent/10 to-transparent blur-3xl" />
```

- `#3B82F6` → `accent` utility (via `.from-accent` in Tailwind v4 — but Tailwind v4 doesn't have `from-accent` by default unless we define it as a color). Since we use Tailwind v4 with CSS vars, use arbitrary value referencing the CSS var: `from-[var(--accent)]` with `/10` modifier. **OR** keep inline but reference `--accent`: `from-[rgb(var(--accent-rgb)/0.1)]`.

**Decision:** Add CSS utility classes in `globals.css` for gradient endpoints:
```css
.from-accent-soft { --tw-gradient-from: color-mix(in srgb, var(--accent) 10%, transparent); }
.from-accent-medium { --tw-gradient-from: color-mix(in srgb, var(--accent) 25%, transparent); }
```
Tailwind v4 supports `from-[color]` — we'll use `from-[var(--accent)]` with opacity. Or simpler: just use `from-[var(--accent)]/10`. Let's test which works in Tailwind v4. Fallback: keep text-gradient directly:
`text-[#3B82F6]` → replace with `text-link` (uses `--link` CSS var = `#3B82F6` light, `#60A5FA` dark).

**Adopted approach:** Use the existing runtime utility classes from globals.css (`.text-accent`, `.bg-card`, `.border-border-card`, `.text-foreground`, etc.). For gradients, use `from-[var(--accent)]` arbitrary value syntax.

## Step 2: Logo styling

```tsx
// BEFORE:
<Image ... className="mx-auto mb-6 w-[200px] sm:w-[240px] lg:w-[280px] h-auto" />

// AFTER:
<Image ... className="logo-responsive mx-auto mb-6 h-auto" priority />
```
The `logo-responsive` class already exists in globals.css lines 280-285.

## Step 3: Hero heading text color

```tsx
// BEFORE:
<h1 className="... text-[#183B6B] ...">
  Your{" "}
  <span className="bg-gradient-to-r from-[#183B6B] via-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">
    Digital Identity
  </span>
  , Guarded
</h1>

// AFTER:
<h1 className="... text-accent ...">
  Your{" "}
  <span className="bg-gradient-to-r from-[var(--accent)] via-[var(--link)] to-[var(--accent-light)] bg-clip-text text-transparent">
    Digital Identity
  </span>
  , Guarded
</h1>
```

## Step 4: Subtitle text

```tsx
// BEFORE:
<p className="text-[#1F2937] ...">

// AFTER:
<p className="text-foreground ...">
```

## Step 5: Buttons

```tsx
// PRIMARY BUTTON:
// BEFORE:
<motion.a className="... bg-[#183B6B] text-white ... hover:bg-[#2A5CA5] ... shadow-lg shadow-[#183B6B]/25 ..." />

// AFTER:
<motion.a className="... bg-accent text-white ... hover:bg-accent-hover ... shadow-lg shadow-[var(--accent)]/25 ..." />

// SECONDARY BUTTON:
// BEFORE:
<motion.a className="... border-2 border-[#183B6B] text-[#183B6B] ... hover:bg-[#DCEEFF] ..." />

// AFTER:
<motion.a className="... border-2 border-[var(--accent)] text-accent ... hover:bg-sky ..." />
```

## Step 6: Feature cards

```tsx
// BEFORE:
<GlowCard className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-card ...">
  <div className="text-2xl ... text-[#3B82F6] ...">{f.icon}</div>
  <h3 className="... text-[#183B6B] ...">{f.title}</h3>
  <p className="text-[#6B7280] ...">{f.desc}</p>
</GlowCard>

// AFTER:
<GlowCard className="bg-card rounded-2xl p-6 border border-border-card shadow-card ...">
  <div className="text-2xl ... text-link ...">{f.icon}</div>
  <h3 className="... text-accent ...">{f.title}</h3>
  <p className="text-text-secondary ...">{f.desc}</p>
</GlowCard>
```

## Step 7: Section headings + trust section

Replace 8 occurrences of `text-[#183B6B]` → `text-accent`, `text-[#1F2937]` → `text-foreground`, `text-[#6B7280]` → `text-text-secondary`.

## Step 8: CTA card

```tsx
// BEFORE:
<div className="bg-gradient-to-br from-[#183B6B] to-[#1E3A5F] rounded-3xl ...">
  <h2 className="... text-white ...">Ready to Secure Your Space?</h2>
  <p className="text-[#DCEEFF] ...">

// AFTER: Keep gradient fixed (CTA intentionally dark regardless of theme):
<div className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark,##1E3A5F)] rounded-3xl ...">
  <h2 className="... text-white ...">Ready to Secure Your Space?</h2>
  <p className="text-[var(--accent-light)] ...">
```

## Step 9: Footer

```tsx
// BEFORE:
<footer className="... border-t border-[#E5E7EB]">
  <a href="#" className="hover:text-[#183B6B] ...">Privacy</a>

// AFTER:
<footer className="... border-t border-border-card">
  <a href="#" className="hover:text-accent ... underline-offset-4 hover:underline">Privacy</a>
```

## Step 10: Scroll indicator

```tsx
// BEFORE:
<svg ... className="text-[#9CA3AF]">

// AFTER:
<svg ... className="text-text-muted">
```

## Step 11: Spinner in IDGuardScene loading fallback

```tsx
// BEFORE:
<div className="... border-[#3B82F6] border-t-transparent ..." />

// AFTER:
<div className="... border-[var(--accent)] border-t-transparent ..." />
```

## Verification

1. `npm run build` — no TypeScript errors
2. Open in light mode → check all colors match original (no visual regression)
3. Toggle dark mode → all elements should adapt (no white cards, no invisible text)
4. Toggle accent colors → headings, buttons, links change hue
5. Check responsive: mobile (375px), tablet (768px), desktop (1280px), large (2000px)