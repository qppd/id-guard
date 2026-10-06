# Software Requirements Specification — ID GUARD Web Portal

## Document Information

| Item | Detail |
|---|---|
| System name | ID GUARD Web Portal |
| Document type | Software requirements (technical stack) |
| Version | 1.0 |
| Date prepared | 06 October 2026 |
| Deployment URL | https://slsu-id-guard.vercel.app/ |
| Source repository | https://github.com/qppd/id-guard |
| Status | Final |

This document lists the software requirements of the ID GUARD Web Portal. Each entry was taken
directly from the project's dependency manifests, configuration files, and source code rather
than from earlier design notes. Where older documentation contradicts the implementation, the
implementation is treated as the correct reference; these differences are recorded in Section 10.

---

## 1. Purpose and Scope

The ID GUARD Web Portal is a browser-based application for managing TTLock-compatible smart
locks. It presents lock status, credentials, and access records to the user and forwards all
commands to the TTLock cloud platform.

The requirements below are grouped into six areas: the frontend, the backend, data storage,
hosting, the external API integration, and the supporting software needed to build and operate
the system.

---

## 2. Frontend Technologies

| Function | Technology | Version |
|---|---|---|
| Programming language | TypeScript | 5.9.3 |
| UI library | React | 19.2.4 |
| Application framework | Next.js (App Router) | 16.2.9 |
| Styling | Tailwind CSS with `@tailwindcss/postcss` | 4.3.1 |
| Data fetching and caching | SWR | 2.4.2 |
| Interface animations | Framer Motion | 12.42.2 |
| 3D rendering | Three.js | 0.185.1 |
| 3D component binding | React Three Fiber | 9.6.1 |
| 3D helper components | Drei | 10.7.7 |
| Typography | Poppins (headings) and Inter (body), loaded through `next/font/google` | as served by Google Fonts |
| Build tool | Turbopack, included with Next.js 16 | bundled |

Versions shown above are the exact versions installed by the package manager, as recorded in
`package-lock.json`. The versions declared in `package.json` use range notation for most
packages (for example, `^5` for TypeScript and `^4` for Tailwind CSS).

The frontend is composed of React client components rendered by the Next.js App Router with
server-side rendering. Styling is applied through Tailwind utility classes at the component
level; no CSS modules, styled-components, or third-party UI component library are used.

The main libraries are used as follows:

- SWR supplies cached data for the dashboard, lock detail, keys, and gateway pages, and for the
  `useAuth` and `useLocks` hooks.
- Framer Motion handles transitions and scroll effects on the landing page, login page, navbar,
  login form, and parallax section.
- Three.js, together with React Three Fiber and Drei, renders the 3D scenes on the landing and
  login screens.

All three 3D and animation libraries are in active use; no unused frontend dependency remains
in the production bundle.

---

## 3. Backend Technologies

The backend is not a standalone service. It runs inside the same Next.js application as route
handlers located under `src/app/api/`.

| Component | Technology | Notes |
|---|---|---|
| Server runtime | Node.js | Version 24.14.1 in the development environment |
| Server framework | Next.js 16 Route Handlers | Uses `NextRequest` and `NextResponse` |
| Number of API endpoints | 50 route handlers | Across all feature groups |
| Number of pages | 12 pages | Each with a `page.tsx` entry file |
| Source files | 77 TypeScript files | Under `src/` |
| Outbound HTTP client | Native `fetch()` | No third-party HTTP library |
| Password preparation | `node:crypto` MD5 hashing | Required by the TTLock authentication protocol |
| Email delivery | Nodemailer 9.0.3 | Optional; sends eKey and unlock link notifications |
| Configuration | Environment variables | Read through `process.env` |

The endpoint groups cover user login and session handling, account registration and password
reset, locks (listing, lock and unlock actions, naming, settings, battery level, timing,
passage and working modes, firmware upgrade), passcodes, IC cards, fingerprints, unlock
records, eKeys (sharing, authorization, validity period, unlock links), gateways, user
account listing, contact submission, and webhook callbacks.

### 3.1 Authentication

The portal does not use a third-party authentication library. It implements its own session
handling on top of the TTLock OAuth2 service:

1. The user submits a username and password to `POST /api/login`.
2. The server hashes the password with MD5 and exchanges it for tokens at TTLock's
   `POST /oauth2/token` endpoint.
3. The returned access token and refresh token are stored in httpOnly cookies named `tt_token`
   and `tt_refresh`. The `secure` flag is set when the application runs in production mode.
4. Each route handler verifies the presence of the token before processing a request and
   returns HTTP 401 when it is missing.
5. If TTLock reports that a token has expired, the handler refreshes it once and retries the
   request. If refreshing fails, the user is asked to sign in again.

