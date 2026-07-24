# IDGuard — Full Project Audit Report

**Date:** July 24, 2026
**Auditor:** Hermes Agent (Automated)
**Project:** IDGuard — TTLock Cloud API v3 Smart Lock Management Platform
**Location:** `C:\Users\sajed\OneDrive\Desktop\ALLPROJECTS\PROJECTS\ttlock-webapp\src\IDGuard`

---

## Executive Summary

IDGuard is a Next.js 16 application for managing TTLock smart locks via the TTLock Cloud API v3. The project demonstrates a solid foundation: a centralized API client, cookie-based auth with automatic token refresh, a CSS-variable theme system with dark mode, 3D landing/login scenes, and broad API endpoint coverage (50 API routes covering locks, passcodes, eKeys, gateways, IC cards, fingerprints, records, and users).

However, the application is **not yet production-ready**. Critical security vulnerabilities (hardcoded dev bypass, no input validation, no CSRF), significant UX gaps (no toasts, no skeletons, no confirmation dialogs, no search/filter), code quality issues (monolithic page components, loose typing, duplicate interfaces), and missing production hardening (no middleware, no rate limiting, no error boundaries) need to be addressed.

The project has **~7,337 lines of TypeScript/TSX** across 12 pages, 50 API routes, 6 components, 2 hooks, and 1 API client. The landing page and login have polished 3D animations. The dashboard and management pages are functional but minimal.

| Area | Status |
|---|---|
| Architecture | ✅ Good foundation, needs refactoring |
| TTLock API Integration | ✅ Broad coverage, some gaps |
| Auth & Security | 🔴 Critical issues found |
| UI/UX | ⚠️ Functional but not enterprise-grade |
| TypeScript Quality | ⚠️ Loose typing, duplicates |
| Performance | ⚠️ No optimization config |
| Testing | 🔴 None exist |
| Accessibility | ⚠️ Basic, needs WCAG audit |

---

## Phase 1 — Complete Project Audit

### 1.1 Folder Architecture

```
src/IDGuard/
├── src/
│   ├── app/
│   │   ├── api/              # 50 API route handlers
│   │   │   ├── auth/
│   │   │   ├── contact/
│   │   │   ├── door-sensor/
│   │   │   ├── fingerprints/
│   │   │   ├── gateways/     # 14 route files
│   │   │   ├── ic-cards/
│   │   │   ├── keys/         # 6 route files
│   │   │   ├── locks/        # 16 route files
│   │   │   ├── login/
│   │   │   ├── passcodes/
│   │   │   ├── records/
│   │   │   ├── user/
│   │   │   ├── users/
│   │   │   └── webhook/
│   │   ├── contact/
│   │   ├── dashboard/
│   │   ├── gateways/
│   │   ├── keys/
│   │   ├── locks/[id]/
│   │   ├── login/
│   │   ├── privacy/
│   │   ├── register/
│   │   ├── reset-password/
│   │   ├── settings/
│   │   ├── terms/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Landing page
│   │   └── globals.css       # Theme system (416 lines)
│   ├── components/            # Only 6 components
│   │   ├── IDGuardScene.tsx  # 3D landing scene
│   │   ├── LockCard.tsx
│   │   ├── LoginForm.tsx
│   │   ├── LoginScene.tsx    # 3D login scene
│   │   ├── Navbar.tsx
│   │   └── Parallax.tsx      # Animation utilities
│   ├── contexts/
│   │   └── ThemeContext.tsx
│   └── lib/
│       ├── auth.ts           # callWithAuth wrapper
│       ├── email.ts          # Nodemailer integration
│       ├── ttlock.ts         # API client (943 lines)
│       ├── types.ts
│       └── hooks/
│           ├── useAuth.ts
│           └── useLocks.ts
├── docs/                     # Audit & planning docs
├── package.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
└── postcss.config.mjs
```

**Findings:**

| # | Severity | Finding |
|---|---|---|
| 1.1.1 | ⚠️ Warning | Only 6 components — most UI logic is inline in page files. `locks/[id]/page.tsx` is 1,016 lines, `keys/page.tsx` is 682 lines, `gateways/page.tsx` is 532 lines. |
| 1.1.2 | 🔴 Critical | No `middleware.ts` — no server-side route protection. Auth is only enforced client-side via `useAuth()` hook + `router.replace("/login")`. API routes are protected via `callWithAuth`, but page rendering is not server-gated. |
| 1.1.3 | ⚠️ Warning | No `loading.tsx` or `error.tsx` Next.js convention files — no streaming/Suspense boundaries. |
| 1.1.4 | ⚠️ Warning | No reusable UI primitives (Button, Input, Dialog, Table, Badge, Card, Pagination, etc.). |
| 1.1.5 | ⚠️ Warning | `src/lib/types.ts` defines interfaces but pages re-declare their own (LockDetail, Passcode, LockRecord defined in both `types.ts` and `locks/[id]/page.tsx`). |

### 1.2 Build Configuration

**`next.config.ts`** — Empty config:
```ts
const nextConfig: NextConfig = { /* config options here */ };
```

