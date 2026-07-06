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

    const { listFingerprints } = await import("@/lib/ttlock");
    const data = await listFingerprints(token, lockId);
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
    const { action, lockId, fingerprintId, fingerprintNumber, fingerprintName, startDate, endDate } = await req.json();
    const { addFingerprint, deleteFingerprint } = await import("@/lib/ttlock");

    if (action === "add") {
      const data = await addFingerprint(token, lockId, fingerprintNumber, fingerprintName, startDate, endDate);
      return NextResponse.json({ ok: true, data });
    }

    if (action === "delete") {
      const data = await deleteFingerprint(token, lockId, fingerprintId);
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