The TTLock client identifier and secret are never sent to the browser. They are read only in
server-side code, which is loaded through dynamic imports so that the values are not included
in client-side bundles.

---

## 4. Data Storage

The system does not use a database. There is no database server, object store, ORM, migration
file, or server-side data file anywhere in the project.

All access-control data, including locks, passcodes, IC cards, fingerprints, eKeys, unlock
records, gateways, and user accounts, is retrieved from or written to the TTLock cloud platform
when a request is made. The portal therefore acts as a presentation and command layer, while
the TTLock cloud platform remains the system of record.

The only storage used by the application is browser `localStorage`, which holds two categories
of non-sensitive data:

| Storage key | Content |
|---|---|
| Theme preferences | Interface theme, accent colour, and display density |
| Passcode registry | Local metadata for passcodes created through the portal |

Because the server holds no state between requests, the deployed instance runs as stateless
serverless functions.

---

## 5. Hosting and Deployment

| Item | Detail |
|---|---|
| Hosting provider | Vercel |
| Deployment address | https://slsu-id-guard.vercel.app/ |
| Compute model | Vercel serverless functions running the Next.js runtime |
| Continuous deployment | GitHub repository `qppd/id-guard`, connected to Vercel through Git integration |
| Project configuration | `.vercel/project.json` present; no `vercel.json`, so default Next.js settings apply |
| Build command | `next build`, managed by Vercel |
| Domain | Default `*.vercel.app` subdomain; no custom domain configured |
| Secret storage | Vercel environment variables, accessible only to server-side code |

### 5.1 Required environment variables

| Variable | Read by | Purpose | Required |
|---|---|---|---|
| `TTLOCK_CLIENT_ID` | `src/lib/ttlock.ts` | TTLock API client identifier | Yes |
| `TTLOCK_CLIENT_SECRET` | `src/lib/ttlock.ts` | TTLock API client secret | Yes |
| `SMTP_HOST` | `src/lib/email.ts` | Outgoing mail server hostname | No |
| `SMTP_PORT` | `src/lib/email.ts` | Mail server port; defaults to 587 | No |
| `SMTP_USER` | `src/lib/email.ts` | Mail account username | No |
| `SMTP_PASS` | `src/lib/email.ts` | Mail account password | No |
| `SMTP_FROM` | `src/lib/email.ts` | Sender address; falls back to `SMTP_USER`, then `noreply@idguard.app` | No |

The application raises an error at runtime if either TTLock variable is missing. Email
notifications are skipped quietly when the SMTP variables are absent, and the affected
features continue to work without them.

---

## 6. External API Integration

The portal communicates with the TTLock Cloud API, version 3.

| Aspect | Detail |
|---|---|
| API name | TTLock Cloud API V3 |
| Base URL | https://euapi.ttlock.com |
| Transport | HTTPS |
| Request method | POST for nearly all endpoints; `GET /v3/user/list` is the only exception |
| Request body format | `application/x-www-form-urlencoded` |
| Response format | JSON, with success indicated by `errcode = 0` and failures described in `errmsg` |
| Standard parameters | `clientId`, `accessToken`, and `date` (current time in milliseconds) |
| Authentication | OAuth2 token exchange at `POST /oauth2/token` |
| Token renewal | `POST /oauth2/token` with `grant_type=refresh_token` |
| Callback reception | `POST /api/webhook`, which accepts unlock-record notifications from TTLock |
| Client implementation | Hand-written wrapper in `src/lib/ttlock.ts`; no SDK or REST client library is used |

Passwords are hashed with MD5 before they are submitted, as required by the TTLock
authentication protocol. The integration layer performs approximately seventy operations
covering locks, passcodes, credentials, records, eKeys, gateways, and user accounts.

### 6.1 Request flow

```
User's browser (React, SWR)
    |
    v
Next.js route handler  -- reads the tt_token cookie, returns 401 if absent
    |
    v
src/lib/ttlock.ts  -- server-only module, loaded by dynamic import
    |
    v
https://euapi.ttlock.com/v3/...  -- clientId + accessToken + date
    |
    v
TTLock cloud  -->  TTLock gateway  -->  smart lock
```

### 6.2 Webhook handling

TTLock posts unlock-record notifications to `/api/webhook` as form-encoded data (JSON is also
accepted). The handler parses the notification, records the payload in the server log, and
returns the literal response body `success`, which the TTLock platform requires. The endpoint
does not currently verify a signature or shared secret.

---

## 7. Supporting Software and Environment Requirements

### 7.1 Build and development environment