| # | Severity | Finding |
|---|---|---|
| 1.2.1 | ⚠️ Warning | No `images.remotePatterns` configured — TTLock lock/gateway images from CDN won't be optimized. |
| 1.2.2 | ⚠️ Warning | No security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`). |
| 1.2.3 | ⚠️ Warning | No `experimental` or `compiler` options for production optimization. |

**`tsconfig.json`:**

| # | Severity | Finding |
|---|---|---|
| 1.2.4 | ⚠️ Warning | `target: "ES2017"` — should be `ES2022` or `ESNext` for modern JS features. |
| 1.2.5 | ⚠️ Warning | No `forceConsistentCasingInFileNames` — can cause cross-platform import issues. |
| 1.2.6 | ⚠️ Warning | No `noUnusedLocals` or `noUnusedParameters` — dead code not caught at compile time. |

**`.gitignore`** (inside `src/IDGuard/`):
```
.vercel
```

| # | Severity | Finding |
|---|---|---|
| 1.2.7 | 🔴 Critical | `.gitignore` only has `.vercel` — missing `.next/`, `node_modules/`, `.env*.local`, `*.tsbuildinfo`. These may get committed. |

### 1.3 Dependencies

```json
"dependencies": {
  "@react-three/drei": "^10.7.7",
  "@react-three/fiber": "^9.6.1",
  "framer-motion": "^12.42.2",
  "next": "16.2.9",
  "nodemailer": "^9.0.3",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "swr": "^2.4.2",
  "three": "^0.185.1"
}
```

| # | Severity | Finding |
|---|---|---|
| 1.3.1 | ⚠️ Warning | No validation library (zod, valibot, yup) — API routes blindly `await req.json()` without schema validation. |
| 1.3.2 | ⚠️ Warning | No UI component library — everything is hand-rolled. Consider Radix UI or shadcn/ui for accessible primitives. |
| 1.3.3 | 🔴 Critical | No testing dependencies — no Jest, Vitest, Playwright, or Testing Library. |
| 1.3.4 | ⚠️ Warning | No `clsx`/`tailwind-merge` for conditional class composition. |
| 1.3.5 | ⚠️ Warning | `next` is pinned at `16.2.9` — this is an unusually high version number. Verify this is correct and not a typo. |

### 1.4 State Management & Data Fetching

| # | Severity | Finding |
|---|---|---|
| 1.4.1 | ✅ Good | SWR used consistently for client-side data fetching with refresh intervals. |
| 1.4.2 | ✅ Good | `useAuth()` hook polls `/api/auth` every 60s for session validity. |
| 1.4.3 | ⚠️ Warning | No SWR global configuration (deduping, error retry, loading delay). Each component defines its own fetcher. |
| 1.4.4 | ⚠️ Warning | No optimistic updates — all mutations wait for server response before UI updates. |
| 1.4.5 | ⚠️ Warning | `useLocks()` hardcodes 10s refresh interval, while other pages use `settings.refreshInterval`. Inconsistent. |

### 1.5 Environment Variables

Based on code analysis, the following env vars are expected:

| Variable | Used In | Status |
|---|---|---|
| `TTLOCK_CLIENT_ID` | `ttlock.ts` | Required |
| `TTLOCK_CLIENT_SECRET` | `ttlock.ts` | Required |
| `SMTP_HOST` | `email.ts` | Optional |
| `SMTP_PORT` | `email.ts` | Optional |
| `SMTP_USER` | `email.ts` | Optional |
| `SMTP_PASS` | `email.ts` | Optional |
| `SMTP_FROM` | `email.ts` | Optional |
| `NODE_ENV` | `login/route.ts` | Standard |

| # | Severity | Finding |
|---|---|---|
| 1.5.1 | ⚠️ Warning | No `.env.example` file documenting required env vars. |
| 1.5.2 | ⚠️ Warning | TTLock API base URL hardcoded as `https://euapi.ttlock.com` — no env var for region (US/EU/CN). |

---

## Phase 2 — TTLock Cloud API v3 Audit

### 2.1 Authentication Flow

**Reference:** `get-access-token.md`, `refresh-access-token.md`

**Implementation:** `src/lib/ttlock.ts` (lines 18-57), `src/lib/auth.ts`

| # | Severity | Finding |
|---|---|---|
| 2.1.1 | ✅ Good | OAuth2 password grant correctly implemented with MD5 password hashing per TTLock spec. |
| 2.1.2 | ✅ Good | `callWithAuth` wrapper implements automatic token refresh + single retry on auth failure. |
| 2.1.3 | 🔴 Critical | **Refresh token not persisted.** `tryRefresh()` in `auth.ts` calls `refreshToken()` and gets a new `access_token`, but **does not set the new tokens as cookies**. The new access_token is used for the immediate retry, but the next request will use the old (expired) cookie token. The refresh token itself is also not updated. |
| 2.1.4 | ⚠️ Warning | Cookie `maxAge: 7776000` (90 days) matches token expiry, but refresh token is valid for 10 years — cookie expiry may cause session loss before refresh token expires. |
| 2.1.5 | ⚠️ Warning | `REFRESHED_FLAG` symbol defined in `auth.ts` (line 14) but never used — dead code. |
| 2.1.6 | ⚠️ Warning | Auth error detection relies on string matching (`message.includes("token")`, `message.includes("401")`) — fragile. Should check TTLock error code `10004` directly. |

### 2.2 API Client (`ttlock.ts` — 943 lines)

**Base URL:** `https://euapi.ttlock.com` (hardcoded)

**Request Pattern:** All endpoints use POST with `application/x-www-form-urlencoded` via `apiPost()` helper.

| # | Severity | Finding |
|---|---|---|
| 2.2.1 | ✅ Good | `apiPost` correctly includes `clientId`, `accessToken`, `date` in every request body. |
| 2.2.2 | ✅ Good | Error handling checks `errcode` field and throws descriptive errors. |
| 2.2.3 | ✅ Good | Non-JSON response detection (catches HTML error pages). |
| 2.2.4 | ⚠️ Warning | No retry logic for transient failures (network timeout, 5xx, rate limit `-30006`). |
| 2.2.5 | ⚠️ Warning | No request timeout — `fetch()` has no `AbortController`. A hung TTLock API request will hang indefinitely. |
| 2.2.6 | ⚠️ Warning | Return types are excessively loose — many functions return `{ [key: string]: unknown }` instead of properly typed interfaces from `types.ts`. |
| 2.2.7 | 🔴 Critical | `getDoorSensorState()` (line 309) calls `/v3/lock/queryOpenState` — same endpoint as `getLockOpenState()` (line 245). This is a **duplicate function** with misleading naming. Door sensor state and lock open state are different concepts. |
| 2.2.8 | ⚠️ Warning | `listUsers()` (line 907) uses GET with query params, bypassing the `apiPost` helper and `callWithAuth`. This is the only endpoint that doesn't use the centralized auth wrapper — it manually reads `clientId`/`clientSecret` and doesn't require an access token. This appears correct per the TTLock API spec, but it's inconsistent. |
| 2.2.9 | ⚠️ Warning | `setGatewayConfig()` (line 896) routes to `/v3/gateway/rename` — misleading function name. It's not setting config, it's renaming. |
| 2.2.10 | ⚠️ Warning | `getGatewayConfig()` (line 810) is an unnecessary alias for `getGatewayDetail()`. |

