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
