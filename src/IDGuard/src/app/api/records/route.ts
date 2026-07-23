import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  if (isNaN(lockId)) {
    return NextResponse.json({ ok: false, error: "lockId required" }, { status: 400 });
  }

  const result = await callWithAuth(async (token) => {
    const { listRecords } = await import("@/lib/ttlock");
    return listRecords(token, lockId, page);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data.list, total: result.data.total });
}