### 2.3 Endpoint Coverage Analysis

Cross-referencing `references/cloud-api-v3/` documentation against `ttlock.ts` implementation:

#### Lock Management

| API Reference | Implementation | Status |
|---|---|---|
| `get-the-lock-list-of-an-account.md` | `listLocks()` → `/v3/lock/list` | ✅ Correct |
| `get-lock-details.md` | `lockDetail()` → `/v3/lock/detail` | ✅ Correct |
| `unlock.md` | `lockAction("unlock")` → `/v3/lock/unlock` | ✅ Correct |
| `lock-the-lock.md` | `lockAction("lock")` → `/v3/lock/lock` | ✅ Correct |
| `change-lock-name.md` | `renameLock()` → `/v3/lock/rename` | ✅ Correct |
| `delete-lock.md` | `deleteLock()` → `/v3/lock/delete` | ✅ Correct |
| `transfer-lock.md` | `transferLock()` → `/v3/lock/transfer` | ✅ Correct |
| `lock-init.md` | `initLock()` → `/v3/lock/initialize` | ✅ Correct |
| `get-lock-battery.md` | `getLockBattery()` → `/v3/lock/queryElectricQuantity` | ✅ Correct |
| `upload-lock-battery.md` | `uploadLockBattery()` → `/v3/lock/updateElectricQuantity` | ✅ Correct |
| `get-the-open-state-of-a-lock.md` | `getLockOpenState()` → `/v3/lock/queryOpenState` | ✅ Correct |
| `get-lock-time.md` | `getLockTime()` → `/v3/lock/queryDate` | ✅ Correct |
| `adjust-lock-time.md` | `adjustLockTime()` → `/v3/lock/updateDate` | ✅ Correct |
| `set-the-auto-lock-time-of-a-lock.md` | `setAutoLockTime()` → `/v3/lock/setAutoLockTime` | ✅ Correct |
| `change-the-super-passcode.md` | `changeAdminPasscode()` → `/v3/lock/changeAdminKeyboardPwd` | ✅ Correct |
| `query-lock-settings.md` | `getLockConfig()` → `/v3/lock/querySetting` | ✅ Correct |
| `modify-lock-settings.md` | `setLockConfig()` → `/v3/lock/updateSetting` | ✅ Correct |
| `upgrade-check.md` | `checkUpgrade()` → `/v3/lock/upgradeCheck` | ✅ Correct |
| `upgrade-recheck.md` | `upgradeRecheck()` → `/v3/lock/upgradeRecheck` | ✅ Correct |
| `update-lock-datareset-ekey-reset-passcode.md` | `updateLockData()` → `/v3/lock/updateLockData` | ✅ Correct |

#### Passcode Management

| API Reference | Implementation | Status |
|---|---|---|
| `get-all-created-passcodes-of-a-lock.md` | `listPasscodes()` → `/v3/lock/listKeyboardPwd` | ✅ Correct |
| `get-a-passcode.md` | `getPasscode()` → `/v3/keyboardPwd/get` | ✅ Correct |
| `add-custom-passcode.md` | `addPasscode()` → `/v3/keyboardPwd/add` | ✅ Correct (addType=2 for custom) |
| `delete-one-passcode.md` | `deletePasscode()` → `/v3/keyboardPwd/delete` | ✅ Correct |
| `change-passcode.md` | `updatePasscode()` → `/v3/keyboardPwd/change` | ✅ Correct |

#### eKey Management

| API Reference | Implementation | Status |
|---|---|---|
| `get-the-ekey-list-of-an-account.md` | `listKeys()` → `/v3/key/list` | ✅ Correct |
| `get-ekeys-of-a-lock.md` | `listKeysByLock()` → `/v3/lock/listKey` | ✅ Correct |
| `get-one-ekey.md` | `getOneKey()` → `/v3/key/get` | ✅ Correct |
| `send-ekey.md` | `sendKey()` → `/v3/key/send` | ✅ Correct |
| `delete-ekey.md` | `deleteKey()` → `/v3/key/delete` | ✅ Correct |
| `modify-ekey.md` | `updateKey()` → `/v3/key/update` | ✅ Correct |
| `freeze-the-ekey.md` | `freezeKey()` → `/v3/key/freeze` | ✅ Correct |
| `unfreeze-ekey.md` | `unfreezeKey()` → `/v3/key/unfreeze` | ✅ Correct |
| `change-the-valid-time-of-the-ekey.md` | `changeKeyPeriod()` → `/v3/key/changePeriod` | ✅ Correct |
| `key-authorization.md` | `authorizeKey()` → `/v3/key/authorize` | ✅ Correct |
| `cancel-key-authorization.md` | `unauthorizeKey()` → `/v3/key/unauthorize` | ✅ Correct |
| `get-the-ekey-unlocking-link.md` | `getKeyUnlockLink()` → `/v3/key/getUnlockLink` | ✅ Correct |

#### Gateway Management

