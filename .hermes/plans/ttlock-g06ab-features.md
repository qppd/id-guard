# TTLock G06AB + G2 Gateway Features Implementation Plan

> **Goal:** Add all Cloud API V3 features needed for a G06AB lock with G2 WiFi gateway
> **Architecture:** New API routes + new pages + enhanced Components, reusing existing `ttlock.ts` client
> **Tech Stack:** Next.js 16, React 19, SWR, Tailwind CSS 4

## Features to Add (ordered by priority for G06AB+G2)

1. **Lock Detail page** — full lock info (battery, firmware, adminPwd, MAC, version)
2. **Gateway list + status** — see G2 gateway online/offline, locks per gateway
3. **Passcode management** — list, create (permanent/timed/cyclic), delete passcodes
4. **Unlock records** — access logs with timestamps, unlock types, success/fail
5. **Lock firmware upgrade** — check available upgrade, trigger upgrade
6. **Enhanced Navbar** — navigation to new pages
7. **Dashboard enhancements** — gateway status, passcode count, recent records

---

## Task 1: Lock Detail — API Route

**Objective:** Add `GET /api/locks/[id]` route that fetches lock detail via TTLock API

**Files:**
- Create: `src/app/api/locks/[id]/route.ts`

**Complete code:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const lockId = parseInt(id);
    if (isNaN(lockId)) {
      return NextResponse.json({ ok: false, error: "Invalid lock ID" }, { status: 400 });
    }

    const { lockDetail } = await import("@/lib/ttlock");
    const data = await lockDetail(token, lockId);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to fetch lock detail" },
      { status: 502 }
    );
  }
}
```

---

## Task 2: Gateway APIs — API Routes

**Objective:** Add gateway list and gateway-by-lock endpoints

**Files:**
- Create: `src/app/api/gateways/route.ts`
- Create: `src/app/api/gateways/[action]/route.ts`
- Modify: `src/lib/ttlock.ts` (add missing gateway functions)

**Step 1: Add gateway functions to `ttlock.ts`** (already has `listGateways` — verify existing)

Existing `listGateways` function in ttlock.ts calls `POST /v3/gateway/list`. We need to add:
- `listGatewaysByLock` — `POST /v3/gateway/listByLock`

Add to `src/lib/ttlock.ts`:

```typescript
// Add after existing listGateways function
export async function listGatewaysByLock(accessToken: string, lockId: number) {
  return apiPost<{ list: Record<string, unknown>[] }>("/v3/gateway/listByLock", {
    lockId: String(lockId),
  }, accessToken);
}
```

**Step 2: Create `src/app/api/gateways/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { listGateways } = await import("@/lib/ttlock");
    const data = await listGateways(token);
    return NextResponse.json({ ok: true, data: data.list });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to fetch gateways" },
      { status: 502 }
    );
  }
}
```

**Step 3: Create `src/app/api/gateways/[action]/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { action } = await params;
    const { lockId } = await req.json();

    if (action === "listByLock") {
      const { listGatewaysByLock } = await import("@/lib/ttlock");
      const data = await listGatewaysByLock(token, lockId);
      return NextResponse.json({ ok: true, data: data.list });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Action failed" },
      { status: 502 }
    );
  }
}
```

---

## Task 3: Passcode APIs — API Routes

**Objective:** Add passcode CRUD endpoints

**Files:**
- Create: `src/app/api/passcodes/route.ts`

**Step 1: Add passcode functions to `src/lib/ttlock.ts`:**

```typescript
// Passcode types
export async function listPasscodes(accessToken: string, lockId: number) {
  return apiPost<{ list: Record<string, unknown>[] }>("/v3/passcode/list", {
    lockId: String(lockId),
    pageNo: "1",
    pageSize: "50",
  }, accessToken);
}

export async function addPasscode(
  accessToken: string,
  lockId: number,
  passcode: string,
  type: number, // 1=permanent, 2=timed, 3=cyclic, 4=clear, 5=delete
  startDate?: number,
  endDate?: number
) {
  const params: Record<string, string> = {
    lockId: String(lockId),
    passcode,
    type: String(type),
    addType: "2", // cloud added
  };
  if (startDate) params.startDate = String(startDate);
  if (endDate) params.endDate = String(endDate);
  return apiPost<Record<string, unknown>>("/v3/passcode/add", params, accessToken);
}

