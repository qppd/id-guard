# ID GUARD Web Portal — Software Requirements (Verified)

> **Verification note:** Every item below was re-confirmed by scanning the actual source tree
> (`src/IDGuard/`), not by copying older documentation. Where the legacy docs
> (`docs/stacks.md`, `README.md`) disagree with the code, **the code is treated as authoritative**
> and the discrepancy is flagged in [§8](#8-corrections-to-older-internal-docs).
>
> Scan scope: `package.json` + `package-lock.json`, `next.config.ts`, `tsconfig.json`,
> `eslint.config.mjs`, `postcss.config.mjs`, all 77 `.ts`/`.tsx` files
> (50 API route handlers, 12 pages), `src/lib/ttlock.ts` (API client, 987 lines),
> `.env.local` keys (names only), `.gitignore`, and the deployed site.

**Live deployment:** https://slsu-id-guard.vercel.app/ *(HTTP 200, verified)*
**Source repository:** https://github.com/qppd/id-guard
**Scan date:** October 6, 2026

---

## 1. Frontend Technologies

| Role | Technology | Declared version | Exact installed version | Evidence |
|---|---|---|---|---|
| Programming language | TypeScript | `^5` | **5.9.3** | `package-lock.json` |
| UI library | React | `19.2.4` (pinned) | **19.2.4** | `package.json` |
| UI library (DOM) | React DOM | `19.2.4` (pinned) | **19.2.4** | `package.json` |
| Framework | Next.js (App Router) | `16.2.9` (pinned) | **16.2.9** | `package.json` |
| Styling | Tailwind CSS | `^4` | **4.3.1** | `package-lock.json` |
| Styling (PostCSS plugin) | `@tailwindcss/postcss` | `^4` | **4.3.1** | `package-lock.json` |
| Data fetching / caching | SWR | `^2.4.2` | **2.4.2** | `package-lock.json` |
| Animations | Framer Motion | `^12.42.2` | **12.42.2** | `package-lock.json` |
| 3D rendering | Three.js | `^0.185.1` | **0.185.1** | `package-lock.json` |
| 3D React binding | `@react-three/fiber` | `^9.6.1` | **9.6.1** | `package-lock.json` |
| 3D helpers | `@react-three/drei` | `^10.7.7` | **10.7.7** | `package-lock.json` |
| 3D type definitions | `@types/three` | `^0.185.1` | — | `package.json` |
| Fonts | Google Fonts via `next/font/google` | — | Poppins (headings), Inter (body) | `src/app/layout.tsx` |
| Build/bundle tool | Turbopack | bundled with Next.js 16 | — | Next.js default bundler |

**Confirmed usage (grep-verified, no unused frontend deps):**

- `swr` → `dashboard`, `locks/[id]`, `keys`, `gateways` pages + `useAuth`, `useLocks` hooks
- `framer-motion` → `page.tsx` (landing), `login/page.tsx`, `Navbar.tsx`, `LoginForm.tsx`, `Parallax.tsx`, `LoginScene.tsx`, `IDGuardScene.tsx`
- `three` / `@react-three/fiber` / `@react-three/drei` → `src/components/LoginScene.tsx`, `src/components/IDGuardScene.tsx` (3D scenes on the login and landing pages)

**Architecture:** single-page React client components rendered by Next.js App Router with
server-side rendering; component-level Tailwind classes (no CSS modules, no styled-components,
no third-party component library).

---

## 2. Backend Technologies

The backend is **not a separate service** — it runs inside the same Next.js application as
**Route Handlers** under `src/app/api/**/route.ts`.

| Component | Technology | Notes |
|---|---|---|
| Runtime | Node.js | Development machine runs **v24.14.1**; `package.json` declares no `engines` field. Internal docs target Node **^20** (LTS). |
| Server framework | Next.js 16 Route Handlers | `NextRequest` / `NextResponse` API |
| API surface | **50 route handlers** | counted programmatically across `src/app/api/` |
| Page surface | **12 pages** | `page.tsx` files |
| Source size | **77 TypeScript/TSX files** | `src/` tree |
| HTTP client (outbound) | native `fetch()` | no Axios / no SDK library |
| Password hashing | `node:crypto` → `createHash("md5")` | TTLock requires MD5-hashed passwords |
| Email | Nodemailer **9.0.3** | SMTP transport for eKey / unlock-link notifications |
| Secrets | `process.env` (`.env.local` in dev, Vercel Environment Variables in prod) | server-side only |

**Endpoint families implemented:** `login`, `auth`, `user/register`, `user/reset-password`,
`locks/*` (list, detail, lock/unlock, rename, delete, transfer, config, battery, open-state,
time, adjust-time, auto-lock, passage-mode, working-mode, admin-passcode, door-sensor,
upgrade, upgrade-recheck), `passcodes`, `ic-cards`, `fingerprints`, `records/*`,
`keys/*` (list, send, authorize, unauthorize, period, unlock-link, list-by-lock),
`gateways/*` (list, detail, config, devices, locks, rename, delete, transfer,
upgrade-check, upgrade-mode), `users`, `contact`, `webhook`, `door-sensor/alert`.

**Authentication model (custom, no auth library):**

- Login: `POST /api/login` → server hashes the password with MD5 → calls TTLock `POST /oauth2/token`
  → stores `access_token` / `refresh_token` in **httpOnly cookies** named `tt_token` and `tt_refresh`
  (`secure` flag enabled when `NODE_ENV === "production"`).
- Every route handler calls `callWithAuth()` (`src/lib/auth.ts`), which reads the cookie,
  returns **401** if absent, and transparently attempts **one token refresh + one retry**
  when TTLock reports an expired/invalid token.
- TTLock client ID/secret never reach the browser: all API calls are made through
  `await import("@/lib/ttlock")` dynamic imports inside server-only route handlers.

---

## 3. Database

**None — confirmed.** There is no database, no ORM, no migrations, and no server-side
persistence layer anywhere in the codebase.

- All business data (locks, passcodes, IC cards, fingerprints, eKeys, unlock records,
  gateways, users) is read live from / written to the **TTLock Cloud API** on each request.
- The only storage used is **browser `localStorage`**, and it holds non-sensitive data only:
  - `ThemeContext.tsx` — UI appearance preferences (theme, accent color, density)
  - `passcodeRegistry.ts` — a local cache/metadata registry for passcodes created in the portal
- No file-system persistence either (stateless serverless functions).

> For the thesis: the system is a **stateless pass-through / presentation layer**; the system of
> record for all access-control data is the TTLock cloud platform.

---

## 4. Hosting / Server

| Item | Value |
|---|---|
| Hosting platform | **Vercel** |
| Production URL | **https://slsu-id-guard.vercel.app/** |
| Compute model | Vercel Serverless Functions (Next.js runtime) — no persistent server to maintain |
| Project linkage | `.vercel/project.json` present in the repo (Vercel CLI / Git integration) |
| Git deployment | GitHub repository `qppd/id-guard` → Vercel Git integration |
| `vercel.json` | **Not present** — uses Vercel's zero-config Next.js defaults |
| Build command / output | Default (`next build`), managed by Vercel |
| Environment variables | Configured in Vercel Environment Variables (server-side) |
| Domain | Default `*.vercel.app` subdomain (no custom domain configured) |

**Environment variables required in production** (keys read from `process.env` in source):

| Variable | Used in | Purpose | Required |
|---|---|---|---|
| `TTLOCK_CLIENT_ID` | `src/lib/ttlock.ts` | TTLock API client ID | Yes (throws if missing) |
| `TTLOCK_CLIENT_SECRET` | `src/lib/ttlock.ts` | TTLock API client secret | Yes (throws if missing) |
| `SMTP_HOST` | `src/lib/email.ts` | Outgoing mail server | Optional — email disabled if absent |
| `SMTP_PORT` | `src/lib/email.ts` | SMTP port (defaults to `587`) | Optional |
| `SMTP_USER` | `src/lib/email.ts` | SMTP username | Optional |
| `SMTP_PASS` | `src/lib/email.ts` | SMTP password | Optional |
| `SMTP_FROM` | `src/lib/email.ts` | From address (defaults to `SMTP_USER`, then `noreply@idguard.app`) | Optional |

*(`.env.local` in the working copy contains exactly these 7 keys. `NODE_ENV` is set by Next.js.)*

---

## 5. API Integration — TTLock Platform

| Aspect | Verified value |
|---|---|
| API name | **TTLock Cloud API, version 3** (`/v3/...` paths) |
| **Base URL (actual, in code)** | **`https://euapi.ttlock.com`** — `src/lib/ttlock.ts` line 4 |
| Protocol | HTTPS |
| Request method | `POST` for nearly all endpoints (one exception: `GET /v3/user/list`) |
| Request content type | `application/x-www-form-urlencoded` (`URLSearchParams`) |
| Response format | JSON, status carried in `errcode` / `errmsg` (`errcode === 0` = success) |
| Common parameters | `clientId`, `accessToken`, `date` (Unix timestamp in **milliseconds**) |
| Authentication | **OAuth2 token-based**: `POST /oauth2/token` with `clientId`, `clientSecret`, `username`, `password` (MD5) → returns `access_token`, `refresh_token`, `uid` |
| Token refresh | `POST /oauth2/token` with `grant_type=refresh_token` |
| Registration | `POST /v3/user/register` (MD5 password) |
| Password reset | `POST /v3/user/resetPassword` (MD5 password) |
| Inbound callbacks | `POST /api/webhook` — receives TTLock unlock-record notifications (`notifyType=1`, `x-www-form-urlencoded` or JSON) and must reply with the literal body `success` |
| Client library | **None** — hand-written `fetch()` wrapper (`apiPost()` helper) in `src/lib/ttlock.ts` (987 lines, ~70 TTLock operations) |
| Endpoint groups used | `oauth2`, `user`, `lock`, `keyboardPwd`, `lockRecord`, `identityCard`/`icCard`, `fingerprint`, `key`, `gateway`, `standaloneDoorSensor` |

**Integration flow:**

```
Browser (React/SWR)
   └─► Next.js Route Handler  ── reads httpOnly cookie tt_token
          └─► src/lib/ttlock.ts (server-only, dynamic import)
                 └─► https://euapi.ttlock.com/v3/...   (clientId + accessToken + date)
                        └─► TTLock Cloud ──BLE──► TTLock Gateway ──► Smart Lock
```

**Security properties of the integration:** credentials and tokens stay server-side; tokens are
exposed to the browser only as httpOnly cookies; client secrets are never bundled into
client-side JavaScript.

---

## 6. Other Software Requirements

### 6.1 Runtime & tooling

| Requirement | Version / detail |
|---|---|
| Node.js | ^20 recommended (internal docs); **v24.14.1** used in the development environment |
| npm | **11.12.1** (ships with Node); lockfile `package-lock.json` (npm v3 lockfile format) |
| Package registry | npm (https://registry.npmjs.org) |
| Git | Repository hosted on GitHub (`qppd/id-guard`) |

### 6.2 Development / build-time dependencies (not shipped to production)

| Tool | Declared | Exact installed | Purpose |
|---|---|---|---|
| ESLint | `^9` | **9.39.4** | Linting |
| `eslint-config-next` | `16.2.9` | — | Next.js lint rules |
| `@types/react` | `^19` | — | React types |
| `@types/react-dom` | `^19` | — | React DOM types |
| `@types/node` | `^20` | — | Node types |
| `@types/nodemailer` | `^8.0.1` | — | Nodemailer types |
| `jsdom` | `^29.1.1` | — | Test/verification scripts |
| `mermaid` | `^12.0.0` | — | Diagram validation (`npm run check:mermaid`) |

### 6.3 npm scripts

| Script | Command |
|---|---|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint` |
| `check:mermaid` | `node scripts/check-mermaid.mjs` |

Utility scripts in `scripts/`: `check-mermaid.mjs`, `test-gateway-flows.mjs`,
`test-recurring-passcode.mjs`.

### 6.4 External accounts & third-party services

| Requirement | Purpose | Mandatory? |
|---|---|---|
| **TTLock developer account** | Issues `TTLOCK_CLIENT_ID` / `TTLOCK_CLIENT_SECRET` for the Cloud API | **Yes** |
| **TTLock cloud account + credentials** | End-user signs into the portal with their TTLock username/password | **Yes** |
| **TTLock hardware** | Smart locks, and a TTLock gateway for cloud/remote connectivity | **Yes** for real operation |
| **SMTP mailbox / provider** | Nodemailer sends eKey and unlock-link notification emails | No — feature degrades gracefully (`SMTP not configured`) |
| **Vercel account** | Hosting and environment variable storage | Yes (for the deployed portal) |
| **GitHub repository** | Source control + Vercel deployment pipeline | Yes (for the current deployment) |

### 6.5 Client-side (browser) requirements

- A modern evergreen browser with support for **ES2017+**, `localStorage`, `fetch`, and **WebGL**
  (required by the Three.js 3D scenes on the landing/login pages).
- JavaScript must be enabled; no browser extensions or plug-ins required.
- No mobile app, native runtime, or additional client software is required — the portal is
  purely a web application.

### 6.6 Configuration files present in the project

| File | Contents / status |
|---|---|
| `next.config.ts` | Empty config (all Next.js defaults) |
| `tsconfig.json` | `strict: true`, `target: ES2017`, `moduleResolution: bundler`, path alias `@/* → ./src/*` |
| `postcss.config.mjs` | Tailwind CSS v4 PostCSS plugin |
| `eslint.config.mjs` | Flat config, ESLint 9 |
| `.env.local` | 7 keys (git-ignored? see §8 note) |
| `.gitignore` | **Only contains `.vercel`** (see §8) |
| `vercel.json` | Absent (zero-config) |

---

## 7. Consolidated Version List (copy-ready for the thesis)

**Production runtime dependencies**

| Package | Version |
|---|---|
| `next` | 16.2.9 |
| `react` | 19.2.4 |
| `react-dom` | 19.2.4 |
| `swr` | 2.4.2 |
| `tailwindcss` | 4.3.1 |
| `@tailwindcss/postcss` | 4.3.1 |
| `three` | 0.185.1 |
| `@react-three/fiber` | 9.6.1 |
| `@react-three/drei` | 10.7.7 |
| `framer-motion` | 12.42.2 |
| `nodemailer` | 9.0.3 |

**Development dependencies:** `typescript` 5.9.3 · `eslint` 9.39.4 · `eslint-config-next` 16.2.9 ·
`@types/react` ^19 · `@types/react-dom` ^19 · `@types/node` ^20 · `@types/nodemailer` ^8.0.1 ·
`@types/three` ^0.185.1 · `jsdom` ^29.1.1 · `mermaid` ^12.0.0

**Platform:** Node.js 24.14.1 (dev) / npm 11.12.1 · Vercel serverless hosting ·
TTLock Cloud API V3 @ `https://euapi.ttlock.com`

**One-sentence summary suitable for a thesis citation:**

> *The ID GUARD Web Portal was implemented as a full-stack TypeScript application using
> Next.js 16.2.9 (App Router) with React 19.2.4 and Tailwind CSS 4.3.1 on the frontend, and
> Next.js Route Handlers running on Node.js on the backend. It uses no database — all
> access-control data is retrieved in real time from the TTLock Cloud API V3
> (`https://euapi.ttlock.com`) through an OAuth2-authenticated, server-side integration —
> and is deployed as serverless functions on Vercel at https://slsu-id-guard.vercel.app/.*

---

## 8. Corrections to Older Internal Docs

Verified discrepancies found during the scan — **use the corrected value**:

| # | Older doc says | Actual (verified in code) | Source of truth |
|---|---|---|---|
| 1 | Base URL `https://api.sciener.com` (`docs/stacks.md`, `README.md`, `references/`) | **`https://euapi.ttlock.com`** | `src/lib/ttlock.ts:4` |
| 2 | "17 API route handlers" / "24 endpoints" (`README.md`) | **50 route handlers**, ~70 TTLock operations | file count + `ttlock.ts` |
| 3 | `TTLOCK_WEBHOOK_SECRET` env var (`README.md`) | **Not read anywhere in the source**; not present in `.env.local`. The webhook performs **no signature verification**. | grep across `src/` |
| 4 | `cp .env.example .env.local` (`README.md`) | **No `.env.example` file exists** in the project | file listing |
| 5 | Node `^20` (`docs/stacks.md`) | No `engines` field declared; dev machine runs **Node 24.14.1** | `package.json`, `node -v` |
| 6 | Contact form sends email | `POST /api/contact` only **logs** to the server console; no email provider integrated | `src/app/api/contact/route.ts` |

**Two housekeeping findings (not affecting the requirement list):**

1. `.gitignore` contains only `.vercel`, so `.next/`, `node_modules/`, and `.env.local`
   are not excluded — also flagged in `audits/AUDIT.md` (item 1.2.7).
2. The Git remote URL stores a **GitHub personal access token in plain text**
   (`https://<token>@github.com/qppd/id-guard.git`). This token should be revoked and
   rotated, as it is exposed to anyone with read access to the repository configuration.