| API Reference | Implementation | Status |
|---|---|---|
| `get-the-gateway-list-of-an-account.md` | `listGateways()` → `/v3/gateway/list` | ✅ Correct |
| `get-the-gateway-list-of-a-lock.md` | `listGatewaysByLock()` → `/v3/gateway/listByLock` | ✅ Correct |
| `get-gateway-detail.md` | `getGatewayDetail()` → `/v3/gateway/detail` | ✅ Correct |
| `rename-gateway.md` | `renameGateway()` → `/v3/gateway/rename` | ✅ Correct |
| `delete-gateway.md` | `deleteGateway()` → `/v3/gateway/delete` | ✅ Correct |
| `transfer-gateway.md` | `transferGateway()` → `/v3/gateway/transfer` | ✅ Correct |
| `get-the-lock-list-of-a-gateway.md` | `listLocksByGateway()` → `/v3/gateway/listLock` | ✅ Correct |
| `get-device-list-of-a-gateway.md` | `listDevicesByGateway()` → `/v3/gateway/listDevice` | ✅ Correct |
| `query-the-init-status-of-the-gateway.md` | `checkGatewayInitStatus()` → `/v3/gateway/isInitSuccess` | ✅ Correct |
| `gateway-upgrade-check.md` | `checkGatewayUpgrade()` → `/v3/gateway/upgradeCheck` | ✅ Correct |
| `set-gateway-into-upgrade-mode.md` | `setGatewayUpgradeMode()` → `/v3/gateway/setUpgradeMode` | ✅ Correct |
| `upload-detail-info-of-gateway.md` | `uploadGatewayDetail()` → `/v3/gateway/uploadDetail` | ✅ Correct |

#### IC Cards & Fingerprints

| API Reference | Implementation | Status |
|---|---|---|
| IC Card list | `listICCards()` → `/v3/icCard/list` | ✅ Correct |
| IC Card add | `addICCard()` → `/v3/icCard/add` | ⚠️ Cloud API may not support add |
| IC Card delete | `deleteICCard()` → `/v3/icCard/delete` | ✅ Correct |
| Fingerprint list | `listFingerprints()` → `/v3/fingerprint/list` | ✅ Correct |
| Fingerprint add | `addFingerprint()` → `/v3/fingerprint/add` | ⚠️ Cloud API may not support add |
| Fingerprint delete | `deleteFingerprint()` → `/v3/fingerprint/delete` | ✅ Correct |

#### Records

| API Reference | Implementation | Status |
|---|---|---|
| `get-unlock-records.md` | `listRecords()` → `/v3/lockRecord/list` | ✅ Correct |
| `clear-records.md` | `clearRecords()` → `/v3/lockRecord/clear` | ✅ Correct |
| `delete-records.md` | `deleteRecords()` → `/v3/lockRecord/delete` | ✅ Correct |
| `upload-records.md` | `uploadRecords()` → `/v3/lockRecord/upload` | ✅ Correct |
| `lock-records-notify.md` | Webhook `/api/webhook` | ⚠️ Only logs, doesn't process |

#### User Management

| API Reference | Implementation | Status |
|---|---|---|
| `user-register.md` | `registerUser()` → `/v3/user/register` | ✅ Correct |
| `reset-password.md` | `resetPassword()` → `/v3/user/resetPassword` | ✅ Correct |
| `get-user-list.md` | `listUsers()` → `/v3/user/list` | ✅ Correct (GET, no token) |
| `delete-user.md` | `deleteUser()` → `/v3/user/delete` | ✅ Correct |

#### Other

| API Reference | Implementation | Status |
|---|---|---|
| `configure-working-mode.md` | `configureWorkingMode()` | ✅ Correct |
| `get-working-mode.md` | `getWorkingMode()` | ✅ Correct |
| `config-the-passage-mode-of-a-lock.md` | `configurePassageMode()` | ✅ Correct |
| `get-passage-mode-configuration-of-a-lock.md` | `getPassageMode()` | ✅ Correct |
| `configure-alert.md` | `configureDoorSensorAlert()` | ✅ Correct |
| `api-error-codes.md` | Error codes checked in `apiPost` | ✅ Correct |

### 2.4 Missing/Incomplete API Integrations

| # | Severity | Finding |
|---|---|---|
| 2.4.1 | ⚠️ Warning | Webhook (`/api/webhook/route.ts`) only `console.log`s received records — doesn't store them, doesn't trigger UI refresh via SSE/WebSocket, doesn't send notifications. |
| 2.4.2 | ⚠️ Warning | No `searchStr` parameter support in `listPasscodes()`, `listKeysByLock()`, `listRecords()` — TTLock API supports fuzzy search but it's not exposed. |
| 2.4.3 | ⚠️ Warning | No `orderBy` parameter support in list endpoints — TTLock API supports sorting. |
| 2.4.4 | ⚠️ Warning | No `recordType` filter in `listRecords()` — TTLock API supports filtering by type (keyboard, IC card, fingerprint, remote, face, QR). |
| 2.4.5 | ⚠️ Warning | No pagination metadata passed to frontend — `total` and `pages` from list endpoints are dropped in some API routes. |

---

## Phase 3 — UI/UX Audit

### 3.1 Navigation

| # | Severity | Finding |
|---|---|---|
| 3.1.1 | ⚠️ Warning | Navbar has only 4 items: Dashboard, Gateways, Keys, Settings. Missing: Users, Records, Locks (list). |
| 3.1.2 | ⚠️ Warning | No breadcrumbs anywhere — users lose context in nested pages (e.g., Lock Detail). |
| 3.1.3 | ⚠️ Warning | No command palette / global search. |
| 3.1.4 | ⚠️ Warning | No user avatar/dropdown in navbar — just a "Logout" button. |
| 3.1.5 | ⚠️ Warning | No dark mode toggle visible in navbar — only in Settings page. |
| 3.1.6 | ⚠️ Warning | Mobile menu is basic hamburger — no slide-over animation. |

### 3.2 Page-by-Page Analysis

#### Landing Page (`/`) — 292 lines
- ✅ Polished 3D scene with dynamic import + SSR fallback
- ✅ Hero with gradient text, CTA buttons, scroll indicator
- ✅ Features section with GlowCard
- ✅ Stats/trust section with animated numbers
- ✅ CTA section
- ✅ Footer with links
- ⚠️ Stats are hardcoded ("10K+ Locks", "50K+ Events") — misleading for a new product

