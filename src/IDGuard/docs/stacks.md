# Technology Stack

## Overview

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js | 16.2.9 | Full-stack React framework (App Router) |
| **Runtime** | Node.js | ^20 | Server-side JavaScript runtime |
| **Language** | TypeScript | ^5 | Type-safe development |
| **UI Library** | React | 19.2.4 | Client-side component rendering |
| **Styling** | Tailwind CSS | ^4 | Utility-first CSS framework |
| **Data Fetching** | SWR | ^2.4.2 | React hooks for data fetching & caching |
| **Bundler** | Turbopack | (Next.js built-in) | Rust-based incremental bundler |
| **Linting** | ESLint | ^9 | Code quality & consistency |
| **PostCSS** | @tailwindcss/postcss | ^4 | Tailwind CSS PostCSS plugin |

---

## Detailed Breakdown

### Framework: Next.js 16 (App Router)

```json
"next": "16.2.9"
```

Next.js 16 provides:
- **App Router** — file-system based routing with nested layouts, loading states, and error boundaries
- **Server Components** — React Server Components for zero-bundle-size data fetching
- **API Routes** — backend API handlers co-located with pages under `src/app/api/`
- **Turbopack** — default Rust-based bundler for fast development iteration
- **Automatic TypeScript** — built-in TS compilation without manual configuration
- **Dynamic Imports** — used for server-side TTLock API calls (`await import("@/lib/ttlock")`)

### UI: React 19 + Tailwind CSS 4

```json
"react": "19.2.4",
"react-dom": "19.2.4",
"tailwindcss": "^4"
```

- **React 19** — Concurrent features, improved server components, enhanced hooks
- **Tailwind CSS 4** — CSS-first configuration, `@tailwindcss/postcss` plugin, no `tailwind.config.js` needed
- **Brand color palette** — IDGuard design system using custom CSS variables:

  | Role | Color | CSS Var |
  |---|---|---|
  | Primary Brand (Deep Navy) | `#183B6B` | `--accent` (hsl) |
  | Secondary Brand (Royal Blue) | `#3B82F6` | `--link`, `--focus-ring` |
  | Soft Sky Blue | `#DCEEFF` | `--accent-bg-color` |
  | Main Background | `#FFFFFF` | `--bg` |
  | Warm Cream (Alt) | `#F8F6F2` | `--bg-alt` |
  | Charcoal Gray (Text) | `#1F2937` | `--fg` |
  | Slate Gray (Secondary) | `#6B7280` | `--text-secondary` |
  | Light Gray (Borders) | `#E5E7EB` | `--card-border`, `--input-border` |

- **Typography**: Poppins (headings via `font-heading`), Inter (body via `font-body`)
- **Runtime theme system** — CSS custom properties + data attributes for accent color switching, card style (solid/glass), border style, and dark/light/system mode

### Data Fetching: SWR 2

```json
"swr": "^2.4.2"
```

SWR provides:

| Feature | Usage |
|---|---|
| **Automatic caching** | Reuses cached data across navigations |
| **Revalidation** | Background refetch every 10s (dashboard), 30s (door sensor) |
| **Mutate** | Optimistic updates after add/delete actions (`refreshPass()`, `refreshIc()`, etc.) |
| **Conditional fetching** | `isAuthenticated ? url : null` — only fetch when logged in |
| **Error handling** | Built-in error state for each SWR call |

### Styling Approach

- **Component-level Tailwind classes** — no CSS modules, no styled-components
- **CSS variables** — Geist fonts via `--font-geist-sans` and `--font-geist-mono`
- **No external UI library** — all components hand-built with Tailwind

### Development Tools

| Tool | Version | Purpose |
|---|---|---|
| TypeScript | ^5 | Static type checking |
| ESLint | ^9 | Code quality |
| @types/react | ^19 | React type definitions |
| @types/react-dom | ^19 | React DOM type definitions |
| @types/node | ^20 | Node.js type definitions |

---

## Project Dependencies

```
|📦 id-guard@0.1.0
├── dependencies:
│   ├── next@16.2.9
│   ├── react@19.2.4
│   ├── react-dom@19.2.4
│   └── swr@^2.4.2
└── devDependencies:
    ├── @tailwindcss/postcss@^4
    ├── @types/node@^20
    ├── @types/react@^19
    ├── @types/react-dom@^19
    ├── eslint@^9
    ├── eslint-config-next@16.2.9
    ├── tailwindcss@^4
    └── typescript@^5
```

---

## External API: TTLock Cloud API V3

**Base URL:** `https://api.sciener.com`

**Authentication:** OAuth2 token-based (`POST /oauth2/token`)

**Request Format:** `application/x-www-form-urlencoded`

**Common Parameters:**
| Parameter | Description |
|---|---|
| `clientId` | API client ID (from `.env.local`) |
| `accessToken` | OAuth2 token from login |
| `date` | Current timestamp in milliseconds |

**Response Format:** JSON with `errcode` / `errmsg` error fields

---

## Infrastructure (Target)

| Component | Target |
|---|---|
| Hosting | Vercel (Next.js optimized) |
| Domain | Custom domain (TBD) |
| Environment Variables | Vercel Environment Variables |
| Monitoring | Vercel Analytics |

---

## Why These Choices

| Decision | Rationale |
|---|---|
| **Next.js over Express** | Server-side rendering, file-based routing, API co-location, built-in bundler |
| **SWR over React Query** | Lighter bundle, simpler API, automatic revalidation |
| **Tailwind over CSS Modules** | Faster iteration, no context-switching between files, consistent design |
| **No ORM / Database** | All data sourced from TTLock Cloud API — no persistence needed |
| **No Auth Library** | Custom cookie-based auth using TTLock's own OAuth2 — minimal dependencies |
| **Dynamic imports** | Prevents bundling TTLock client secrets into client-side JavaScript |
