import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
  if (isNaN(lockId)) {
    return NextResponse.json({ ok: false, error: "lockId required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { getLockBattery } = await import("@/lib/ttlock");
    return getLockBattery(token, lockId);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(req: NextRequest) {
  const { lockId, electricQuantity } = await req.json();
  if (!lockId || electricQuantity == null) {
    return NextResponse.json({ ok: false, error: "lockId and electricQuantity required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { uploadLockBattery } = await import("@/lib/ttlock");
    return uploadLockBattery(token, lockId, electricQuantity);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