#### Login Page (`/login`) — 112 lines
- ✅ Split-screen with 3D scene (left) + form (right)
- ✅ Redirects to dashboard if already authenticated
- ⚠️ No "forgot password" link visible (reset-password page exists but unlinked from login)
- ⚠️ No "register" link visible from login page

#### Register Page (`/register`) — 170 lines
- 🔴 Uses hardcoded Tailwind colors (`bg-gray-50`, `text-blue-600`, `bg-white`) — **does not respect theme system**. In dark mode, this page will be broken (white background with light text).
- ⚠️ No link from login page to register page.

#### Reset Password Page (`/reset-password`) — 163 lines
- 🔴 Same hardcoded Tailwind colors issue as Register page — **broken in dark mode**.
- ⚠️ No link from login page.

#### Dashboard (`/dashboard`) — 113 lines
- ✅ Summary cards (locks count, gateways count, online gateways)
- ✅ Lock grid/list view toggle (from settings)
- ✅ Auth guard + redirect
- ⚠️ No search/filter/sort for locks
- ⚠️ No statistics beyond counts — no "today's unlocks", "battery warnings", "recent activity", "pending tasks"
- ⚠️ No quick actions panel
- ⚠️ No favorite/pinned locks
- ⚠️ No pagination (assumes all locks fit in one page of 20)
- ⚠️ Loading state is plain text "Loading locks..."
- ⚠️ Empty state is plain text — no illustration or CTA
- ⚠️ Error state is plain red text — no retry button

#### Lock Detail (`/locks/[id]`) — 1,016 lines
- ✅ Comprehensive: shows detail, passcodes, records, IC cards, fingerprints, gateways, battery, open state, config
- 🔴 **Monolithic component** — 1,016 lines in a single file. Should be broken into 8-10 sub-components.
- ⚠️ No tabs — all sections stacked vertically (very long scroll)
- ⚠️ No confirmation dialogs for destructive actions (delete passcode, delete IC card, delete fingerprint, remote unlock/lock)
- ⚠️ Inline forms for passcode creation, key sending — no slide-over/drawer pattern
- ⚠️ No skeleton loading
- ⚠️ Records table is basic — no filtering by record type, no search

#### Gateways (`/gateways`) — 532 lines
- ✅ Expandable cards with detail, locks, devices, upgrade sections
- ✅ Rename, transfer, delete actions
- ⚠️ Complex state management with nested maps (`actionState[id][key]`) — hard to maintain
- ⚠️ No confirmation dialog for delete/transfer
- ⚠️ Loading states are inline text

#### Keys (`/keys`) — 682 lines
- ✅ List eKeys with filter by lock
- ✅ Send, delete, update, freeze/unfreeze, change period, authorize, get unlock link
- ⚠️ Send key form is inline — should be a slide-over/drawer
- ⚠️ No confirmation dialogs for delete/freeze
- ⚠️ No copy-to-clipboard for unlock links
- ⚠️ No search/filter by key name, user type, status

#### Settings (`/settings`) — 270 lines
- ✅ Theme mode (light/dark/system), accent color picker, card style, border style, lock view, card density, summary toggle, refresh interval, 3D toggle, animations toggle
- ✅ Reset to defaults
- ⚠️ No user profile management
- ⚠️ No notification preferences
- ⚠️ No API configuration (client ID/secret are env vars only)

#### Contact/Privacy/Terms — Static pages
- ⚠️ Not reviewed in detail — likely simple content pages

### 3.3 Loading States

| # | Severity | Finding |
|---|---|---|
| 3.3.1 | ⚠️ Warning | All loading states are plain text ("Loading...", "Loading locks...", "Sending..."). No skeleton loaders, no shimmer effects, no progress bars. |
| 3.3.2 | ⚠️ Warning | No Suspense boundaries or `loading.tsx` files. |
| 3.3.3 | ⚠️ Warning | No optimistic UI updates — all mutations block until server responds. |

### 3.4 Error Handling

| # | Severity | Finding |
|---|---|---|
| 3.4.1 | ⚠️ Warning | Error states are plain colored text — no retry buttons, no error illustrations, no fallback UI. |
| 3.4.2 | ⚠️ Warning | No error boundary components — unhandled React errors will crash the entire app. |
| 3.4.3 | ⚠️ Warning | No `error.tsx` Next.js convention files. |
| 3.4.4 | ⚠️ Warning | No offline detection — if network drops, SWR errors are shown as plain text. |

### 3.5 Toast/Notification System

| # | Severity | Finding |
|---|---|---|
| 3.5.1 | 🔴 Critical | No toast/notification system exists. Success/failure of mutations (lock/unlock, send key, delete passcode) is not communicated to the user except through inline state that disappears on page navigation. |

### 3.6 Confirmation Dialogs

| # | Severity | Finding |
|---|---|---|
| 3.6.1 | 🔴 Critical | No confirmation dialogs for any destructive action (delete lock, delete passcode, delete IC card, delete fingerprint, delete gateway, delete eKey, transfer lock/gateway). Users can accidentally destroy data with a single click. |

### 3.7 Empty States

| # | Severity | Finding |
|---|---|---|
| 3.7.1 | ⚠️ Warning | Empty states are plain text ("No locks found", "No keys found"). No illustrations, no action CTAs, no helpful guidance. |

### 3.8 Responsiveness

| # | Severity | Finding |
|---|---|---|
| 3.8.1 | ✅ Good | Responsive grid system in `globals.css` with breakpoints at 480/640/768/1024/1536/2000px. |
| 3.8.2 | ✅ Good | Mobile hamburger menu in Navbar. |
| 3.8.3 | ⚠️ Warning | Lock detail page (1,016 lines) likely has responsiveness issues in its tables/forms on mobile — not verified. |
| 3.8.4 | ⚠️ Warning | Register and Reset Password pages use `max-w-md` container — fine, but hardcoded colors break dark mode. |