| Requirement | Version |
|---|---|
| Node.js | Version 20 or later is recommended; version 24.14.1 was used during development |
| npm | 11.12.1 |
| Git | Required for version control and Vercel deployment |
| Source hosting | GitHub |

### 7.2 Development-only dependencies

These packages are used for building, linting, and verification. They are not included in the
deployed application.

| Package | Version | Purpose |
|---|---|---|
| TypeScript | 5.9.3 | Static type checking |
| ESLint | 9.39.4 | Code quality checks |
| `eslint-config-next` | 16.2.9 | Next.js lint rules |
| `@types/react` | ^19 | React type definitions |
| `@types/react-dom` | ^19 | React DOM type definitions |
| `@types/node` | ^20 | Node.js type definitions |
| `@types/nodemailer` | ^8.0.1 | Nodemailer type definitions |
| `@types/three` | ^0.185.1 | Three.js type definitions |
| jsdom | ^29.1.1 | Test scripts |
| Mermaid | ^12.0.0 | Diagram validation |

### 7.3 Project commands

| Command | Action |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run check:mermaid` | Validate diagrams in the documentation |

### 7.4 External accounts and services

| Requirement | Purpose | Mandatory |
|---|---|---|
| TTLock developer account | Issues the API client identifier and secret | Yes |
| TTLock cloud account | Used by the operator to sign in to the portal | Yes |
| TTLock smart lock hardware | Device under management | Yes, for actual operation |
| TTLock gateway | Provides cloud connectivity for the lock | Yes, for remote operation |
| SMTP mailbox or provider | Outgoing notification emails | No |
| Vercel account | Hosting and environment variable storage | Yes, for the deployed portal |
| GitHub repository | Version control and deployment pipeline | Yes, for the current deployment |

### 7.5 Client-side requirements

- A current version of a mainstream browser supporting ES2017 or later, `fetch`,
  `localStorage`, and WebGL.
- JavaScript enabled. No plug-ins, extensions, or additional client software are required.
- No mobile application is needed; the portal is used entirely through the browser.

---

## 8. Summary of Production Dependencies

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

**Summary for reference:** the ID GUARD Web Portal is a full-stack TypeScript application built
with Next.js 16.2.9 and React 19.2.4, styled with Tailwind CSS 4.3.1, and served through
Next.js route handlers running on Node.js. It uses no database, since all access-control data
is obtained in real time from the TTLock Cloud API V3 at https://euapi.ttlock.com through an
OAuth2-authenticated server-side integration. The application is deployed as serverless
functions on Vercel.

---

## 9. Project Files and Structure

| File | Description |
|---|---|
| `package.json` | Dependency manifest and project scripts |
| `package-lock.json` | Locked dependency versions |
| `next.config.ts` | Next.js configuration; currently uses all defaults |
| `tsconfig.json` | TypeScript configuration (strict mode, ES2017 target, `@/*` path alias) |
| `postcss.config.mjs` | Tailwind CSS 4 PostCSS plugin |
| `eslint.config.mjs` | ESLint 9 flat configuration |
| `.env.local` | Local environment variables (seven keys, not committed to source control) |
| `src/lib/ttlock.ts` | TTLock API client |
| `src/lib/auth.ts` | Session and token refresh handling |
| `src/app/api/` | 50 API route handlers |
| `src/app/` | 12 pages |
| `docs/` | Project documentation |

---

## 10. Differences from Earlier Documentation

The following items were identified during the review of the source code. Earlier documents
should be read against these corrections.

| No. | Earlier documentation states | Actual implementation | Reference |
|---|---|---|---|
| 1 | API base URL is `https://api.sciener.com` | Base URL is `https://euapi.ttlock.com` | `src/lib/ttlock.ts`, line 4 |
| 2 | 17 API routes and 24 API endpoints | 50 route handlers and approximately 70 TTLock operations | Project file listing |
| 3 | An optional `TTLOCK_WEBHOOK_SECRET` variable is available | The variable is never read by the code and the webhook performs no signature verification | Search across `src/` |
| 4 | An `.env.example` file is provided for setup | No such file exists in the project | Project file listing |
| 5 | Node.js version 20 or later is required | No `engines` field is declared in `package.json`; development used Node.js 24.14.1 | `package.json` |
| 6 | The contact form sends an email | `POST /api/contact` writes the message to the server log only | `src/app/api/contact/route.ts` |

Two further items are noted for maintenance rather than for requirements:

1. `.gitignore` excludes only `.vercel`, so build output and local environment files are not
   excluded from version control. This was previously recorded in `audits/AUDIT.md` as finding
   1.2.7.
2. The Git remote URL contains a personal access token in plain text. The token should be
   revoked and replaced with credential-manager or SSH-based authentication.
