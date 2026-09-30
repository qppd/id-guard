import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
  // all=1 fetches every page from TTLock (default); all=0 keeps single-page behavior
  const fetchAll = req.nextUrl.searchParams.get("all") !== "0";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  if (isNaN(lockId)) {
    return NextResponse.json({ ok: false, error: "lockId required" }, { status: 400 });
  }

  const result = await callWithAuth(async (token) => {
    const { listRecords, listAllRecords } = await import("@/lib/ttlock");
    if (fetchAll) {
      return listAllRecords(token, lockId);
    }
    return listRecords(token, lockId, page);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data.list, total: result.data.total });
}