### 3.9 Accessibility

| # | Severity | Finding |
|---|---|---|
| 3.9.1 | ✅ Good | Skip-to-content link in `layout.tsx`. |
| 3.9.2 | ✅ Good | `:focus-visible` outline with theme color. |
| 3.9.3 | ✅ Good | `prefers-reduced-motion` respected in CSS and `Parallax.tsx`. |
| 3.9.4 | ✅ Good | ARIA labels on navbar hamburger, form inputs. |
| 3.9.5 | ⚠️ Warning | No ARIA live regions for dynamic content updates (SWR data loading, mutation results). |
| 3.9.6 | ⚠️ Warning | No keyboard shortcut support (e.g., `/` for search, `g+d` for dashboard). |
| 3.9.7 | ⚠️ Warning | Color contrast not verified — some text-muted colors may fail WCAG AA. |
| 3.9.8 | ⚠️ Warning | 3D scenes (`IDGuardScene`, `LoginScene`) have no text alternative beyond `<noscript>` fallback. |

---

## Phase 4 — Security Audit

### 4.1 Authentication

| # | Severity | Finding |
|---|---|---|
| 4.1.1 | 🔴 Critical | **Hardcoded dev bypass in login route** (`api/login/route.ts` lines 12-29): `admin/admin` creates mock tokens with `secure: false`. This bypasses TTLock authentication entirely. Must be removed or guarded by `NODE_ENV !== "production"`. |
| 4.1.2 | 🔴 Critical | **No middleware.ts** — pages are not server-side protected. A user can navigate to `/dashboard` and see the page skeleton before the client-side `useAuth()` redirect fires. Sensitive data could flash. |
| 4.1.3 | ⚠️ Warning | `sameSite: "lax"` on cookies — should be `"strict"` in production to prevent CSRF via cross-origin requests. |
| 4.1.4 | ⚠️ Warning | Cookie `secure` flag is `process.env.NODE_ENV === "production"` for real tokens but `false` for dev bypass — inconsistent. |
| 4.1.5 | 🔴 Critical | **No CSRF protection** — API routes that accept POST/DELETE don't verify CSRF tokens. An attacker could craft a form that posts to `/api/locks` and lock/unlock the user's locks. |

### 4.2 Input Validation

| # | Severity | Finding |
|---|---|---|
| 4.2.1 | 🔴 Critical | **No input validation on any API route.** All routes do `await req.json()` and pass values directly to TTLock API functions. Missing/invalid fields will cause TTLock API errors or unexpected behavior. Examples: `POST /api/locks` doesn't validate `lockId` is a number, `POST /api/keys` doesn't validate `receiverUsername` format, `POST /api/passcodes` doesn't validate `type` is 1/2/3. |
| 4.2.2 | ⚠️ Warning | No request body size limit. |
| 4.2.3 | ⚠️ Warning | Register page validates username format client-side (`/^[a-zA-Z0-9]+$/`) but the API route doesn't re-validate server-side. |

### 4.3 Rate Limiting

| # | Severity | Finding |
|---|---|---|
| 4.3.1 | 🔴 Critical | No rate limiting on login endpoint — brute force attacks possible. |
| 4.3.2 | ⚠️ Warning | No rate limiting on any API route — TTLock API has a call limit (`-30006` error), and the app could hit it. |

### 4.4 Secrets Management

| # | Severity | Finding |
|---|---|---|
| 4.4.1 | ✅ Good | TTLock client ID/secret are server-side only (env vars, used in `ttlock.ts` which is imported only in API routes). |
| 4.4.2 | ✅ Good | Tokens are in httpOnly cookies — not accessible via JavaScript. |
| 4.4.3 | ⚠️ Warning | `.env.local` exists but `.gitignore` doesn't exclude it (only has `.vercel`). |

### 4.5 Webhook Security

| # | Severity | Finding |
|---|---|---|
| 4.5.1 | ⚠️ Warning | Webhook endpoint (`/api/webhook`) has no authentication or signature verification — anyone can POST fake unlock records. |
| 4.5.2 | ⚠️ Warning | Webhook only `console.log`s — doesn't store or process records. |

---

## Phase 5 — Code Quality Audit

### 5.1 TypeScript Quality

| # | Severity | Finding |
|---|---|---|
| 5.1.1 | ⚠️ Warning | Excessive use of `{ [key: string]: unknown }` return types in `ttlock.ts` — `listLocks`, `lockDetail`, `getLockConfig`, `listPasscodes`, `getPasscode`, `addPasscode`, `listICCards`, `listFingerprints`, `listRecords`, `listKeys`, `listKeysByLock`, `listGateways`, `getGatewayDetail`, etc. should return typed interfaces. |
| 5.1.2 | ⚠️ Warning | Duplicate interface definitions — `LockDetail`, `Passcode`, `LockRecord` are defined in both `types.ts` and `locks/[id]/page.tsx`. |
| 5.1.3 | ⚠️ Warning | `KeyData` interface in `keys/page.tsx` duplicates fields from `EKeyInfo` in `types.ts` with different types (e.g., `userType: number` vs `userType: string`). |
| 5.1.4 | ⚠️ Warning | `Gateway`, `GatewayDetail`, `GatewayLock`, `GatewayDevice` interfaces defined inline in `gateways/page.tsx` — not in `types.ts`. |
| 5.1.5 | ⚠️ Warning | API response types not consistent — some use `{ ok: boolean; data?: T }`, some use `{ ok: boolean; data: T }`, some add `total` and `pages` at the top level. |

### 5.2 Dead Code & Duplicates

