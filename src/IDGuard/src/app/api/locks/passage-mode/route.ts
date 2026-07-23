import { NextRequest, NextResponse } from "next/server";
import { callWithAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const lockId = parseInt(req.nextUrl.searchParams.get("lockId") || "");
  if (isNaN(lockId)) {
    return NextResponse.json({ ok: false, error: "lockId required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { getPassageMode } = await import("@/lib/ttlock");
    return getPassageMode(token, lockId);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(req: NextRequest) {
  const { lockId, passageMode, type, cyclicConfig, autoUnlock } = await req.json();
  if (!lockId || passageMode === undefined || !type) {
    return NextResponse.json({ ok: false, error: "lockId, passageMode, type required" }, { status: 400 });
  }
  const result = await callWithAuth(async (token) => {
    const { configurePassageMode } = await import("@/lib/ttlock");
    return configurePassageMode(token, lockId, passageMode, type, cyclicConfig, autoUnlock);
  });
  if (!result.ok) return result.response;
  return NextResponse.json({ ok: true, data: result.data });
}