export async function deletePasscode(accessToken: string, lockId: number, passcodeId: number) {
  return apiPost<Record<string, unknown>>("/v3/passcode/delete", {
    lockId: String(lockId),
    passcodeId: String(passcodeId),
  }, accessToken);
}
```

**Step 2: Create `src/app/api/passcodes/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
    if (isNaN(lockId)) {
      return NextResponse.json({ ok: false, error: "lockId required" }, { status: 400 });
    }

    const { listPasscodes } = await import("@/lib/ttlock");
    const data = await listPasscodes(token, lockId);
    return NextResponse.json({ ok: true, data: data.list });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed" },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { action, lockId, passcode, type, startDate, endDate, passcodeId } = await req.json();

    const { addPasscode, deletePasscode } = await import("@/lib/ttlock");

    if (action === "add") {
      const data = await addPasscode(token, lockId, passcode, type, startDate, endDate);
      return NextResponse.json({ ok: true, data });
    }

    if (action === "delete") {
      const data = await deletePasscode(token, lockId, passcodeId);
      return NextResponse.json({ ok: true, data });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed" },
      { status: 502 }
    );
  }
}
```

---

## Task 4: Unlock Records — API Route

**Objective:** List unlock records/access logs

**Files:**
- Create: `src/app/api/records/route.ts`

**Step 1: Add record function to `src/lib/ttlock.ts`:**

```typescript
export async function listRecords(accessToken: string, lockId: number, page = 1, size = 50) {
  return apiPost<{ list: Record<string, unknown>[]; total: number }>("/v3/record/list", {
    lockId: String(lockId),
    pageNo: String(page),
    pageSize: String(size),
  }, accessToken);
}
```

**Step 2: Create `src/app/api/records/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");

    if (isNaN(lockId)) {
      return NextResponse.json({ ok: false, error: "lockId required" }, { status: 400 });
    }

    const { listRecords } = await import("@/lib/ttlock");
    const data = await listRecords(token, lockId, page);
    return NextResponse.json({ ok: true, data: data.list, total: data.total });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed" },
      { status: 502 }
    );
  }
}
```

---

## Task 5: Lock Firmware Upgrade — API Route

**Objective:** Check and trigger firmware upgrade

**Files:**
- Create: `src/app/api/locks/upgrade/route.ts`

**Step 1: Add upgrade functions to `src/lib/ttlock.ts`:**

```typescript
export async function checkUpgrade(accessToken: string, lockId: number) {
  return apiPost<{ needUpgrade: number; firmwareInfo?: string }>("/v3/lock/checkUpgrade", {
    lockId: String(lockId),
  }, accessToken);
}

export async function upgradeFirmware(accessToken: string, lockId: number) {
  return apiPost<Record<string, unknown>>("/v3/lock/upgrade", {
    lockId: String(lockId),
  }, accessToken);
}
```

**Step 2: Create `src/app/api/locks/upgrade/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { action, lockId } = await req.json();
    const { checkUpgrade, upgradeFirmware } = await import("@/lib/ttlock");

    if (action === "check") {
      const data = await checkUpgrade(token, lockId);
      return NextResponse.json({ ok: true, data });
    }

    if (action === "start") {
      const data = await upgradeFirmware(token, lockId);
      return NextResponse.json({ ok: true, data });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed" },
      { status: 502 }
    );
  }
}
```

---

## Task 6: Enhanced Navbar — Navigation Links

**Objective:** Add links to all new pages

**Modify:** `src/components/Navbar.tsx`

Replace the nav links section:

```tsx
{isAuthenticated && (
  <div className="flex items-center gap-4">
    <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition-colors">
      Dashboard
    </Link>
    <Link href="/gateways" className="text-sm text-gray-300 hover:text-white transition-colors">
      Gateways
    </Link>
    <Link href="/keys" className="text-sm text-gray-300 hover:text-white transition-colors">
      Keys
    </Link>
    <button
      onClick={handleLogout}
      className="text-sm px-3 py-1.5 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
    >
      Logout
    </button>
  </div>
)}
```

---

## Task 7: Dashboard Enhancements

**Objective:** Show gateways summary + recent records in dashboard

---

## Task 8: Lock Detail Page + Passcode Page + Records Page + Gateways Page

**New pages to create:**
- `src/app/locks/[id]/page.tsx` — lock detail, passcodes, records, upgrade
- `src/app/gateways/page.tsx` — gateway list
- `src/app/records/page.tsx` — unlock records list

---

## Execution Order

1. Task 1: Lock Detail API route
2. Task 2: Gateway APIs (ttlock.ts + routes)
3. Task 3: Passcode APIs (ttlock.ts + routes)
4. Task 4: Records API (ttlock.ts + route)
5. Task 5: Upgrade API (ttlock.ts + route)
6. Task 6: Navbar links
7. Task 7: Passcode page UI
8. Task 8: Records page UI
9. Task 9: Gateways page UI
10. Task 10: Lock Detail page UI + Enhance Dashboard