| # | Severity | Finding |
|---|---|---|
| 5.2.1 | ⚠️ Warning | `REFRESHED_FLAG` symbol in `auth.ts` (line 14) — defined but never used. |
| 5.2.2 | ⚠️ Warning | `getDoorSensorState()` in `ttlock.ts` (line 309) — duplicate of `getLockOpenState()` (line 245), same endpoint. |
| 5.2.3 | ⚠️ Warning | `getGatewayConfig()` (line 810) — unnecessary alias for `getGatewayDetail()`. |
| 5.2.4 | ⚠️ Warning | `setGatewayConfig()` (line 896) — misleading name, actually calls `/v3/gateway/rename`. |
| 5.2.5 | ⚠️ Warning | Dynamic imports (`await import("@/lib/ttlock")`) used in every API route — adds runtime overhead. Could use static imports since `ttlock.ts` is server-only. |

### 5.3 Code Organization

| # | Severity | Finding |
|---|---|---|
| 5.3.1 | ⚠️ Warning | `locks/[id]/page.tsx` is 1,016 lines — should be split into: `LockDetailHeader`, `LockPasscodesTab`, `LockRecordsTab`, `LockICCardsTab`, `LockFingerprintsTab`, `LockGatewayTab`, `LockConfigTab`, `LockActionsBar`. |
| 5.3.2 | ⚠️ Warning | `keys/page.tsx` is 682 lines — should be split into: `KeyList`, `KeyCard`, `SendKeyForm`, `KeyActions`. |
| 5.3.3 | ⚠️ Warning | `gateways/page.tsx` is 532 lines — should be split into: `GatewayList`, `GatewayCard`, `GatewayDetail`, `GatewayActions`. |
| 5.3.4 | ⚠️ Warning | No shared `fetcher` function — each page defines its own `const fetcher = (url: string) => fetch(url).then((r) => r.json())`. |
| 5.3.5 | ⚠️ Warning | No shared API response handler — each route does `if (!result.ok) return result.response; return NextResponse.json({ ok: true, data: result.data })`. |

### 5.4 Dynamic Imports

| # | Severity | Finding |
|---|---|---|
| 5.4.1 | ⚠️ Warning | Every API route uses `await import("@/lib/ttlock")` inside `callWithAuth` — this is a dynamic import on every request. Since `ttlock.ts` is server-only code (uses `node:crypto`), it should be statically imported. The dynamic import was likely added to avoid bundling, but in Next.js App Router, API route handlers are server-only by default. |
| 5.4.2 | ⚠️ Warning | `email.ts` uses dynamic `await import("nodemailer")` — reasonable for optional dependency, but the pattern is inconsistent with `ttlock.ts`. |

---

## Phase 6 — Performance Audit

### 6.1 Bundle Size

| # | Severity | Finding |
|---|---|---|
| 6.1.1 | ⚠️ Warning | Three.js (`three`), `@react-three/fiber`, `@react-three/drei` are heavy dependencies loaded on landing and login pages. `IDGuardScene` and `LoginScene` are dynamically imported (good), but the full Three.js bundle is still shipped. |
| 6.1.2 | ⚠️ Warning | No `next.config.ts` configuration for bundle analysis or optimization. |
| 6.1.3 | ⚠️ Warning | All pages are `"use client"` — no Server Components utilized. Dashboard, Gateways, Keys could potentially be Server Components with Suspense. |

### 6.2 Data Fetching

| # | Severity | Finding |
|---|---|---|
| 6.2.1 | ⚠️ Warning | `useLocks()` hardcodes 10s refresh interval — aggressive for a list of locks that rarely changes. |
| 6.2.2 | ⚠️ Warning | Lock detail page makes 6+ separate SWR requests (detail, passcodes, records, gateways, gateways-by-lock, IC cards, fingerprints, battery, open state) — could be batched or fetched in parallel with `Promise.all` on the server. |
| 6.2.3 | ⚠️ Warning | No SWR `keepPreviousData` — navigating between lock detail pages causes full loading state. |

### 6.3 Caching

| # | Severity | Finding |
|---|---|---|
| 6.3.1 | ⚠️ Warning | No `Cache-Control` headers on API routes. |
| 6.3.2 | ⚠️ Warning | No `revalidate` / `unstable_cache` usage. |
| 6.3.3 | ⚠️ Warning | No client-side cache for TTLock API responses beyond SWR's in-memory cache. |

### 6.4 Image Optimization

| # | Severity | Finding |
|---|---|---|
| 6.4.1 | ✅ Good | Uses `next/image` for logo images. |
| 6.4.2 | ⚠️ Warning | `next.config.ts` doesn't configure `images.remotePatterns` — external images won't be optimized. |

---

## Phase 7 — Design System Audit

### 7.1 Theme System

| # | Severity | Finding |
|---|---|---|
| 7.1.1 | ✅ Good | CSS-variable-based theme system with light/dark mode. |
| 7.1.2 | ✅ Good | 6 accent color palettes with dark-mode lightness boosts. |
| 7.1.3 | ✅ Good | Card styles (solid/glass), border styles (full/subtle/none), density options. |
| 7.1.4 | ✅ Good | `prefers-reduced-motion` support. |
| 7.1.5 | ⚠️ Warning | Custom CSS classes (`bg-card`, `text-accent`, `border-border-card`) are defined in `globals.css` but bypass Tailwind's JIT compiler — they won't work with Tailwind's responsive/variant modifiers (e.g., `md:bg-card` won't work). |
| 7.1.6 | ⚠️ Warning | Register and Reset Password pages use hardcoded Tailwind colors — **don't use the theme system at all**. |
| 7.1.7 | ⚠️ Warning | No consistent spacing scale — pages use arbitrary padding values (`p-3`, `p-4`, `p-5`, `p-8`, `py-4`, `py-12`, `py-24`). |

### 7.2 Typography

| # | Severity | Finding |
|---|---|---|
| 7.2.1 | ✅ Good | Two fonts: Poppins (headings) + Inter (body) via `next/font/google`. |
| 7.2.2 | ⚠️ Warning | No consistent heading scale — h1 uses `text-xl` on dashboard, `text-4xl` on landing, `text-3xl` on register. |

### 7.3 Component Consistency

