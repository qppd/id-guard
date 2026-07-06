# ID Guard

A Next.js web application for managing TTLock-compatible smart locks remotely via the TTLock Cloud API V3.

## Features

- **Remote Lock/Unlock** — Lock and unlock devices from anywhere
- **Passcodes** — Create, edit, and delete permanent/timed/cyclic passcodes
- **IC Cards & Fingerprints** — Manage credential registrations
- **eKeys** — Share, freeze, unfreeze, update, and delete digital keys
- **Unlock Records** — View unlock history with type labels
- **Gateways** — Monitor gateway online/offline status
- **Firmware** — Check and trigger lock firmware upgrades
- **Lock Config** — View and modify lock settings
- **Door Sensor** — Real-time door open/closed state
- **Webhook** — Receive TTLock event callbacks

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 |
| Data Fetching | SWR 2 |
| API Target | TTLock Cloud API V3 (sciener.com) |

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Fill in TTLOCK_CLIENT_ID and TTLOCK_CLIENT_SECRET

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your TTLock account credentials.

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── app/
│   ├── api/              # 17 API route handlers
│   ├── dashboard/        # Dashboard page
│   ├── gateways/         # Gateway list page
│   ├── keys/             # eKey management page
│   ├── locks/[id]/       # Lock detail page
│   ├── login/            # Login page
│   ├── layout.tsx        # Root layout + Navbar
│   └── page.tsx          # Landing/redirect
├── components/
│   ├── LockCard.tsx      # Lock card (lock/unlock)
│   ├── LoginForm.tsx     # Login form
│   └── Navbar.tsx        # Navigation bar
└── lib/
    ├── ttlock.ts         # TTLock API client (24 endpoints)
    ├── types.ts          # TypeScript interfaces
    └── hooks/
        ├── useAuth.ts    # Auth hook (login/logout/check)
        └── useLocks.ts   # Locks hook (list/toggle)

docs/                      # Documentation
```

## Documentation

See the [docs/](./docs) folder for:

- [System Architecture](./docs/system-architecture.md)
- [API Reference](./docs/api.md)
- [Technology Stack](./docs/stacks.md)
- [Flowchart](./docs/flowchart.md)

## Environment Variables

| Variable | Description |
|---|---|
| `TTLOCK_CLIENT_ID` | TTLock API client ID |
| `TTLOCK_CLIENT_SECRET` | TTLock API client secret |
| `TTLOCK_WEBHOOK_SECRET` | (Optional) Webhook signature verification |

## License

Private project.

## Author

**Sajed Lopez Mendoza**

| | |
|---|---|
| Portfolio | [sajed-lopez-mendoza.vercel.app](https://sajed-lopez-mendoza.vercel.app) |
| GitHub | [github.com/qppd](https://github.com/qppd) |
| Facebook (Dev Account) | [facebook.com/qppd.dev](https://facebook.com/qppd.dev) |
| Facebook (QPPD Page) | [facebook.com/QPPD](https://facebook.com/QPPD) |
| TikTok | [@jed.lopez.mendoza.dev](https://tiktok.com/@jed.lopez.mendoza.dev) |
| Email | [quezon.province.pd@gmail.com](mailto:quezon.province.pd@gmail.com) |