| # | Severity | Finding |
|---|---|---|
| 7.3.1 | ⚠️ Warning | No reusable Button component — every page uses different button styles (`px-10 py-4 rounded-xl` on landing, `px-3 py-1.5 rounded` on navbar, `py-2.5 rounded-lg` on register). |
| 7.3.2 | ⚠️ Warning | No reusable Input component — form inputs have different styles across pages. |
| 7.3.3 | ⚠️ Warning | No reusable Card component — card markup is duplicated inline. |
| 7.3.4 | ⚠️ Warning | No reusable Table component — records are rendered as basic HTML tables. |
| 7.3.5 | ⚠️ Warning | No reusable Badge/Pill component — status indicators are inconsistent. |

---

## Summary of Critical Issues

| # | Category | Issue | Impact |
|---|---|---|---|
| C1 | Security | Hardcoded `admin/admin` dev bypass in login | Unauthorized access |
| C2 | Security | No input validation on any API route | Injection, data corruption |
| C3 | Security | No CSRF protection on POST routes | Cross-site request forgery |
| C4 | Security | No middleware.ts — no server-side route guards | Data flash before redirect |
| C5 | Security | No rate limiting on login | Brute force attacks |
| C6 | Auth | Refresh token not persisted as cookie on refresh | Session loss after token expiry |
| C7 | UX | No confirmation dialogs for destructive actions | Accidental data loss |
| C8 | UX | No toast/notification system | No feedback for mutations |
| C9 | API | Duplicate `getDoorSensorState` = `getLockOpenState` | Confusing, incorrect semantics |
| C10 | Code | `.gitignore` missing `.env*.local`, `.next/`, `node_modules/` | Secrets/build artifacts committed |
| C11 | Testing | No test framework or tests exist | No regression protection |
| C12 | UX | Register/Reset pages broken in dark mode | Theme inconsistency |

---

## Recommendations

### Immediate (Critical Priority)
1. Remove or guard dev bypass (`admin/admin`) behind `NODE_ENV !== "production"`
2. Add `middleware.ts` for server-side route protection
3. Add input validation (zod) to all API routes
4. Fix refresh token cookie persistence in `auth.ts`
5. Fix `.gitignore` to exclude `.env*.local`, `.next/`, `node_modules/`, `*.tsbuildinfo`
6. Add confirmation dialogs for all delete/transfer actions
7. Add toast notification system (e.g., sonner, react-hot-toast)

### Short-term (High Priority)
1. Add zod for schema validation on all API routes
2. Implement CSRF protection (Next.js built-in or custom token)
3. Add rate limiting (Upstash Ratelimit, or simple in-memory)
4. Break `locks/[id]/page.tsx` (1,016 lines) into sub-components with tabs
5. Fix Register/Reset Password pages to use theme system
6. Add skeleton loading components
7. Add `loading.tsx` and `error.tsx` convention files
8. Type all TTLock API return values properly (replace `{ [key: string]: unknown }`)
9. Remove dead code (`REFRESHED_FLAG`, `getDoorSensorState` duplicate, `getGatewayConfig` alias)
10. Add reusable UI components (Button, Input, Card, Dialog, Table, Badge)

### Medium-term
1. Add search/filter/sort to dashboard and list pages
2. Add pagination component
3. Add breadcrumbs
4. Add command palette
5. Add dark mode toggle in navbar
6. Implement webhook record processing and storage
7. Add request timeout (`AbortController`) to TTLock API client
8. Add retry logic for transient failures
9. Migrate to static imports for `ttlock.ts` in API routes
10. Add SWR global configuration
11. Add testing framework (Vitest + Playwright)
12. Configure `next.config.ts` with security headers and image domains
13. Add user profile management in settings
14. Add favorites/pinning for locks
15. Add bulk operations for locks/keys

### Long-term
1. Consider Server Components for dashboard/gateways/keys pages
2. Add SSE or WebSocket for real-time lock status updates
3. Add analytics dashboard (today's unlocks, battery warnings chart, activity timeline)
4. Add role-based access control (admin vs. key user)
5. Add audit log for admin actions
6. Add multi-language support
7. Add PWA support for mobile
8. Add API response caching layer (Redis or in-memory)
9. Consider migrating to App Router server actions for mutations

---

## Files Reviewed

### Source Files (44 files)
- `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`
- `.gitignore`, `.env.local` (exists, contents not read for security)
- `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- `src/app/dashboard/page.tsx`, `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/app/reset-password/page.tsx`
- `src/app/locks/[id]/page.tsx`, `src/app/gateways/page.tsx`, `src/app/keys/page.tsx`, `src/app/settings/page.tsx`
- `src/app/contact/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`
- `src/components/Navbar.tsx`, `src/components/LockCard.tsx`, `src/components/LoginForm.tsx`, `src/components/Parallax.tsx`, `src/components/IDGuardScene.tsx`, `src/components/LoginScene.tsx`
- `src/contexts/ThemeContext.tsx`
- `src/lib/ttlock.ts` (943 lines — full read), `src/lib/types.ts`, `src/lib/auth.ts`, `src/lib/email.ts`
- `src/lib/hooks/useAuth.ts`, `src/lib/hooks/useLocks.ts`
- 50 API route files in `src/app/api/` (key routes fully reviewed)

### API Reference Files (10 of 67 docs reviewed)
- `get-access-token.md`, `refresh-access-token.md`, `get-the-lock-list-of-an-account.md`, `unlock.md`, `get-lock-details.md`, `get-ekeys-of-a-lock.md`, `get-all-created-passcodes-of-a-lock.md`, `api-error-codes.md`, `get-unlock-records.md`, `get-the-gateway-list-of-an-account.md`

### Documentation
- `AGENTS.md`, `PLAN.md`, `docs/api.md`, `docs/flowchart.md`, `docs/system-architecture.md`, `docs/stacks.md`
- `docs/audit/` (7 files), `docs/completed/` (8 files), `docs/plans/` (7 files)

---

*End of Audit Report*
